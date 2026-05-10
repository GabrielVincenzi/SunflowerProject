import { useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Redirect } from "expo-router"; // ✅ use this instead of router.replace
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

    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        if (loaded && isLoaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded, isLoaded]);

    // Still loading fonts or auth — render nothing, keep splash visible
    if (!loaded || !isLoaded) return null;

    const lang = null; // await AsyncStorage.getItem("language")

    //if (isSignedIn) return <Redirect href="/(tabs)/home" />;
    if (!lang) return <Redirect href="/(auth)/lang" />;
    return <Redirect href="/(auth)/sign-in" />;
};

export default HomeIndex;