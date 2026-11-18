import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../../data/mock_repository.dart';
import '../../theme/app_theme.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> with SingleTickerProviderStateMixin {
  final _repo = MockRepository();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _repo,
      builder: (context, _) {
        final events = _repo.events;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Events & Tournaments', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            actions: [
              TextButton.icon(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MyTicketsScreen()));
                },
                icon: const Icon(LucideIcons.ticket, size: 18, color: AppTheme.primaryBrand),
                label: Text(
                  'My Tickets (${_repo.tickets.length})',
                  style: const TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.bold),
                ),
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              labelColor: AppTheme.primaryBrand,
              indicatorColor: AppTheme.primaryBrand,
              isScrollable: true,
              tabs: const [
                Tab(text: 'For You'),
                Tab(text: 'Nearby (Udu/Warri)'),
                Tab(text: 'Tournaments'),
                Tab(text: 'Free Entry'),
              ],
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              _buildEventList(events),
              _buildEventList(events),
              _buildEventList(events.where((e) => e.isTournament).toList()),
              _buildEventList(events.where((e) => e.isFree).toList()),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEventList(List<OrgEvent> list) {
    if (list.isEmpty) {
      return const Center(child: Text('No events in this category yet.'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final ev = list[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: Theme.of(context).dividerColor),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(event: ev)));
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 150,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        ev.coverUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: AppTheme.primaryBrand.withOpacity(0.2)),
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: ev.isTournament ? Colors.amber.shade800 : AppTheme.primaryBrand,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            ev.isTournament ? 'TOURNAMENT' : ev.category.toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            ev.isFree ? 'FREE PASS' : '₦${ev.price.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(ev.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(LucideIcons.calendar, size: 14, color: AppTheme.primaryBrand),
                          const SizedBox(width: 6),
                          Text('${ev.date} · ${ev.time}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(LucideIcons.map_pin, size: 14, color: AppTheme.textSecondaryLight),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              ev.location,
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '${ev.attendeesCount}/${ev.capacity} going',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryBrand),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class EventDetailScreen extends StatefulWidget {
  final OrgEvent event;
  const EventDetailScreen({super.key, required this.event});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final _repo = MockRepository();
  int _qty = 1;
  final _teamNameCtrl = TextEditingController();

  void _purchaseOrRegister() {
    final ev = widget.event;
    final ticket = _repo.purchaseEventTicket(ev, 'General Admission', _qty);
    if (ticket == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Insufficient Wallet Balance! Please fund your Bachs Wallet first.'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }
    showDialog(
      context: context,
      builder: (_) => DigitalTicketDialog(ticket: ticket),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ev = widget.event;
    return Scaffold(
      appBar: AppBar(title: Text(ev.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
      body: ListView(
        children: [
          SizedBox(
            height: 220,
            width: double.infinity,
            child: Image.network(
              ev.coverUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: AppTheme.primaryBrand.withOpacity(0.2)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBrand.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        ev.category,
                        style: const TextStyle(color: AppTheme.primaryBrand, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      ev.isFree ? 'FREE' : '₦${ev.price.toStringAsFixed(0)} / ticket',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primaryBrand),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(ev.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text('Organized by ${ev.organizerName}', style: const TextStyle(color: AppTheme.textSecondaryLight, fontWeight: FontWeight.w600)),
                const Divider(height: 28),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(LucideIcons.calendar_clock, color: AppTheme.primaryBrand),
                  title: Text(ev.date, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(ev.time),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(LucideIcons.map_pin, color: AppTheme.primaryBrand),
                  title: Text(ev.location, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${ev.attendeesCount} confirmed attendees · Capacity ${ev.capacity}'),
                ),
                const SizedBox(height: 12),
                const Text('About Event', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                const SizedBox(height: 8),
                Text(ev.description, style: const TextStyle(fontSize: 14, height: 1.5)),
                const SizedBox(height: 20),
                if (ev.isTournament) ...[
                  const Text('Tournament Team / Player Registration', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _teamNameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Team or Squad Name (Optional)',
                      hintText: 'e.g. Udu Strikers FC',
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                Row(
                  children: [
                    const Text('Quantity:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                      icon: const Icon(LucideIcons.minus_circle),
                    ),
                    Text('$_qty', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    IconButton(
                      onPressed: () => setState(() => _qty++),
                      icon: const Icon(LucideIcons.plus_circle),
                    ),
                    const Spacer(),
                    Text(
                      ev.isFree ? 'Total: FREE' : 'Total: ₦${(ev.price * _qty).toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _purchaseOrRegister,
                    icon: const Icon(LucideIcons.ticket),
                    label: Text(
                      ev.isTournament
                          ? 'Register & Get Tournament Pass'
                          : (ev.isFree ? 'Claim Free QR Ticket' : 'Buy Ticket with Bachs Wallet'),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
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
          ),
        ],
      ),
    );
  }
}

class MyTicketsScreen extends StatelessWidget {
  const MyTicketsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = MockRepository();
    return AnimatedBuilder(
      animation: repo,
      builder: (context, _) {
        final tickets = repo.tickets;
        return Scaffold(
          appBar: AppBar(title: const Text('My Event Tickets', style: TextStyle(fontWeight: FontWeight.w800))),
          body: tickets.isEmpty
              ? const Center(child: Text('You have no event tickets yet.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final t = tickets[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                        side: BorderSide(color: Theme.of(context).dividerColor),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBrand.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(LucideIcons.qr_code, color: AppTheme.primaryBrand, size: 28),
                        ),
                        title: Text(t.eventTitle, style: const TextStyle(fontWeight: FontWeight.w800)),
                        subtitle: Text('${t.eventDate}\n${t.eventLocation}\nCode: ${t.qrCode}'),
                        isThreeLine: true,
                        trailing: ElevatedButton(
                          onPressed: () {
                            showDialog(context: context, builder: (_) => DigitalTicketDialog(ticket: t));
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryBrand,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('View Pass'),
                        ),
                      ),
                    );
                  },
                ),
        );
      },
    );
  }
}

class DigitalTicketDialog extends StatelessWidget {
  final EventTicket ticket;
  const DigitalTicketDialog({super.key, required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: AppTheme.successColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'VALID DIGITAL PASS',
                style: TextStyle(color: AppTheme.successColor, fontWeight: FontWeight.w800, fontSize: 11),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              ticket.eventTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(ticket.eventDate, style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 13)),
            Text(ticket.eventLocation, style: const TextStyle(color: AppTheme.textSecondaryLight, fontSize: 12)),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade300, width: 2),
              ),
              child: Column(
                children: [
                  const Icon(LucideIcons.qr_code, size: 120, color: Colors.black87),
                  const SizedBox(height: 8),
                  Text(
                    ticket.qrCode,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Holder: ${ticket.holderName} · Qty: ${ticket.quantity}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBrand,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
