import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguageContext } from '@/components/language-provider';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const { t } = useLanguageContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img 
              src="/otis-logo.png" 
              alt="OTIS Logo" 
              className="h-16 w-auto"
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
