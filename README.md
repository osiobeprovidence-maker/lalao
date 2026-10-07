# Lalao

> **Hyperlocal Community, Social Commerce & Creator Platform**

Lalao is a modern, real-time social platform built for communities, local businesses, creators, and commerce. It connects users with nearby happenings, community rallies, interactive short-form stories (Cycles), real-time messaging, and local commerce.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend & Database**: [Convex](https://www.convex.dev/) (reactive serverless database, real-time sync, file storage)
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth)
- **Video Infrastructure**: [Mux](https://mux.com/) (Direct uploads, adaptive HLS video streaming)
- **Image CDN**: [Cloudinary](https://cloudinary.com/) (Server-signed direct uploads with automatic fallback)
- **Payments & Wallet**: Paystack (In-app wallet funding, creator tier subscriptions)
- **Push Notifications**: Web Push (VAPID) & Firebase Cloud Messaging (FCM)
- **Utility / Airtime**: VTU.ng API integration for airtime, data, and bill services

---

## 🌟 Core Features

- **Hyperlocal Feeds**: Geo-indexed content with customizable radius and tabs ("For You", "Following", "Nearby", "Events").
- **Optimized Media Pipeline**:
  - **Zero-dependency client-side image compression**: High-resolution mobile photos (5MB–15MB) are automatically resized and compressed to ~150KB–300KB before uploading, speeding up uploads and page load times by 95%+.
  - **Hybrid multi-provider fallback**: Video uploads leverage Mux for adaptive streaming with automatic fallback to Convex Storage. Image uploads use Cloudinary with an automatic fallback to Convex Storage.
- **Pages & Social Commerce**: Dedicated pages for businesses, clubs, organizations, and communities featuring product stores, team management, and event hosting.
- **Cycles (Stories)**: Ephemeral photo and video stories with video trimming, custom gradients, sticker reactions, and viewing metrics.
- **Real-Time Messaging**: Direct messaging with ephemeral view-once photos/videos, audio voice notes, and read receipts.
- **Creator Subscriptions & Wallet**: Integrated NGN virtual wallet with Paystack top-ups and tiered subscriptions.
- **Admin Management Hub**: Comprehensive controls for branding (icons, logos, favicons), system pages (Roomy & Lalao), feature flags, and moderation.

---

## 📁 Project Structure

```text
├── convex/                     # Convex reactive backend
│   ├── schema.ts               # Complete database schema definition
│   ├── social.ts               # Posts, feeds, comments, storage resolvers
│   ├── pages.ts                # Pages, verification, team roles
│   ├── mux.ts                  # Mux video actions & direct uploads
│   ├── cloudinary.ts           # Cloudinary signed upload generator
│   ├── wallet.ts               # Paystack payment and wallet transactions
│   ├── pushActions.ts          # Web Push and FCM dispatchers
│   └── market.ts               # VTU.ng airtime and utility services
├── src/
│   ├── components/
│   │   ├── create/             # PostComposer & CreatePostPage
│   │   ├── cycles/             # Stories/Cycles creator & viewer
│   │   ├── feed/               # Feed items, video players, post cards
│   │   ├── messages/           # Real-time chat & voice notes
│   │   ├── pages/              # Page creator, editor, and product modals
│   │   └── wallet/             # Paystack payment and wallet dialogs
│   ├── context/
│   │   ├── AuthContext.tsx     # Firebase auth provider & token sync
│   │   └── LalaoContext.tsx    # Centralized app state & Convex hooks
│   └── lib/
│       ├── imageCompression.ts# Browser-native canvas image compression
│       ├── cloudinary.ts       # Cloudinary client with Convex fallback
│       └── firebase.ts         # Firebase initialization (Auth & FCM)
```

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- npm or pnpm

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env.local
```

#### Frontend Client (`.env.local`)
Add client-side variables prefixed with `VITE_`:

```env
VITE_CONVEX_URL="https://your-deployment-name.convex.cloud"
VITE_APP_URL="http://localhost:3000"
VITE_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
VITE_PAYSTACK_PUBLIC_KEY="your-paystack-public-key"
VITE_FIREBASE_VAPID_KEY="your-fcm-vapid-key"
```

#### Convex Server-Side (Convex Dashboard)
Configure backend secrets in **Convex Dashboard → Settings → Environment Variables**:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `MUX_TOKEN_ID`, `MUX_SECRET_KEY`
- `PAYSTACK_SECRET_KEY`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `FIREBASE_SERVER_KEY`
- `VTU_USERNAME`, `VTU_PASSWORD`, `VTU_USER_PIN`, `MARKET_PROVIDER="mock"`
- `GEMINI_API_KEY`

*(See [.env.example](.env.example) for detailed comments and instructions on each variable).*

### 3. Run Locally

Start the Convex backend sync:
```bash
npx convex dev
```

In another terminal, start the Vite development server:
```bash
npm run dev
```

The application will be running at `http://localhost:3000`.

---

## 📜 Build & Scripts

- `npm run dev`: Launch local Vite dev server on port 3000
- `npm run build`: Build production web bundle
- `npm run preview`: Preview production build locally
- `npm run lint`: Run TypeScript type-checker (`tsc --noEmit`)
