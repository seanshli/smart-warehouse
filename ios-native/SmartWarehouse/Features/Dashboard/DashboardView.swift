import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Stats Cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        StatCard(
                            title: "totalItems".localized,
                            value: "\(viewModel.stats?.totalItems ?? 0)",
                            icon: "cube.box",
                            color: .blue
                        )
                        
                        StatCard(
                            title: "rooms".localized,
                            value: "\(viewModel.stats?.totalRooms ?? 0)",
                            icon: "door.left.hand.open",
                            color: .green
                        )
                        
                        StatCard(
                            title: "categories".localized,
                            value: "\(viewModel.stats?.totalCategories ?? 0)",
                            icon: "folder",
                            color: .orange
                        )
                        
                        StatCard(
                            title: "lowStock".localized,
                            value: "\(viewModel.stats?.lowStockItems ?? 0)",
                            icon: "exclamationmark.triangle",
                            color: .red
                        )
                    }
                    .padding(.horizontal)
                    
                    // Recent Items
                    if let recentItems = viewModel.stats?.recentItems, !recentItems.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("recentItems".localized)
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(recentItems.prefix(5)) { item in
                                RecentItemRow(item: item)
                            }
                        }
                    }
                    
                    // Low Stock Alert
                    if let lowStockCount = viewModel.stats?.lowStockItems, lowStockCount > 0 {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("lowStockAlert".localized)
                                .font(.headline)
                                .padding(.horizontal)
                            
                            AlertCard(
                                message: "lowStockMessage".localized(with: lowStockCount),
                                icon: "exclamationmark.triangle.fill",
                                color: .orange
                            )
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("dashboard".localized)
            .refreshable {
                await viewModel.loadStats()
            }
            .task {
                await viewModel.loadStats()
            }
            .overlay {
                if viewModel.isLoading && viewModel.stats == nil {
                    ProgressView()
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct RecentItemRow: View {
    let item: Item
    
    var body: some View {
        HStack {
            // Image placeholder
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay {
                    if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                        AsyncImage(url: url) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Image(systemName: "cube.box")
                                .foregroundColor(.gray)
                        }
                    } else {
                        Image(systemName: "cube.box")
                            .foregroundColor(.gray)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(item.displayLocation)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text("×\(item.quantity)")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(item.isLowStock ? .red : .primary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

struct AlertCard: View {
    let message: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
            
            Text(message)
                .font(.subheadline)
            
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    DashboardView()
}
