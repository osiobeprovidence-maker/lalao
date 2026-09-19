import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Server-backed admin route guard.
 * Calls api.admin.getMyRole — if not super_admin, redirects to /app.
 * Shows spinner while resolving (undefined = loading).
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const role = useQuery(api.admin.getMyRole);

  // Loading
  if (role === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#5E43F3]/30 border-t-[#5E43F3] animate-spin" />
          <p className="text-xs text-neutral-500">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (role !== 'super_admin') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
