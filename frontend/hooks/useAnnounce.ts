import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

// Reads a message aloud with VoiceOver or TalkBack whenever it appears or changes.
// Works on both platforms, unlike accessibilityLiveRegion, which is Android only.
export function useAnnounce(message: string | null | undefined): void {
  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);
}
