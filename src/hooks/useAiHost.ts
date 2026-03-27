import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

let cachedHost: string | null = null;

export function useAiHost() {
  const [host, setHost] = useState<string>(cachedHost || 'localhost');
  const [loading, setLoading] = useState(!cachedHost);

  useEffect(() => {
    if (cachedHost) return;

    async function fetchHost() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('system_configs')
          .select('value')
          .eq('key', 'ai_service_host')
          .single();

        if (data && data.value) {
          cachedHost = data.value;
          setHost(data.value);
        }
      } catch (e) {
        console.error('Failed to fetch AI host from Supabase, falling back to localhost:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchHost();
  }, []);

  // On desktop, even if a remote IP is found, we might want to prioritize localhost
  // But for zero-config simplicity, we trust the discovered host or fallback to window.location.hostname
  const activeHost = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'localhost'
    : host;

  return { aiHost: activeHost, loading };
}
