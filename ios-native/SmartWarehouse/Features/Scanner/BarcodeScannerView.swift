import SwiftUI
import AVFoundation

struct BarcodeScannerView: View {
    @State private var scannedCode: String?
    @State private var showRecognitionResult = false
    @State private var recognitionResult: RecognitionResult?
    @State private var isScanning = true
    @State private var isProcessing = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Camera View
                CameraPreviewView(scannedCode: $scannedCode, isScanning: $isScanning)
                    .ignoresSafeArea()
                
                // Overlay
                VStack {
                    Spacer()
                    
                    // Scanning frame
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.white, lineWidth: 3)
                        .frame(width: 250, height: 150)
                        .overlay {
                            if isProcessing {
                                ProgressView()
                                    .scaleEffect(1.5)
                            }
                        }
                    
                    Text("pointCameraAtBarcode".localized)
                        .foregroundColor(.white)
                        .padding()
                    
                    Spacer()
                    
                    // Last scanned
                    if let code = scannedCode {
                        VStack(spacing: 8) {
                            Text("scannedCode".localized + ":")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                            
                            Text(code)
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            Button("lookUp".localized) {
                                lookupBarcode(code)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .padding()
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(12)
                        .padding(.bottom, 32)
                    }
                }
            }
            .navigationTitle("scan".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        isScanning.toggle()
                    } label: {
                        Image(systemName: isScanning ? "pause" : "play")
                    }
                }
            }
            .sheet(isPresented: $showRecognitionResult) {
                if let result = recognitionResult {
                    RecognitionResultView(result: result)
                }
            }
        }
    }
    
    private func lookupBarcode(_ code: String) {
        isProcessing = true
        
        Task {
            do {
                let request = RecognitionRequest(type: "barcode", barcode: code)
                let result: RecognitionResult = try await APIClient.shared.post(
                    endpoint: .aiRecognize,
                    body: request
                )
                recognitionResult = result
                showRecognitionResult = true
            } catch {
                print("Failed to lookup barcode: \(error)")
            }
            
            isProcessing = false
        }
    }
}

// MARK: - Camera Preview

struct CameraPreviewView: UIViewRepresentable {
    @Binding var scannedCode: String?
    @Binding var isScanning: Bool
    
    func makeUIView(context: Context) -> UIView {
        let view = CameraView()
        view.delegate = context.coordinator
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        guard let cameraView = uiView as? CameraView else { return }
        
        if isScanning {
            cameraView.startScanning()
        } else {
            cameraView.stopScanning()
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, AVCaptureMetadataOutputObjectsDelegate {
        let parent: CameraPreviewView
        
        init(_ parent: CameraPreviewView) {
            self.parent = parent
        }
        
        func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
            guard let metadataObject = metadataObjects.first,
                  let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject,
                  let stringValue = readableObject.stringValue else {
                return
            }
            
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            parent.scannedCode = stringValue
        }
    }
}

class CameraView: UIView {
    weak var delegate: AVCaptureMetadataOutputObjectsDelegate?
    
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupCamera()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupCamera()
    }
    
    private func setupCamera() {
        let session = AVCaptureSession()
        captureSession = session
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
        let videoInput: AVCaptureDeviceInput
        
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            return
        }
        
        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        } else {
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            
            metadataOutput.setMetadataObjectsDelegate(delegate, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [
                .ean8, .ean13, .pdf417, .qr, .code128, .code39, .code93, .upce
            ]
        } else {
            return
        }
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = bounds
        previewLayer.videoGravity = .resizeAspectFill
        layer.addSublayer(previewLayer)
        self.previewLayer = previewLayer
        
        startScanning()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }
    
    func startScanning() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
        }
    }
    
    func stopScanning() {
        captureSession?.stopRunning()
    }
}

// MARK: - Recognition Models

struct RecognitionRequest: Encodable {
    let type: String
    var imageBase64: String?
    var barcode: String?
}

struct RecognitionResult: Decodable, Identifiable {
    var id: String { barcode ?? UUID().uuidString }
    let name: String?
    let description: String?
    let category: String?
    let confidence: Double?
    let barcode: String?
    let language: String?
}

struct RecognitionResultView: View {
    let result: RecognitionResult
    @Environment(\.dismiss) var dismiss
    @StateObject private var itemsViewModel = ItemsViewModel()
    @StateObject private var roomsViewModel = RoomsViewModel()
    
    @State private var selectedRoomId = ""
    @State private var quantity = 1
    
    var body: some View {
        NavigationStack {
            Form {
                Section("recognizedItem".localized) {
                    if let name = result.name {
                        LabeledContent("name".localized, value: name)
                    }
                    
                    if let description = result.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if let category = result.category {
                        LabeledContent("category".localized, value: category)
                    }
                    
                    if let barcode = result.barcode {
                        LabeledContent("barcode".localized, value: barcode)
                    }
                    
                    if let confidence = result.confidence {
                        LabeledContent("confidence".localized, value: String(format: "%.0f%%", confidence * 100))
                    }
                }
                
                Section("addToInventory".localized) {
                    Picker("room".localized, selection: $selectedRoomId) {
                        Text("selectRoom".localized).tag("")
                        ForEach(roomsViewModel.rooms) { room in
                            Text(room.name).tag(room.id)
                        }
                    }
                    
                    Stepper("quantity".localized + ": \(quantity)", value: $quantity, in: 1...9999)
                }
            }
            .navigationTitle("scanResult".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("addItem".localized) {
                        addItem()
                    }
                    .disabled(result.name == nil || selectedRoomId.isEmpty)
                }
            }
            .task {
                await roomsViewModel.loadRooms()
            }
        }
    }
    
    private func addItem() {
        guard let name = result.name else { return }
        
        Task {
            let request = CreateItemRequest(
                name: name,
                description: result.description,
                quantity: quantity,
                room: selectedRoomId,
                barcode: result.barcode
            )
            
            let item = await itemsViewModel.createItem(request)
            if item != nil {
                dismiss()
            }
        }
    }
}
