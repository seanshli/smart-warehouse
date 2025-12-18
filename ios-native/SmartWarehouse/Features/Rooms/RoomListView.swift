import SwiftUI

struct RoomListView: View {
    @StateObject private var viewModel = RoomsViewModel()
    @State private var showAddRoom = false
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.rooms.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView {
                        Label("noRooms".localized, systemImage: "door.left.hand.open")
                    } description: {
                        Text("addFirstRoom".localized)
                    } actions: {
                        Button("addRoom".localized) {
                            showAddRoom = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    List {
                        ForEach(viewModel.rooms) { room in
                            NavigationLink(value: room) {
                                RoomRow(room: room)
                            }
                        }
                        .onDelete { indexSet in
                            Task {
                                for index in indexSet {
                                    let room = viewModel.rooms[index]
                                    await viewModel.deleteRoom(room)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("rooms".localized)
            .navigationDestination(for: Room.self) { room in
                RoomDetailView(room: room, viewModel: viewModel)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddRoom = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadRooms()
            }
            .task {
                await viewModel.loadRooms()
            }
            .overlay {
                if viewModel.isLoading && viewModel.rooms.isEmpty {
                    ProgressView()
                }
            }
            .sheet(isPresented: $showAddRoom) {
                AddRoomView(viewModel: viewModel)
            }
        }
    }
}

struct RoomRow: View {
    let room: Room
    
    var body: some View {
        HStack {
            // Icon
            Image(systemName: room.icon ?? "door.left.hand.open")
                .font(.title2)
                .foregroundColor(.accentColor)
                .frame(width: 40, height: 40)
                .background(Color.accentColor.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(room.name)
                    .font(.headline)
                
                if let description = room.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                if let itemCount = room.count?.items {
                    Text("\(itemCount) " + "items".localized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if let cabinetCount = room.count?.cabinets, cabinetCount > 0 {
                    Text("\(cabinetCount) " + "cabinets".localized)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct RoomDetailView: View {
    let room: Room
    @ObservedObject var viewModel: RoomsViewModel
    @StateObject private var itemsViewModel = ItemsViewModel()
    
    var body: some View {
        List {
            // Room Info
            Section("info".localized) {
                if let description = room.description {
                    Text(description)
                }
                
                if let cabinets = room.cabinets, !cabinets.isEmpty {
                    DisclosureGroup("cabinets".localized + " (\(cabinets.count))") {
                        ForEach(cabinets) { cabinet in
                            Label(cabinet.name, systemImage: "archivebox")
                        }
                    }
                }
            }
            
            // Items in this room
            Section("items".localized) {
                if itemsViewModel.items.isEmpty {
                    Text("noItemsInRoom".localized)
                        .foregroundColor(.secondary)
                } else {
                    ForEach(itemsViewModel.items) { item in
                        ItemRow(item: item)
                    }
                }
            }
        }
        .navigationTitle(room.name)
        .task {
            await itemsViewModel.loadItems(roomId: room.id)
        }
        .refreshable {
            await itemsViewModel.loadItems(roomId: room.id)
        }
    }
}

struct AddRoomView: View {
    @ObservedObject var viewModel: RoomsViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var name = ""
    @State private var description = ""
    @State private var icon = "door.left.hand.open"
    
    let roomIcons = [
        "door.left.hand.open",
        "bed.double",
        "bathtub",
        "refrigerator",
        "sofa",
        "desk",
        "washer",
        "car",
        "leaf",
        "archivebox"
    ]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("roomDetails".localized) {
                    TextField("roomName".localized, text: $name)
                    
                    TextField("description".localized, text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("icon".localized) {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 50))], spacing: 12) {
                        ForEach(roomIcons, id: \.self) { iconName in
                            Button {
                                icon = iconName
                            } label: {
                                Image(systemName: iconName)
                                    .font(.title2)
                                    .frame(width: 44, height: 44)
                                    .background(icon == iconName ? Color.accentColor : Color.gray.opacity(0.2))
                                    .foregroundColor(icon == iconName ? .white : .primary)
                                    .clipShape(Circle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .navigationTitle("addRoom".localized)
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
                    .disabled(name.isEmpty)
                }
            }
        }
    }
    
    private func save() {
        Task {
            let request = CreateRoomRequest(
                name: name,
                description: description.isEmpty ? nil : description,
                icon: icon
            )
            
            let room = await viewModel.createRoom(request)
            if room != nil {
                dismiss()
            }
        }
    }
}
