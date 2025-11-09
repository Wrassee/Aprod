import { useState } from 'react';
import { useAuth } from "../contexts/auth-context";
import { useLocation } from 'wouter';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [, setLocation] = useLocation();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validálás
    if (newPassword.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A két jelszó nem egyezik meg.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await updatePassword(newPassword);

    setLoading(false);

    if (updateError) {
      setError('Hiba történt a jelszó módosítása során. A link lehet, hogy lejárt.');
      console.error('Update password error:', updateError);
    } else {
      setSuccess(true);
      // 2 másodperc után átirányítjuk a főoldalra
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sikeres jelszóváltoztatás!</h2>
            <p className="text-gray-600 mb-4">
              Jelszavad sikeresen megváltozott. Átirányítunk...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Új jelszó beállítása</h2>
          <p className="text-gray-600">
            Add meg az új jelszavad kétszer a megerősítéshez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Új jelszó
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Legalább 6 karakter"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Jelszó megerősítése
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ugyanaz, mint az előbb"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Mentés...' : 'Jelszó módosítása'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Biztonsági tipp: Használj legalább 8 karaktert, keverj benne számokat és speciális karaktereket.
          </p>
        </div>
      </div>
    </div>
  );
}