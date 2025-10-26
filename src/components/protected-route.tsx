import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onUnauthorized: () => void;
  requireAdmin?: boolean;
}

/**
 * Protected Route wrapper component
 * Ensures user is authenticated before rendering children
 * Optionally checks for admin role
 */
export function ProtectedRoute({ 
  children, 
  onUnauthorized, 
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to load
    if (loading) return;

    // Redirect to login if not authenticated
    if (!user) {
      console.log('🔒 Not authenticated - redirecting to login');
      onUnauthorized();
      return;
    }

    // Check admin requirement
    if (requireAdmin && profile?.role !== 'admin') {
      console.log('🔒 Not authorized - admin role required');
      onUnauthorized();
      return;
    }
  }, [user, profile, loading, onUnauthorized, requireAdmin]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Betöltés...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (!user || (requireAdmin && profile?.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Átirányítás...</p>
        </div>
      </div>
    );
  }

  // User is authenticated - render protected content
  return <>{children}</>;
}
