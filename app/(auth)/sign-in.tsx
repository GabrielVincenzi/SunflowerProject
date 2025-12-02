import { useSSO } from "@clerk/clerk-expo";
import { OAuthStrategy } from "@clerk/types";
import { AntDesign } from "@expo/vector-icons";
import { Link } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const SignIn = () => {
    const insets = useSafeAreaInsets();
    const keyboardVerticalOffset = insets.top + 10;

    const { startSSOFlow } = useSSO();
    const handleSocialSignIn = async (provider: string) => {
        try {
            const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
                strategy: provider as OAuthStrategy,
            });

            if (createdSessionId) {
                setActive?.({
                    session: createdSessionId,
                    navigate: async ({ session }) => { },
                });
            } else {
                // If there is no createdSessionId
                // there are missing requirements, such as MFA
                // use the signIn or signUp returned from 
                // startSSOFlow to handle next steps
            }
        } catch (error) {
            console.log(error);
        }
    };

    const openLink = () => {
        WebBrowser.openBrowserAsync('https://www.google.com/')
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <SafeAreaView className="flex-1 pt-16 px-10">
                        <View className="items-center mb-10">
                            <View className="w-32 h-32 mb-6">
                                <Image
                                    className="w-32 h-32"
                                    source={require('@/assets/images/logoMain.png')}
                                />
                            </View>
                            <Text className="text-2xl">Sign In</Text>
                        </View>

                        <View className="gap-6">
                            <TouchableOpacity
                                className="border py-4 flex-row items-center justify-center gap-2 rounded-lg border-slate-300"
                                onPress={() => handleSocialSignIn('oauth_apple')}
                            >
                                <AntDesign name="apple" size={20} color={'#000'} />
                                <Text className="text-medium">Continue with Apple</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="border py-4 flex-row items-center justify-center gap-2 rounded-lg border-slate-300"
                                onPress={() => handleSocialSignIn('oauth_google')}
                            >
                                <AntDesign name="google" size={20} color={'#000'} />
                                <Text className="text-medium">Continue with Google</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center my-4 gap-4">
                            <View className="flex-1 h-0.5 bg-slate-300" />
                            <Text className="text-sm text-slate-400">OR</Text>
                            <View className="flex-1 h-0.5 bg-slate-300" />
                        </View>

                        <View className="mb-2">
                            <TextInput
                                className="border border-secondary rounded-lg p-4 mb-4"
                                placeholder="Email"
                                placeholderTextColor={'#999'}
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect={false}
                                keyboardType="email-address"
                                returnKeyType="done"
                            />

                            <TouchableOpacity className="bg-secondary text-base p-4 rounded-lg items-center justify-center">
                                <Text className="text-md">Next</Text>
                            </TouchableOpacity>

                            <Link href={"/(tabs)/home"} replace asChild>
                                <TouchableOpacity className="text-base p-2 items-center justify-center">
                                    <Text className="text-secondary mt-2 font-bold">Skip for now</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View className="mt-6">
                            <Text className="text-sm text-slate-400 items-center text-center">
                                By proceeding, you agree to: {'\n'}
                                Sunflower's <Text className="text-secondary underline" onPress={openLink}>Terms of Service</Text>
                            </Text>
                        </View>

                    </SafeAreaView>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default SignIn;