import SwiftUI

struct ItemDetailView: View {
    let item: Item
    @ObservedObject var viewModel: ItemsViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var showEditSheet = false
    @State private var showCheckoutSheet = false
    @State private var checkoutQuantity = 1
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Image
                    Group {
                        if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                            AsyncImage(url: url) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                ProgressView()
                            }
                        } else {
                            Image(systemName: "cube.box.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(height: 200)
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                    
                    // Details
                    VStack(alignment: .leading, spacing: 16) {
                        // Name and Quantity
                        HStack {
                            Text(item.name)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Spacer()
                            
                            Text("×\(item.quantity)")
                                .font(.title)
                                .fontWeight(.semibold)
                                .foregroundColor(item.isLowStock ? .red : .primary)
                        }
                        
                        if let description = item.description {
                            Text(description)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                        
                        Divider()
                        
                        // Location
                        DetailRow(
                            icon: "location",
                            title: "location".localized,
                            value: item.displayLocation
                        )
                        
                        // Category
                        if !item.displayCategory.isEmpty {
                            DetailRow(
                                icon: "folder",
                                title: "category".localized,
                                value: item.displayCategory
                            )
                        }
                        
                        // Barcode
                        if let barcode = item.barcode {
                            DetailRow(
                                icon: "barcode",
                                title: "barcode".localized,
                                value: barcode
                            )
                        }
                        
                        // Min Quantity
                        DetailRow(
                            icon: "exclamationmark.triangle",
                            title: "minQuantity".localized,
                            value: "\(item.minQuantity)"
                        )
                        
                        // Purchase Info
                        if let buyDate = item.buyDate {
                            DetailRow(
                                icon: "calendar",
                                title: "purchaseDate".localized,
                                value: buyDate.formatted(date: .abbreviated, time: .omitted)
                            )
                        }
                        
                        if let buyCost = item.buyCost {
                            DetailRow(
                                icon: "dollarsign.circle",
                                title: "purchaseCost".localized,
                                value: String(format: "$%.2f", buyCost)
                            )
                        }
                        
                        if let buyLocation = item.buyLocation {
                            DetailRow(
                                icon: "storefront",
                                title: "purchaseLocation".localized,
                                value: buyLocation
                            )
                        }
                        
                        // Tags
                        if let tags = item.tags, !tags.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("tags".localized)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                FlowLayout(spacing: 8) {
                                    ForEach(tags, id: \.self) { tag in
                                        Text(tag)
                                            .font(.caption)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 4)
                                            .background(Color.accentColor.opacity(0.1))
                                            .foregroundColor(.accentColor)
                                            .cornerRadius(8)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Action Buttons
                    VStack(spacing: 12) {
                        Button {
                            showCheckoutSheet = true
                        } label: {
                            Label("useItem".localized, systemImage: "minus.circle")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(item.quantity <= 0)
                        
                        Button {
                            showEditSheet = true
                        } label: {
                            Label("edit".localized, systemImage: "pencil")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("itemDetails".localized)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("close".localized) {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showEditSheet) {
                AddItemView(viewModel: viewModel, editingItem: item)
            }
            .alert("useItem".localized, isPresented: $showCheckoutSheet) {
                TextField("quantity".localized, value: $checkoutQuantity, format: .number)
                    .keyboardType(.numberPad)
                
                Button("cancel".localized, role: .cancel) {}
                
                Button("confirm".localized) {
                    Task {
                        await viewModel.checkoutItem(item.id, quantity: checkoutQuantity)
                        dismiss()
                    }
                }
            } message: {
                Text("enterQuantityToUse".localized)
            }
        }
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.accentColor)
                .frame(width: 24)
            
            Text(title)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// Simple flow layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }
    
    private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0
        var maxWidth: CGFloat = 0
        
        let containerWidth = proposal.width ?? .infinity
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            
            if currentX + size.width > containerWidth && currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }
            
            positions.append(CGPoint(x: currentX, y: currentY))
            
            currentX += size.width + spacing
            lineHeight = max(lineHeight, size.height)
            maxWidth = max(maxWidth, currentX - spacing)
        }
        
        return (CGSize(width: maxWidth, height: currentY + lineHeight), positions)
    }
}
