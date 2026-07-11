import { THEME_COLORS } from "@/constants/utilities";
import { useTranslations } from "@/services/useTranslation";
import { useAuth, useSignIn, useSSO } from "@clerk/clerk-expo";
import { OAuthStrategy } from "@clerk/types";
import { AntDesign } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
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
    const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
    const insets = useSafeAreaInsets();
    const keyboardVerticalOffset = insets.top + 10;

    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    if (!isLoaded || !data) return null;
    const t: any = data.payload;

    const handleSocialSignIn = async (provider: string) => {
        try {
            const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({
                strategy: provider as OAuthStrategy,
            });
            if (createdSessionId) {
                await setActiveSSO?.({ session: createdSessionId });
                router.replace("/(tabs)/home");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleEmailSignIn = async () => {
        if (!signInLoaded || !email) return;
        setIsSubmitting(true);
        try {
            const result = await signIn.create({ identifier: email });
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                router.replace("/(tabs)/home");
            }
            // handle MFA / other statuses here if needed
        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Same offset "pop" card used for pills and option rows elsewhere in the
    // app — just toned down a notch. The backing layer is a muted secondary
    // color rather than full primary yellow, so these two read as secondary
    // actions and don't compete with the one dominant CTA below.
    const SocialCard = ({ icon, label, provider }: any) => (
        <View className="relative w-full mb-3.5">
            <View
                className="absolute inset-0 rounded-[22px] translate-y-[5px] translate-x-[5px]"
                style={{ backgroundColor: THEME_COLORS.secondary, opacity: 0.5 }}
            />
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSocialSignIn(provider)}
                className="py-4 px-6 rounded-[22px] border-[1.5px] flex-row items-center justify-center gap-3"
                style={{ backgroundColor: THEME_COLORS.background, borderColor: THEME_COLORS.dark }}
            >
                <AntDesign name={icon} size={20} color={THEME_COLORS.dark} />
                <Text className="text-base font-elms-bold" style={{ color: THEME_COLORS.dark }}>{label}</Text>
            </TouchableOpacity>
        </View>
    );

    const emailReady = email.trim().length > 0;

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: THEME_COLORS.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} scrollEnabled={false}>
                    <SafeAreaView className="flex-1 px-7 pt-8">
                        {/* Brand mark — same offset-pop treatment as the buttons below,
                            so it reads as part of the same system rather than a
                            leftover from an older screen. */}
                        <View className="items-center mb-10">
                            <View className="relative mb-6">
                                <View
                                    className="absolute rounded-[28px] top-[6px] left-[6px] right-[-6px] bottom-[-6px]"
                                    style={{ backgroundColor: THEME_COLORS.primary }}
                                />
                                <View
                                    className="w-20 h-20 rounded-[28px] items-center justify-center"
                                    style={{ backgroundColor: THEME_COLORS.dark }}
                                >
                                    <Image
                                        className="w-11 h-11"
                                        source={require('@/assets/images/logoMain.png')}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                            <Text
                                className="font-elms-bold italic text-[32px] text-center"
                                style={{ color: THEME_COLORS.dark, lineHeight: 34 }}
                            >
                                {t.signIn.title}
                            </Text>
                        </View>

                        <View>
                            <SocialCard icon="apple" label={t.signIn.socialButtons.apple} provider="oauth_apple" />
                            <SocialCard icon="google" label={t.signIn.socialButtons.google} provider="oauth_google" />
                        </View>

                        <View className="flex-row items-center my-8 gap-3">
                            <View className="flex-1 h-[1.5px]" style={{ backgroundColor: "rgba(52,58,64,0.12)" }} />
                            <Text
                                className="font-elms-bold text-[10px] uppercase tracking-[0.25em]"
                                style={{ color: "rgba(52,58,64,0.35)" }}
                            >
                                {t.signIn.orSeparator}
                            </Text>
                            <View className="flex-1 h-[1.5px]" style={{ backgroundColor: "rgba(52,58,64,0.12)" }} />
                        </View>

                        <View className="gap-3">
                            {/* Text field is deliberately flat — no offset "pop" shadow.
                                That affordance is reserved for tappable buttons; giving
                                an input the same treatment tells the eye it's pushable
                                like a button, which it isn't. Focus state just darkens
                                the border, which is the correct signal for a field. */}
                            <TextInput
                                className="py-4 px-5 rounded-[20px] font-elms-regular text-base border-[1.5px]"
                                style={{
                                    backgroundColor: THEME_COLORS.background,
                                    borderColor: isEmailFocused ? THEME_COLORS.dark : "rgba(52,58,64,0.16)",
                                    color: THEME_COLORS.dark,
                                }}
                                placeholder="Access ID (Email)"
                                placeholderTextColor="rgba(52,58,64,0.35)"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setIsEmailFocused(true)}
                                onBlur={() => setIsEmailFocused(false)}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                returnKeyType="go"
                                onSubmitEditing={handleEmailSignIn}
                            />

                            {/* Primary CTA — the one button on this screen that gets the
                                full-strength offset-pop treatment, dimming when the
                                field is empty so the disabled state is visible before
                                the user even taps it (handleEmailSignIn already no-ops
                                on empty email; this just surfaces that state). */}
                            <View className="relative">
                                <View
                                    className="absolute inset-0 rounded-[22px] translate-y-[5px] translate-x-[5px]"
                                    style={{ backgroundColor: THEME_COLORS.primary, opacity: emailReady ? 1 : 0.4 }}
                                />
                                <TouchableOpacity
                                    onPress={handleEmailSignIn}
                                    disabled={isSubmitting || !emailReady}
                                    activeOpacity={0.9}
                                    className="py-4.5 rounded-[22px] items-center justify-center"
                                    style={{ backgroundColor: THEME_COLORS.dark, opacity: emailReady ? 1 : 0.5 }}
                                >
                                    <Text
                                        className="font-elms-bold italic text-lg tracking-wide"
                                        style={{ color: THEME_COLORS.background }}
                                    >
                                        {isSubmitting ? "..." : t.signIn.nextButton}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Link href={"/(tabs)/home"} replace asChild>
                                <TouchableOpacity className="py-4 items-center">
                                    <Text
                                        className="font-elms-regular text-[13px] underline"
                                        style={{ color: "rgba(52,58,64,0.5)" }}
                                    >
                                        {t.signIn.skip}
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </SafeAreaView>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default SignIn;