import { useEffect, useRef, useState } from 'react';
import type { ProcessedData } from '../workers/dataWorker';

export function useDataWorker(
  data: Array<{ speed: number; rpm: number; timestamp: number; faultCodes: number[] }>,
) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<ProcessedData | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/dataWorker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e: MessageEvent<ProcessedData>) => {
      setResult(e.data);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (data.length > 0 && workerRef.current) {
      workerRef.current.postMessage(data);
    }
  }, [data]);

  return result;
}
