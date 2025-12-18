import SwiftUI

struct ItemListView: View {
    @StateObject private var viewModel = ItemsViewModel()
    @State private var searchText = ""
    @State private var showAddItem = false
    @State private var selectedItem: Item?
    
    var filteredItems: [Item] {
        if searchText.isEmpty {
            return viewModel.items
        }
        return viewModel.items.filter { item in
            item.name.localizedCaseInsensitiveContains(searchText) ||
            (item.description?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.items.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView {
                        Label("noItems".localized, systemImage: "cube.box")
                    } description: {
                        Text("addFirstItem".localized)
                    } actions: {
                        Button("addItem".localized) {
                            showAddItem = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    List {
                        ForEach(filteredItems) { item in
                            ItemRow(item: item)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    selectedItem = item
                                }
                        }
                        .onDelete { indexSet in
                            Task {
                                for index in indexSet {
                                    let item = filteredItems[index]
                                    await viewModel.deleteItem(item)
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                    .searchable(text: $searchText, prompt: "searchItems".localized)
                }
            }
            .navigationTitle("items".localized)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddItem = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                await viewModel.loadItems()
            }
            .task {
                await viewModel.loadItems()
            }
            .overlay {
                if viewModel.isLoading && viewModel.items.isEmpty {
                    ProgressView()
                }
            }
            .sheet(isPresented: $showAddItem) {
                AddItemView(viewModel: viewModel)
            }
            .sheet(item: $selectedItem) { item in
                ItemDetailView(item: item, viewModel: viewModel)
            }
        }
    }
}

struct ItemRow: View {
    let item: Item
    
    var body: some View {
        HStack(spacing: 12) {
            // Image
            Group {
                if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Image(systemName: "cube.box")
                            .font(.title2)
                            .foregroundColor(.gray)
                    }
                } else {
                    Image(systemName: "cube.box")
                        .font(.title2)
                        .foregroundColor(.gray)
                }
            }
            .frame(width: 60, height: 60)
            .background(Color.gray.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.headline)
                
                if !item.displayLocation.isEmpty {
                    Text(item.displayLocation)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                if !item.displayCategory.isEmpty {
                    Text(item.displayCategory)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("×\(item.quantity)")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(item.isLowStock ? .red : .primary)
                
                if item.isLowStock {
                    Text("lowStock".localized)
                        .font(.caption2)
                        .foregroundColor(.red)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ItemListView()
}
