import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

const HomeIndex = () => {
    const [lang, setLang] = useState<string | null>(null);
    const [langLoaded, setLangLoaded] = useState(false);

    const [loaded] = useFonts({
        "Geist-Regular": require("../assets/fonts/Geist-Regular.ttf"),
        "Geist-ExtraBold": require("../assets/fonts/Geist-ExtraBold.ttf"),
        "Geist-ExtraLight": require("../assets/fonts/Geist-ExtraLight.ttf"),
        "Elms-Regular": require("../assets/fonts/ElmsSans-Regular.ttf"),
        "Elms-ExtraBold": require("../assets/fonts/ElmsSans-ExtraBold.ttf"),
        "Elms-Bold": require("../assets/fonts/ElmsSans-Bold.ttf"),
        "Elms-ExtraLight": require("../assets/fonts/ElmsSans-ExtraLight.ttf"),
        "Elms-Thin": require("../assets/fonts/ElmsSans-Thin.ttf"),
    });

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
        if (loaded && isLoaded && langLoaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded, isLoaded, langLoaded]);

    if (!loaded || !isLoaded || !langLoaded) return null;

    if (isSignedIn) return <Redirect href="/(tabs)/home" />;
    if (!lang) return <Redirect href="/(preauth)/lang" />;
    return <Redirect href="/(auth)/sign-in" />;
};

export default HomeIndex;