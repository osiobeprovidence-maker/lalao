/// <reference types="vite/client" />

declare module 'convex/react' {
  export const useQuery: any;
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
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_FIREBASE_VAPID_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
