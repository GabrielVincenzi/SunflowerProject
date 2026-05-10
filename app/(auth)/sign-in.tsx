import { useTranslations } from "@/services/useTranslation";
import { useAuth, useSSO } from "@clerk/clerk-expo";
import { OAuthStrategy } from "@clerk/types";
import { AntDesign } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
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
    const { isLoaded } = useAuth();
    const { data } = useTranslations();
    const { startSSOFlow } = useSSO();
    const insets = useSafeAreaInsets();
    const keyboardVerticalOffset = insets.top + 10;
    const queryclient = useQueryClient();

    if (!isLoaded || !data) return null;
    const t: any = data.payload;

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

    const SocialCard = ({ icon, label, provider }: any) => (
        <View className="relative w-full mb-4">
            <View className="absolute inset-0 bg-dark rounded-[24px] translate-y-1.5" />
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleSocialSignIn(provider)}
                className="bg-white border-2 border-dark py-5 px-6 rounded-[24px] flex-row items-center justify-center gap-4"
            >
                <AntDesign name={icon} size={24} color="#141414" />
                <Text className="text-xl font-elms-bold italic tracking-tight text-dark">{label}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView className="flex-1 bg-primary"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} scrollEnabled={false}>
                    <SafeAreaView className="flex-1 px-8 pt-10">
                        {/* Branding */}
                        <View className="items-center mb-12">
                            <View className="w-24 h-24 bg-dark rounded-[32px] items-center justify-center shadow-xl mb-6">
                                <Image className="w-16 h-16" source={require('@/assets/images/logoMain.png')} resizeMode="contain" />
                            </View>
                            <Text className="text-4xl font-elms-bold italic tracking-tighter text-dark text-center leading-none">
                                {t.signIn.title}
                            </Text>
                        </View>

                        <View className="gap-2">
                            <SocialCard icon="apple" label={t.signIn.socialButtons.apple} provider="oauth_apple" />
                            <SocialCard icon="google" label={t.signIn.socialButtons.google} provider="oauth_google" />
                        </View>

                        <View className="flex-row items-center my-10 gap-4">
                            <View className="flex-1 h-[2px] bg-dark opacity-10" />
                            <Text className="text-[10px] font-elms-bold uppercase tracking-[0.3em] text-dark/30">{t.signIn.orSeparator}</Text>
                            <View className="flex-1 h-[2px] bg-dark opacity-10" />
                        </View>

                        <View className="space-y-4">
                            <View className="relative w-full mb-2">
                                <View className="absolute inset-0 bg-dark/5 rounded-[24px] translate-y-1" />
                                <TextInput
                                    className="border-2 border-dark rounded-[24px] p-5 font-elms-bold italic text-lg bg-white/50"
                                    placeholder="Access ID (Email)"
                                    placeholderTextColor="rgba(20,20,20,0.2)"
                                />
                            </View>

                            <TouchableOpacity className="bg-dark py-6 rounded-[24px] items-center justify-center active:scale-[0.98]">
                                <Text className="text-primary font-elms-bold italic text-xl tracking-widest">{t.signIn.nextButton.toUpperCase()}</Text>
                            </TouchableOpacity>

                            <Link href={"/(tabs)/home"} replace asChild>
                                <TouchableOpacity className="py-4 items-center">
                                    <Text className="text-dark/40 font-elms-bold italic uppercase tracking-widest text-xs">{t.signIn.skip}</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </SafeAreaView>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

export default SignIn;