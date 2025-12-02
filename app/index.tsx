import { useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Redirect } from "expo-router";

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

    const { isSignedIn } = useAuth();

    if (!loaded) return null;
    if (!isSignedIn) {
        return <Redirect href="/(auth)/welcome" />
    }

};

export default HomeIndex;

// <Redirect href="/(auth)/welcome" />