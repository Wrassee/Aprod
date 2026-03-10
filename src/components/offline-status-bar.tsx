import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, CloudUpload, Check, AlertTriangle } from 'lucide-react';
import { OfflineQueue } from '@/utils/offline-queue';
import { getAuthHeaders, getApiUrl } from '@/lib/queryClient';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface OfflineTranslations {
  offlineMode: string;
  onlineMode: string;
  pendingSync: string;
  syncingNow: string;
  syncComplete: string;
  syncFailed: string;
}

const t: Record<string, OfflineTranslations> = {
  hu: {
    offlineMode: 'Offline mód',
    onlineMode: 'Online',
    pendingSync: 'szinkronizálásra vár',
    syncingNow: 'Szinkronizálás...',
    syncComplete: 'Szinkronizálás kész!',
    syncFailed: 'Szinkronizálás sikertelen',
  },
  de: {
    offlineMode: 'Offline-Modus',
    onlineMode: 'Online',
    pendingSync: 'warten auf Synchronisation',
    syncingNow: 'Synchronisiere...',
    syncComplete: 'Synchronisation abgeschlossen!',
    syncFailed: 'Synchronisation fehlgeschlagen',
  },
  en: {
    offlineMode: 'Offline mode',
    onlineMode: 'Online',
    pendingSync: 'pending sync',
    syncingNow: 'Syncing...',
    syncComplete: 'Sync complete!',
    syncFailed: 'Sync failed',
  },
  fr: {
    offlineMode: 'Mode hors ligne',
    onlineMode: 'En ligne',
    pendingSync: 'en attente de synchronisation',
    syncingNow: 'Synchronisation...',
    syncComplete: 'Synchronisation terminée !',
    syncFailed: 'Échec de la synchronisation',
  },
  it: {
    offlineMode: 'Modalità offline',
    onlineMode: 'Online',
    pendingSync: 'in attesa di sincronizzazione',
    syncingNow: 'Sincronizzazione...',
    syncComplete: 'Sincronizzazione completata!',
    syncFailed: 'Sincronizzazione fallita',
  },
};

export function OfflineStatusBar({ language = 'hu' }: { language?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const wasOfflineRef = useRef(!navigator.onLine);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const tr = t[language] || t.hu;

  const refreshPendingCount = useCallback(() => {
    setPendingCount(OfflineQueue.getPendingCount());
  }, []);

  const syncInFlightRef = useRef(false);

  const doSync = useCallback(async () => {
    if (syncInFlightRef.current) return;
    const count = OfflineQueue.getPendingCount();
    if (count === 0) return;

    syncInFlightRef.current = true;
    setSyncStatus('syncing');
    try {
      const result = await OfflineQueue.syncAll(getAuthHeaders, getApiUrl);
      if (result.synced > 0 && result.failed === 0) {
        setSyncStatus('success');
      } else if (result.failed > 0) {
        setSyncStatus('error');
      } else {
        setSyncStatus('idle');
      }
    } catch {
      setSyncStatus('error');
    } finally {
      syncInFlightRef.current = false;
    }
    refreshPendingCount();

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 4000);
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setTimeout(doSync, 1500);
      }
      wasOfflineRef.current = false;
    };
    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
    };
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TRIGGER_SYNC') {
        doSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [doSync]);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 5000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const showBar = !isOnline || pendingCount > 0 || syncStatus !== 'idle';
  if (!showBar) return null;

  let bgColor = 'bg-yellow-500';
  let icon = <WifiOff className="w-4 h-4" />;
  let text = tr.offlineMode;

  if (syncStatus === 'syncing') {
    bgColor = 'bg-blue-500';
    icon = <CloudUpload className="w-4 h-4 animate-pulse" />;
    text = tr.syncingNow;
  } else if (syncStatus === 'success') {
    bgColor = 'bg-green-500';
    icon = <Check className="w-4 h-4" />;
    text = tr.syncComplete;
  } else if (syncStatus === 'error') {
    bgColor = 'bg-red-500';
    icon = <AlertTriangle className="w-4 h-4" />;
    text = tr.syncFailed;
  } else if (isOnline && pendingCount > 0) {
    bgColor = 'bg-orange-500';
    icon = <CloudUpload className="w-4 h-4" />;
    text = `${pendingCount} ${tr.pendingSync}`;
  } else if (!isOnline) {
    bgColor = 'bg-yellow-600';
    icon = <WifiOff className="w-4 h-4" />;
    text = pendingCount > 0
      ? `${tr.offlineMode} · ${pendingCount} ${tr.pendingSync}`
      : tr.offlineMode;
  }

  return (
    <div className={`${bgColor} text-white text-xs px-3 py-1.5 flex items-center justify-center gap-2 z-50`}>
      {icon}
      <span className="font-medium">{text}</span>
      {isOnline && pendingCount > 0 && syncStatus === 'idle' && (
        <button
          onClick={doSync}
          className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
        >
          Sync
        </button>
      )}
    </div>
  );
}
