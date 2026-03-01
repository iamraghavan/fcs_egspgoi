
"use client";

import { useState, useEffect } from 'react';
import { remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getValue, type Value } from 'firebase/remote-config';

/**
 * Hook to use Firebase Remote Config values.
 * @param key - The key of the remote config parameter.
 * @returns The value of the parameter or null if not yet loaded.
 */
export function useRemoteConfig(key: string): Value | null {
  const [value, setValue] = useState<Value | null>(null);

  useEffect(() => {
    if (!remoteConfig) return;

    const fetchConfig = async () => {
      try {
        await fetchAndActivate(remoteConfig!);
        const remoteValue = getValue(remoteConfig!, key);
        setValue(remoteValue);
      } catch (error) {
        console.error(`Error fetching Remote Config for key: ${key}`, error);
      }
    };

    fetchConfig();
  }, [key]);

  return value;
}
