import { useState, useCallback } from 'react';
import type { Resume } from '../baml_client/types';

const BAML_SERVER_BASE_URL = 'http://localhost:3002';

export const useResume = () => {
  const [data, setData] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback((resumeText: string) => {
    setIsLoading(true);
    setData(null);
    setError(null);

    const url = `${BAML_SERVER_BASE_URL}/baml/stream/ExtractResume?args=${encodeURIComponent(
      JSON.stringify([resumeText]),
    )}`;
    const es = new EventSource(url);

    const safeJson = <T>(raw: string): T | undefined => {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    };

    es.addEventListener('open', () => console.debug('[SSE] open'));

    es.addEventListener('partial', (e) => {
      const payload = safeJson<Partial<Resume>>(
        (e as MessageEvent).data,
      );
      if (!payload) return;

      setData((prev) => {
        // You'll likely want to write your own merge logic here.
        // ... this is a fairly naive implementation for a simple
        // flat object with no nested arrays or objects.
        if (!prev) {
          return payload as Resume;
        }
        return {
          ...prev,
          ...payload,
        };
      });
    });

    es.addEventListener('final', (e) => {
      const payload = safeJson<Resume>((e as MessageEvent).data);
      if (payload) setData(payload);
      setIsLoading(false);
      es.close();
    });

    es.addEventListener('error', (e) => {
      console.error('[SSE] error', e);
      setError(new Error('Stream error'));
      setIsLoading(false);
      es.close();
    });
  }, []);

  return { run, data, isLoading, error };
};

