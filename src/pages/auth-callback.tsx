import { useEffect, useState } from 'react';
import { useAuth } from "../contexts/auth-context";
import { useTheme } from '@/contexts/theme-context';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: () => void;
}

export default function AuthCallback({ onSuccess, onError }: AuthCallbackProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ellenőrizzük az URL hash-t hibaüzenetekért
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'Hiba történt az email megerősítése során.');
      return;
    }

    // Ha van user, átirányítunk a főoldalra
    if (user) {
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  }, [user, onSuccess]);

  // === HIBA ÁLLAPOT ===
  if (error) {
    if (theme === 'modern') {
      return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-red-50/30 to-rose-50/20 flex items-center justify-center p-4">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-400/10 to-rose-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 p-1 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-rose-500 to-pink-500 opacity-50 blur-xl animate-pulse"></div>
              
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8">
                <div className="text-center">
                  {/* Error Icon */}
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                      <XCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
                    Hiba történt
                  </h2>

                  {/* Error Message */}
                  <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                    {error}
                  </p>

                  {/* Back Button */}
                  <button
                    onClick={onError}
                    className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-pink-600"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-rose-400 to-pink-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                    
                    <span className="relative z-10">Vissza a bejelentkezéshez</span>

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Classic Theme - Error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hiba történt</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={onError}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-6 rounded-lg transition-colors font-medium shadow-md"
            >
              Vissza a bejelentkezéshez
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === SIKERES ÁLLAPOT ===
  if (theme === 'modern') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-400/10 to-green-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-50 blur-xl animate-pulse"></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8">
              <div className="text-center">
                {/* Success Icon */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-2">
                  Email megerősítve!
                  <Sparkles className="h-6 w-6 text-emerald-500" />
                </h2>

                {/* Message */}
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                  Sikeresen megerősítetted az email címed. Átirányítunk az alkalmazásba...
                </p>

                {/* Loading Spinner */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    <Loader2 className="relative h-10 w-10 animate-spin text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} OTIS Elevator Company
          </p>
        </div>
      </div>
    );
  }

  // Classic Theme - Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email megerősítve! ✅</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sikeresen megerősítetted az email címed. Átirányítunk az alkalmazásba...
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}