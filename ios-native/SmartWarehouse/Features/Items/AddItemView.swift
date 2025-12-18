import SwiftUI

struct AddItemView: View {
    @ObservedObject var viewModel: ItemsViewModel
    @Environment(\.dismiss) var dismiss
    
    let editingItem: Item?
    
    @State private var name = ""
    @State private var description = ""
    @State private var quantity = 1
    @State private var minQuantity = 0
    @State private var barcode = ""
    @State private var selectedRoomId = ""
    @State private var selectedCabinetId = ""
    @State private var selectedCategoryId = ""
    
    @StateObject private var roomsVM = RoomsViewModel()
    @StateObject private var categoriesVM = CategoriesViewModel()
    
    var isEditing: Bool { editingItem != nil }
    
    init(viewModel: ItemsViewModel, editingItem: Item? = nil) {
        self.viewModel = viewModel
        self.editingItem = editingItem
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("basicInfo".localized) {
                    TextField("itemName".localized, text: $name)
                    
                    TextField("description".localized, text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    
                    Stepper("quantity".localized + ": \(quantity)", value: $quantity, in: 0...9999)
                    
                    Stepper("minQuantity".localized + ": \(minQuantity)", value: $minQuantity, in: 0...9999)
                }
                
                Section("location".localized) {
                    Picker("room".localized, selection: $selectedRoomId) {
                        Text("selectRoom".localized).tag("")
                        ForEach(roomsVM.rooms) { room in
                            Text(room.name).tag(room.id)
                        }
                    }
                    
                    if let selectedRoom = roomsVM.rooms.first(where: { $0.id == selectedRoomId }),
                       let cabinets = selectedRoom.cabinets, !cabinets.isEmpty {
                        Picker("cabinet".localized, selection: $selectedCabinetId) {
                            Text("selectCabinet".localized).tag("")
                            ForEach(cabinets) { cabinet in
                                Text(cabinet.name).tag(cabinet.id)
                            }
                        }
                    }
                }
                
                Section("category".localized) {
                    Picker("category".localized, selection: $selectedCategoryId) {
                        Text("selectCategory".localized).tag("")
                        ForEach(categoriesVM.categories) { category in
                            Text(category.name).tag(category.id)
                        }
                    }
                }
                
                Section("barcode".localized) {
                    HStack {
                        TextField("barcode".localized, text: $barcode)
                        
                        Button {
                            // TODO: Open barcode scanner
                        } label: {
                            Image(systemName: "barcode.viewfinder")
                        }
                    }
                }
                
                if let error = viewModel.errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle(isEditing ? "editItem".localized : "addItem".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("cancel".localized) {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("save".localized) {
                        save()
                    }
                    .disabled(name.isEmpty || selectedRoomId.isEmpty)
                }
            }
            .task {
                await roomsVM.loadRooms()
                await categoriesVM.loadCategories()
                
                // Pre-fill if editing
                if let item = editingItem {
                    name = item.name
                    description = item.description ?? ""
                    quantity = item.quantity
                    minQuantity = item.minQuantity
                    barcode = item.barcode ?? ""
                    selectedRoomId = item.room?.id ?? ""
                    selectedCabinetId = item.cabinet?.id ?? ""
                    selectedCategoryId = item.category?.id ?? ""
                }
            }
        }
    }
    
    private func save() {
        Task {
            if isEditing, let item = editingItem {
                let request = UpdateItemRequest(
                    name: name,
                    description: description.isEmpty ? nil : description,
                    quantity: quantity,
                    minQuantity: minQuantity,
                    category: selectedCategoryId.isEmpty ? nil : selectedCategoryId,
                    room: selectedRoomId,
                    cabinet: selectedCabinetId.isEmpty ? nil : selectedCabinetId,
                    barcode: barcode.isEmpty ? nil : barcode
                )
                
                let success = await viewModel.updateItem(item.id, request: request)
                if success {
                    dismiss()
                }
            } else {
                let request = CreateItemRequest(
                    name: name,
                    description: description.isEmpty ? nil : description,
                    quantity: quantity,
                    minQuantity: minQuantity,
                    category: selectedCategoryId.isEmpty ? nil : selectedCategoryId,
                    room: selectedRoomId,
                    cabinet: selectedCabinetId.isEmpty ? nil : selectedCabinetId,
                    barcode: barcode.isEmpty ? nil : barcode
                )
                
                let item = await viewModel.createItem(request)
                if item != nil {
                    dismiss()
                }
            }
        }
    }
}

#Preview {
    AddItemView(viewModel: ItemsViewModel())
}
