import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pub = process.env.VITE_VAPID_PUBLIC_KEY;
const priv = 'hrvtnkZ32YTiz4zwlfoE1ntZCXGkKZruUtkA21kkGx8';

console.log('--- VAPID Key & WebPush Validation ---');
console.log('Public Key present:', Boolean(pub));
console.log('Key length:', pub ? pub.length : 0);

try {
  webpush.setVapidDetails(
    'mailto:support@lalao.app',
    pub!,
    priv
  );
  console.log('Result: VALID VAPID PAIR (web-push accepted keys)');
} catch (err: any) {
  console.error('Result: INVALID VAPID PAIR -', err.message);
  process.exit(1);
}
