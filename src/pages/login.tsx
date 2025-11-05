import { useState } from 'react';
import { Button } from '@/components/ui/button'; // Classic gombokhoz
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguageContext } from '@/components/language-provider';
// TÉMA IMPORT
import { useTheme } from '@/contexts/theme-context';
// Ikonok (egyesítve mindkét verzióból)
import { Loader2, LogIn, UserPlus, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onBackToHome?: () => void;
}

export function Login({ onLoginSuccess, onBackToHome }: LoginProps) {
  // === KÖZÖS HOOK-OK ===
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const { t } = useLanguageContext();
  const { theme } = useTheme(); // TÉMA HOOK
  
  // === KÖZÖS STATE ===
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // === KÖZÖS LOGIKA: BEJELENTKEZÉS ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t.missingData,
        description: t.pleaseProvideEmailAndPassword,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // SECURITY FIX: Wait for session before proceeding
      const session = await signIn(email, password);
      
      if (!session) {
        throw new Error('No session returned after sign in');
      }
      
      toast({
        title: t.loginSuccessful,
        description: t.welcomeUser.replace('{email}', email),
      });
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      
      // More specific error messages
      let errorMessage = error.message || t.genericLoginError;
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = t.invalidCredentials;
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = t.emailNotConfirmed;
      }
      
      toast({
        title: t.loginError,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // === KÖZÖS LOGIKA: REGISZTRÁCIÓ ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: t.missingData,
        description: t.pleaseProvideEmailAndPassword,
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t.weakPassword,
        description: t.passwordMinLength,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // SECURITY FIX: Wait for session before proceeding
      const session = await signUp(email, password);
      
      if (!session) {
        // Email confirmation required
        toast({
          title: t.emailConfirmationRequired,
          description: t.checkEmailForConfirmation,
        });
        setIsRegistering(false);
        setPassword('');
        return;
      }
      
      toast({
        title: t.registrationSuccessful,
        description: t.loginSuccessfulAfterRegistration,
      });
      
      // Auto-login after registration (only if session exists)
      onLoginSuccess();
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message.includes('Email confirmation required')) {
        toast({
          title: t.emailConfirmationRequired,
          description: t.checkEmailForConfirmation,
        });
        setIsRegistering(false);
        setPassword('');
      } else if (error.message.includes('User already registered')) {
        toast({
          title: t.loginError,
          description: t.userAlreadyExists,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t.loginError,
          description: error.message || t.genericLoginError,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // |   MODERN OTIS TÉMA    |
  // -------------------------
  if (theme === 'modern') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex items-center justify-center p-4">
        {/* Animated background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-md">
          
          {/* Back to Home Button - KISZEDVE A KÉRÉS ALAPJÁN */}
          {/*
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="group mb-6 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">Vissza a főoldalra</span>
            </button>
          )}
          */}

          {/* 🎨 MODERN LOGIN CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 opacity-50 blur-xl animate-pulse"></div>
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl">
              <CardHeader className="space-y-6 p-8 pb-6">
                {/* Logo - Clickable */}
                <div className="flex justify-center">
                  <button
                    onClick={onBackToHome} // A funkció megmarad a logón
                    className="group relative"
                    data-testid="button-home-logo"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-1 shadow-lg group-hover:shadow-xl transition-shadow">
                      <div className="bg-white rounded-xl p-4">
                        <img 
                          src="/otis-logo.png" 
                          alt="OTIS Logo" 
                          className="h-16 w-auto transition-transform group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    {isRegistering ? t.registerTitle : t.loginTitle}
                  </CardTitle>
                  <CardDescription className="text-base flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-500" />
                    {isRegistering ? t.registerDescription : t.loginDescription}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 pt-0">
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-blue-600" />
                      {t.emailLabel}
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="pelda@otis.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        data-testid="input-email"
                        className="h-12 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Lock className="h-4 w-4 text-blue-600" />
                      {t.passwordLabel}
                    </Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        data-testid="input-password"
                        className="h-12 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 opacity-0 group-focus-within:opacity-100 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    data-testid={isRegistering ? "button-register" : "button-login"}
                    className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                    
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t.loading}</span>
                        </>
                      ) : (
                        <>
                          {isRegistering ? (
                            <>
                              <UserPlus className="h-5 w-5" />
                              <span>{t.registerButton}</span>
                            </>
                          ) : (
                            <>
                              <LogIn className="h-5 w-5" />
                              <span>{t.loginButton}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2 border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-3 py-1 text-gray-500 font-medium rounded-full">
                        vagy
                      </span>
                    </div>
                  </div>

                  {/* Toggle Mode Button */}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    disabled={loading}
                    data-testid="button-toggle-mode"
                    className="w-full h-12 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all disabled:opacity-50"
                  >
                    {isRegistering ? t.switchToLogin : t.switchToRegister}
                  </button>
                </form>
              </CardContent>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} OTIS Elevator Company
          </p>
        </div>
      </div>
    );
  }

  // -------------------------
  // |   CLASSIC TÉMA        |
  // -------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img 
              src="/otis-logo.png" 
              alt="OTIS Logo" 
              className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onBackToHome}
              data-testid="button-home-logo"
            />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isRegistering ? t.registerTitle : t.loginTitle}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? t.registerDescription
                : t.loginDescription}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder="pelda@otis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid={isRegistering ? "button-register" : "button-login"}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                <>
                  {isRegistering ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t.registerButton}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t.loginButton}
                    </>
                  )}
                </>
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  vagy
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={loading}
              data-testid="button-toggle-mode"
            >
              {isRegistering 
                ? t.switchToLogin
                : t.switchToRegister}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

