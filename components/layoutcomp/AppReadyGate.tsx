// AppReadyGate.tsx
import { useLanguage } from '@/components/layoutcomp/LanguageContext';
import { useTranslations } from '@/services/useTranslation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

export function AppReadyGate({ children }: { children: React.ReactNode }) {
    const { isReady: langReady } = useLanguage();
    const { isSuccess, isError } = useTranslations();

    // isError included so a failed fetch (e.g. no network, ever) doesn't hang forever
    const ready = langReady && (isSuccess || isError);

    useEffect(() => {
        if (ready) SplashScreen.hideAsync();
    }, [ready]);

    if (!ready) return null; // native splash is still covering this
    return <>{children}</>;
}