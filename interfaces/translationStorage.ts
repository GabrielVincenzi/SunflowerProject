import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'translations'

export const translationStorage = {
    key(lang: string) {
        return `${PREFIX}:${lang}`
    },

    async get<T = any>(lang: string): Promise<T | null> {
        const raw = await AsyncStorage.getItem(this.key(lang));
        if (!raw) return null;

        try {
            return JSON.parse(raw) as T;
        } catch (e) {
            console.error("Failed to parse translations", e);
            return null;
        }
    },

    async set(lang: string, data: any) {
        await AsyncStorage.setItem(this.key(lang), JSON.stringify(data))
    },

    async clear(lang?: string) {
        if (lang) {
            await AsyncStorage.removeItem(this.key(lang))
        }
    },
}