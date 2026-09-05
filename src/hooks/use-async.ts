"use client";

/* eslint-disable react-hooks/refs, react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from "react";

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const hasDataRef = useRef(false);
  hasDataRef.current = data != null;

  async function reload() {
    if (!hasDataRef.current) {
      setLoading(true);
    }
    try {
      const result = await loaderRef.current();
      setData(result);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await loaderRef.current();
        if (cancelled) {
          return;
        }
        setData(result);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setError(caught instanceof Error ? caught.message : "Unable to load data");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, error, loading, reload };
}
