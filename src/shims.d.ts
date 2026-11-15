/// <reference types="vite/client" />

declare module 'convex/react' {
  export const useQuery: any;
  export const usePaginatedQuery: any;
  export const useMutation: any;
  export const useAction: any;
  export const useConvexAuth: any;
  export const ConvexProviderWithAuth: any;
  export const ConvexReactClient: any;
}

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_FIREBASE_USE_PROD?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_ONESIGNAL_APP_ID?: string;
  readonly VITE_PLAYSOLE_ISSUER?: string;
  readonly VITE_PLAYSOLE_CLIENT_ID?: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
