import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_MS = 2400;

export type ToastMessage = {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string, icon: ToastMessage['icon'] = 'checkmark-circle') => {
    clearTimeout(timer.current);
    setToast({ text, icon });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show };
}
