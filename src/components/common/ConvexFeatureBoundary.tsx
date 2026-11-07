import React from 'react';

type ConvexFeatureBoundaryProps = {
  feature: string;
  available: boolean;
  children: React.ReactNode;
  unavailableFallback?: React.ReactNode;
};

/** Stops a Convex-only subtree before its hooks render when Convex is unavailable. */
export function ConvexFeatureBoundary({ feature, available, children, unavailableFallback }: ConvexFeatureBoundaryProps) {
  if (available) return <>{children}</>;

  if (unavailableFallback !== undefined) return <>{unavailableFallback}</>;

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-6">
      <section className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#161B26] p-8 text-center space-y-3">
        <h1 className="text-xl font-bold">{feature} is unavailable</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          This feature still requires the Convex backend and cannot be opened in Supabase-only mode.
        </p>
      </section>
    </main>
  );
}
