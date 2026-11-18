import 'package:flutter_test/flutter_test.dart';
import 'package:lalao_mobile/data/mock_repository.dart';

void main() {
  test('Lalao MockRepository initializes seed data, wallet, rallies, pages, and VTU', () {
    final repo = MockRepository();
    expect(repo.currentUser.name, 'Providence Osiobe');
    expect(repo.users.length, greaterThanOrEqualTo(6));
    expect(repo.posts.isNotEmpty, true);
    expect(repo.rallies.isNotEmpty, true);
    expect(repo.pages.isNotEmpty, true);
    expect(repo.products.isNotEmpty, true);
    expect(repo.events.isNotEmpty, true);
    expect(repo.walletBalanceNgn, greaterThan(0));
  });
}
