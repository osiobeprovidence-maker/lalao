import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class ProductDetailScreen extends StatefulWidget {
  final ShopProduct product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _repo = MockRepository();
  String? _selectedSize;
  String? _selectedColor;

  @override
  void initState() {
    super.initState();
    if (widget.product.sizes.isNotEmpty) _selectedSize = widget.product.sizes.first;
    if (widget.product.colors.isNotEmpty) _selectedColor = widget.product.colors.first;
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    return Scaffold(
      appBar: AppBar(
        title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.shopping_cart),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
            },
          ),
        ],
      ),
      body: ListView(
        children: [
          SizedBox(
            height: 280,
            width: double.infinity,
            child: Image.network(
              p.imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.category.toUpperCase(), style: const TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.bold, fontSize: 12)),
                const SizedBox(height: 6),
                Text(p.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(
                  '₦${p.price.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.primaryBrand),
                ),
                const SizedBox(height: 12),
                Text(p.description, style: const TextStyle(fontSize: 14, height: 1.5)),
                const SizedBox(height: 20),
                if (p.sizes.isNotEmpty) ...[
                  const Text('Select Size', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: p.sizes.map((s) {
                      final selected = _selectedSize == s;
                      return ChoiceChip(
                        label: Text(s),
                        selected: selected,
                        selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                        onSelected: (_) => setState(() => _selectedSize = s),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
                if (p.colors.isNotEmpty) ...[
                  const Text('Select Color', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: p.colors.map((c) {
                      final selected = _selectedColor == c;
                      return ChoiceChip(
                        label: Text(c),
                        selected: selected,
                        selectedColor: AppTheme.primaryBrand.withOpacity(0.2),
                        onSelected: (_) => setState(() => _selectedColor = c),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                ],
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _repo.addToCart(p, size: _selectedSize, color: _selectedColor);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${p.name} added to cart')),
                          );
                        },
                        icon: const Icon(LucideIcons.shopping_bag),
                        label: const Text('Add to Cart'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 15),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          _repo.addToCart(p, size: _selectedSize, color: _selectedColor);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                        },
                        icon: const Icon(LucideIcons.zap),
                        label: const Text('Buy Now'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBrand,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _repo = MockRepository();
  String _deliveryMethod = 'Door Delivery (₦1,500)';
  String _paymentMethod = 'Bachs Wallet';
  final _addressCtrl = TextEditingController(text: '14 DSC Expressway, Udu, Delta State');

  void _checkout() {
    final order = _repo.checkoutCart(
      deliveryAddress: _addressCtrl.text.trim(),
      deliveryMethod: _deliveryMethod,
      paymentMethod: _paymentMethod,
    );
    if (order == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Insufficient Wallet Balance or empty cart!'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final items = _repo.cart;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Shopping Bag & Checkout', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const ShoppingHistoryScreen()));
                },
                child: const Text('Orders', style: TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          body: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.shopping_bag, size: 56, color: AppTheme.textSecondaryLight),
                      const SizedBox(height: 12),
                      const Text('Your shopping bag is empty', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ShoppingHistoryScreen()));
                        },
                        child: const Text('View Order History'),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...items.map((item) => Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          child: ListTile(
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(item.product.imageUrl, width: 52, height: 52, fit: BoxFit.cover),
                            ),
                            title: Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(
                              '₦${item.product.price.toStringAsFixed(0)} × ${item.quantity}'
                              '${item.selectedSize != null ? ' · Size: ${item.selectedSize}' : ''}',
                            ),
                            trailing: IconButton(
                              icon: const Icon(LucideIcons.trash_2, color: AppTheme.errorColor, size: 18),
                              onPressed: () => _repo.removeFromCart(item.product.id),
                            ),
                          ),
                        )),
                    const Divider(height: 28),
                    const Text('Delivery Options', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _deliveryMethod,
                      items: const [
                        DropdownMenuItem(value: 'Door Delivery (₦1,500)', child: Text('Door Delivery (₦1,500)')),
                        DropdownMenuItem(value: 'Store Pickup (Free)', child: Text('Store Pickup (Free)')),
                      ],
                      onChanged: (v) => setState(() => _deliveryMethod = v!),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _addressCtrl,
                      decoration: const InputDecoration(labelText: 'Delivery Address / Pickup Note'),
                    ),
                    const SizedBox(height: 16),
                    const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _paymentMethod,
                      items: [
                        DropdownMenuItem(
                          value: 'Bachs Wallet',
                          child: Text('Bachs Wallet (Balance: ₦${_repo.walletBalanceNgn.toStringAsFixed(0)})'),
                        ),
                        const DropdownMenuItem(value: 'Bank Transfer (Monnify)', child: Text('Bank Transfer (Monnify)')),
                        const DropdownMenuItem(value: 'Debit Card (Paystack)', child: Text('Debit Card (Paystack)')),
                      ],
                      onChanged: (v) => setState(() => _paymentMethod = v!),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).dividerColor),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Payable', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(
                            '₦${_repo.cartTotal.toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppTheme.primaryBrand),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _checkout,
                        icon: const Icon(LucideIcons.shield_check),
                        label: const Text('Confirm & Pay Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBrand,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }
}

class ShoppingHistoryScreen extends StatelessWidget {
  const ShoppingHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final orders = repo.orders;
        return Scaffold(
          appBar: AppBar(title: const Text('Shopping & Order History', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17))),
          body: orders.isEmpty
              ? const Center(child: Text('No orders placed yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  itemBuilder: (context, idx) {
                    final o = orders[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(14),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBrand.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(LucideIcons.package_check, color: AppTheme.primaryBrand),
                        ),
                        title: Text('${o.storeName} (${o.id})', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${o.createdAt} · ${o.status.toUpperCase()}\nTotal: ₦${o.totalAmount.toStringAsFixed(0)}'),
                        isThreeLine: true,
                        trailing: const Icon(LucideIcons.chevron_right),
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(order: o)));
                        },
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class OrderDetailScreen extends StatelessWidget {
  final Order order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Order ${order.id}', style: const TextStyle(fontWeight: FontWeight.bold))),
      body: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppTheme.successColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppTheme.successColor.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                const Icon(LucideIcons.circle_check, color: AppTheme.successColor, size: 42),
                const SizedBox(height: 8),
                Text(
                  'Order Status: ${order.status.toUpperCase()}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppTheme.successColor),
                ),
                const SizedBox(height: 4),
                Text('Placed ${order.createdAt} via ${order.paymentMethod}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Items Ordered', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          ...order.items.map((item) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(item.imageUrl, width: 48, height: 48, fit: BoxFit.cover),
                ),
                title: Text(item.productName, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('Qty: ${item.quantity}'),
                trailing: Text('₦${(item.price * item.quantity).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
              )),
          const Divider(height: 28),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Delivery Method'),
            trailing: Text(order.deliveryMethod, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Delivery Address'),
            subtitle: Text(order.deliveryAddress),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Total Paid', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            trailing: Text(
              '₦${order.totalAmount.toStringAsFixed(0)}',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppTheme.primaryBrand),
            ),
          ),
        ],
      ),
    );
  }
}
