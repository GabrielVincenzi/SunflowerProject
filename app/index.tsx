import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const HomeIndex = () => {
    const router = useRouter();
    const [lang, setLang] = useState<string | null>(null);
    const [langLoaded, setLangLoaded] = useState(false)
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        const checkLanguage = async () => {
            try {
                const storedLang = await AsyncStorage.getItem("language");
                setLang(storedLang);
            } catch (error) {
                console.error("Failed to read language from storage:", error);
            } finally {
                setLangLoaded(true);
            }
        };
        checkLanguage();
    }, []);

    useEffect(() => {
        if (!isLoaded || !langLoaded) return;

        if (isSignedIn) {
            router.replace("/(tabs)/home");
        } else if (!lang) {
            router.replace("/(preauth)/lang");
        } else {
            router.replace("/(auth)/sign-in");
        }
    }, [isLoaded, langLoaded, isSignedIn, lang]);

    return null;
};

export default HomeIndex;