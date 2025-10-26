import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Hiányzó adatok',
        description: 'Kérlek, add meg az email címed és a jelszavad.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      
      toast({
        title: 'Sikeres bejelentkezés! ✅',
        description: `Üdvözlünk, ${email}!`,
      });
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Bejelentkezési hiba',
        description: error.message || 'Nem sikerült bejelentkezni. Ellenőrizd az adataidat.',
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
        title: 'Hiányzó adatok',
        description: 'Kérlek, add meg az email címed és a jelszavad.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Gyenge jelszó',
        description: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      
      toast({
        title: 'Sikeres regisztráció! 🎉',
        description: 'Bejelentkezés folyamatban...',
      });
      
      // Auto-login after registration
      onLoginSuccess();
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message.includes('email_provider_disabled')) {
        toast({
          title: 'Regisztráció ideiglenesen kikapcsolva',
          description: 'Kérlek, használd a bejelentkezést egy meglévő fiókkal.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Regisztrációs hiba',
          description: error.message || 'Nem sikerült a regisztráció. Próbáld újra később.',
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
              {isRegistering ? 'Regisztráció' : 'Bejelentkezés'}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? 'Hozz létre egy új fiókot az OTIS APROD rendszerhez' 
                : 'Jelentkezz be az admin felülethez'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email cím</Label>
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
              <Label htmlFor="password">Jelszó</Label>
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
                  {isRegistering ? 'Regisztráció...' : 'Bejelentkezés...'}
                </>
              ) : (
                <>
                  {isRegistering ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Regisztráció
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Bejelentkezés
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
                ? 'Van már fiókom - Bejelentkezés' 
                : 'Új fiók létrehozása - Regisztráció'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
