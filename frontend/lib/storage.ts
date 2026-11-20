import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'joteku:';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIX + key);
  },
};
