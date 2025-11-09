import { useState } from 'react';
import { useAuth } from "../contexts/auth-context";
import { useTheme } from '@/contexts/theme-context';
import { ArrowLeft, Mail, CheckCircle2, Loader2, Sparkles, Send } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { resetPasswordForEmail } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await resetPasswordForEmail(email);

    setLoading(false);

    if (resetError) {
      setError('Hiba történt az email küldése során. Kérlek, próbáld újra.');
      console.error('Reset password error:', resetError);
    } else {
      setEmailSent(true);
    }
  };

  // === EMAIL ELKÜLDVE ÁLLAPOT ===
  if (emailSent) {
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
                    <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-2">
                    Email elküldve!
                    <Sparkles className="h-6 w-6 text-emerald-500" />
                  </h2>

                  {/* Message */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">
                    Elküldtünk egy linket a <strong className="text-gray-800 dark:text-white">{email}</strong> címre.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-base">
                    Kattints a linkre a jelszavad visszaállításához.
                  </p>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Tipp:</strong> A szerver szolgáltató a Supabase, egy ilyen címről fogod kapni a levelet! Ellenőrizd a spam mappát is.
                    </p>
                  </div>

                  {/* Back Button */}
                  <button
                    onClick={onBackToLogin}
                    className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                    
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <ArrowLeft className="h-5 w-5" />
                      Vissza a bejelentkezéshez
                    </span>

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                  </button>
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

    // Classic Theme - Email Sent
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email elküldve!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Elküldtünk egy linket a <strong>{email}</strong> címre. Kattints a linkre a jelszavad visszaállításához.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Nem látsz emailt? A szerver szolgáltató a Supabase, egy ilyen címről fogod kapni a levelet! Ellenőrizd a spam mappát is.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg transition-colors font-medium shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Vissza a bejelentkezéshez
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === FORM ÁLLAPOT ===
  if (theme === 'modern') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-20"></div>
                  <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  Elfelejtett jelszó
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-base">
                  Add meg az email címedet és küldünk egy linket a jelszó visszaállításához.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email cím
                  </label>
                  <div className="relative group">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                      placeholder="pelda@email.hu"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse"></div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-2">
                    <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Küldés...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Jelszó visszaállítási link küldése
                      </>
                    )}
                  </span>

                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <button
                  onClick={onBackToLogin}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Vissza a bejelentkezéshez
                </button>
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

  // Classic Theme - Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Elfelejtett jelszó</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Add meg az email címedet és küldünk egy linket a jelszó visszaállításához.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email cím
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="pelda@email.hu"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Küldés...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Jelszó visszaállítási link küldése
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Vissza a bejelentkezéshez
          </button>
        </div>
      </div>
    </div>
  );
}