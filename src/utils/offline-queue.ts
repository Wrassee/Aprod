const QUEUE_KEY = 'otis-offline-queue';

export interface QueuedProtocol {
  id: string;
  protocolData: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
  attempts: number;
}

function generateId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const OfflineQueue = {
  getQueue(): QueuedProtocol[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: QueuedProtocol[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  addToQueue(protocolData: any): QueuedProtocol {
    const queue = this.getQueue();
    const entry: QueuedProtocol = {
      id: generateId(),
      protocolData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };
    queue.push(entry);
    this.saveQueue(queue);
    console.log(`📥 Protocol added to offline queue: ${entry.id}`);
    return entry;
  },

  removeFromQueue(id: string) {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
  },

  getPendingCount(): number {
    return this.getQueue().filter(item => item.status !== 'syncing').length;
  },

  async syncAll(getHeaders: () => Promise<Record<string, string>>, apiUrl: (path: string) => string): Promise<{ synced: number; failed: number }> {
    const pendingIds = this.getQueue()
      .filter(item => item.status !== 'syncing')
      .map(item => item.id);

    if (pendingIds.length === 0) {
      return { synced: 0, failed: 0 };
    }

    console.log(`🔄 Syncing ${pendingIds.length} offline protocols...`);
    let synced = 0;
    let failed = 0;

    for (const id of pendingIds) {
      const currentQueue = this.getQueue();
      const item = currentQueue.find(q => q.id === id);
      if (!item) continue;

      item.status = 'syncing';
      item.attempts += 1;
      this.saveQueue(currentQueue);

      try {
        const headers = await getHeaders();
        const response = await fetch(apiUrl('/api/protocols'), {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.protocolData),
        });

        if (response.ok) {
          this.removeFromQueue(id);
          synced++;
          console.log(`✅ Synced offline protocol: ${id}`);
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          const freshQueue = this.getQueue();
          const freshItem = freshQueue.find(q => q.id === id);
          if (freshItem) {
            freshItem.status = 'failed';
            freshItem.errorMessage = errorText;
            this.saveQueue(freshQueue);
          }
          failed++;
          console.error(`❌ Failed to sync protocol ${id}: ${errorText}`);
        }
      } catch (error: any) {
        const freshQueue = this.getQueue();
        const freshItem = freshQueue.find(q => q.id === id);
        if (freshItem) {
          freshItem.status = 'pending';
          freshItem.errorMessage = error.message || 'Network error';
          this.saveQueue(freshQueue);
        }
        failed++;
        console.error(`❌ Network error syncing protocol ${id}:`, error);
      }
    }

    console.log(`🔄 Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  },
};
