import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Layout() {
    return (
        <SafeAreaProvider>
            <StatusBar hidden={true} />
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="event" options={{ headerShown: false }} />
                <Stack.Screen name="inquiry" options={{ headerShown: false }} />
                <Stack.Screen name="signal" options={{ headerShown: false }} />
            </Stack>
        </SafeAreaProvider>
    )
}

