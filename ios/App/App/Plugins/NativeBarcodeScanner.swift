import Foundation
import Capacitor
import AVFoundation
import UIKit

/**
 * Native Barcode Scanner Plugin
 * Uses iOS AVFoundation framework for native barcode/QR code scanning
 */
@objc(NativeBarcodeScanner)
public class NativeBarcodeScanner: CAPPlugin {
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var currentCall: CAPPluginCall?
    private var isScanning = false
    
    /**
     * Check camera permission
     */
    @objc func checkPermission(_ call: CAPPluginCall) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        
        var result: [String: Any] = [:]
        
        switch status {
        case .authorized:
            result["granted"] = true
            result["denied"] = false
            result["asked"] = true
        case .denied, .restricted:
            result["granted"] = false
            result["denied"] = true
            result["asked"] = true
        case .notDetermined:
            result["granted"] = false
            result["denied"] = false
            result["asked"] = false
        @unknown default:
            result["granted"] = false
            result["denied"] = false
            result["asked"] = false
        }
        
        call.resolve(result)
    }
    
    /**
     * Request camera permission
     */
    @objc func requestPermission(_ call: CAPPluginCall) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            DispatchQueue.main.async {
                var result: [String: Any] = [:]
                result["granted"] = granted
                result["denied"] = !granted
                result["asked"] = true
                call.resolve(result)
            }
        }
    }
    
    /**
     * Start scanning for barcodes/QR codes
     */
    @objc func startScan(_ call: CAPPluginCall) {
        guard !isScanning else {
            call.reject("Scanner is already running")
            return
        }
        
        currentCall = call
        
        // Check permission first
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status != .authorized {
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        self?.setupAndStartScanning()
                    } else {
                        call.reject("Camera permission denied")
                    }
                }
            }
            return
        }
        
        setupAndStartScanning()
    }
    
    private func setupAndStartScanning() {
        guard let call = currentCall else { return }
        
        // Create capture session
        let session = AVCaptureSession()
        self.captureSession = session
        
        // Get default video capture device (back camera)
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            call.reject("No camera available")
            return
        }
        
        let videoInput: AVCaptureDeviceInput
        
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            call.reject("Failed to create video input: \(error.localizedDescription)")
            return
        }
        
        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        } else {
            call.reject("Cannot add video input to session")
            return
        }
        
        // Create metadata output for barcode detection
        let metadataOutput = AVCaptureMetadataOutput()
        
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            
            // Set metadata object types to scan
            metadataOutput.metadataObjectTypes = [
                .ean13,           // EAN-13 barcode
                .ean8,            // EAN-8 barcode
                .upce,            // UPC-E barcode
                .code128,         // Code 128
                .code39,          // Code 39
                .code93,          // Code 93
                .codabar,         // Codabar
                .interleaved2of5, // Interleaved 2 of 5
                .itf14,           // ITF-14
                .dataMatrix,      // Data Matrix
                .aztec,           // Aztec
                .pdf417,          // PDF417
                .qr               // QR Code
            ]
            
            // Set delegate to receive detected barcodes
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        } else {
            call.reject("Cannot add metadata output to session")
            return
        }
        
        // Create preview layer
        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        
        // Get the view controller's view
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let viewController = self.bridge?.viewController else {
                call.reject("Cannot access view controller")
                return
            }
            
            preview.frame = viewController.view.bounds
            self.previewLayer = preview
            viewController.view.layer.insertSublayer(preview, at: 0)
            
            // Start session
            session.startRunning()
            self.isScanning = true
            
            // Resolve immediately - scanning will continue until barcode is detected
            call.resolve([
                "hasContent": false,
                "content": "",
                "format": ""
            ])
        }
    }
    
    /**
     * Stop scanning
     */
    @objc func stopScan(_ call: CAPPluginCall) {
        stopScanning()
        call.resolve()
    }
    
    private func stopScanning() {
        isScanning = false
        
        if let session = captureSession {
            session.stopRunning()
            captureSession = nil
        }
        
        if let preview = previewLayer {
            preview.removeFromSuperlayer()
            previewLayer = nil
        }
        
        currentCall = nil
    }
    
    /**
     * Hide background (for full-screen camera view)
     */
    @objc func hideBackground(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let viewController = self.bridge?.viewController else {
                call.reject("Cannot access view controller")
                return
            }
            
            viewController.view.backgroundColor = .black
            call.resolve()
        }
    }
    
    /**
     * Show background (restore normal view)
     */
    @objc func showBackground(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self,
                  let viewController = self.bridge?.viewController else {
                call.reject("Cannot access view controller")
                return
            }
            
            viewController.view.backgroundColor = .systemBackground
            call.resolve()
        }
    }
}

// MARK: - AVCaptureMetadataOutputObjectsDelegate

extension NativeBarcodeScanner: AVCaptureMetadataOutputObjectsDelegate {
    public func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard isScanning,
              let call = currentCall,
              let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue else {
            return
        }
        
        // Stop scanning
        stopScanning()
        
        // Map AVMetadataObject.ObjectType to string format
        let format = mapMetadataObjectTypeToString(metadataObject.type)
        
        // Resolve with detected barcode
        call.resolve([
            "hasContent": true,
            "content": stringValue,
            "format": format
        ])
    }
    
    private func mapMetadataObjectTypeToString(_ type: AVMetadataObject.ObjectType) -> String {
        switch type {
        case .ean13:
            return "EAN_13"
        case .ean8:
            return "EAN_8"
        case .upce:
            return "UPC_E"
        case .code128:
            return "CODE_128"
        case .code39:
            return "CODE_39"
        case .code93:
            return "CODE_93"
        case .codabar:
            return "CODABAR"
        case .interleaved2of5:
            return "ITF"
        case .itf14:
            return "ITF_14"
        case .dataMatrix:
            return "DATA_MATRIX"
        case .aztec:
            return "AZTEC"
        case .pdf417:
            return "PDF_417"
        case .qr:
            return "QR_CODE"
        default:
            return "UNKNOWN"
        }
    }
}

