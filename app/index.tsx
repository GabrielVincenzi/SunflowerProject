import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { RelativePathString, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

const HomeIndex = () => {
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

    const { isLoaded, sessionId } = useAuth(); // use `isLoaded` to ensure auth is ready

    useEffect(() => {
        const checkRedirect = async () => {
            if (!isLoaded || !loaded) return; // wait for fonts & auth
            if (sessionId === undefined) return; // wait until Clerk *knows* whether a session exists

            const lang = await AsyncStorage.getItem("language");
            let replacedUrl = "/(tabs)/home" as RelativePathString; // default

            if (!lang) {
                replacedUrl = "/(auth)/lang" as RelativePathString;
            }
            else if (!sessionId) {
                replacedUrl = "/(auth)/sign-in" as RelativePathString;
            }

            router.replace(replacedUrl);

            // hide splash AFTER navigation decision
            await SplashScreen.hideAsync();
        };

        checkRedirect();
    }, [sessionId, isLoaded, loaded]);

    // while waiting for fonts/auth, render nothing
    return null;
};

export default HomeIndex;