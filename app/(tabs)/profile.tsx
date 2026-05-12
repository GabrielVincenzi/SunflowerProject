import SunButton from "@/components/SunButton";
import { THEME_COLORS } from "@/constants/utilities";
import { translationStorage } from "@/interfaces/translationStorage";
import { useTranslations } from "@/services/useTranslation";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated";

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get("window");

// --- Signal Synthesis Dot Component ---
const SignalDot = ({
    index,
    isSynthesizing,
    targetPos
}: {
    index: number;
    isSynthesizing: boolean;
    targetPos: { x: number; y: number }
}) => {
    // 1. Stable initial position ensures dots don't drift out of view over time
    const initialPos = useMemo(() => ({
        x: Math.random() * (WINDOW_WIDTH - 20) + 10,
        y: Math.random() * (WINDOW_HEIGHT - 100) + 50
    }), []);

    const x = useSharedValue(initialPos.x);
    const y = useSharedValue(initialPos.y);
    const opacity = useSharedValue(0.2);

    useEffect(() => {
        if (!isSynthesizing) {
            // Floating: Oscillate around the stable initial position to stay "in the view"
            x.value = withRepeat(
                withTiming(initialPos.x + (Math.random() - 0.5) * 80, {
                    duration: 12000 + Math.random() * 6000,
                    easing: Easing.sin
                }),
                -1,
                true
            );
            y.value = withRepeat(
                withTiming(initialPos.y + (Math.random() - 0.5) * 80, {
                    duration: 12000 + Math.random() * 6000,
                    easing: Easing.sin
                }),
                -1,
                true
            );
            opacity.value = withTiming(0.2, { duration: 1000 });
        } else {
            // Snap to Walk: Kill noise and go to signal point
            cancelAnimation(x);
            cancelAnimation(y);
            x.value = withTiming(targetPos.x, { duration: 800, easing: Easing.bezier(0.2, 0, 0, 1) });
            y.value = withTiming(targetPos.y, { duration: 800, easing: Easing.bezier(0.2, 0, 0, 1) });
            opacity.value = withTiming(1, { duration: 400 });
        }
    }, [isSynthesizing, targetPos]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: x.value }, { translateY: y.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[animatedStyle]}
            className={`absolute w-1.5 h-1.5 rounded-full bg-dark`}
        />
    );
};

// --- Big Planet (Dashed Orbital) ---
// Increased visibility for the rotating ring
const BigPlanet = ({ size = 700 }) => {
    const rotate = useSharedValue(0);
    useEffect(() => {
        rotate.value = withRepeat(
            withTiming(360, { duration: 50000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }],
    }));

    return (
        <View pointerEvents="none" className="absolute bottom-[-300] left-0 right-0 items-center z-0">
            {/* Rotating Dotted Ring - High Impact Visibility */}
            <Animated.View
                style={[{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderStyle: 'dashed',
                    borderWidth: 2.5,
                    borderColor: '#141414'
                }, animatedStyle]}
                className="opacity-10"
            />
            {/* Stationary Core Inner Glow */}
            <View
                style={{ width: size - 80, height: size - 80, borderRadius: size / 2, backgroundColor: '#141414' }}
                className="absolute top-10 opacity-[0.04]"
            />
        </View>
    );
};

// --- Profile Screen ---
const Profile = () => {
    const { signOut } = useAuth();
    const { data } = useTranslations();
    const { user } = useUser();
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [linePositions, setLinePositions] = useState<{ x: number; y: number }[]>([]);

    const dotCount = 45;

    const generateRandomWalk = useCallback(() => {
        const positions = [];
        let currentY = WINDOW_HEIGHT / 2 + 50;
        const stepX = (WINDOW_WIDTH - 80) / dotCount;

        for (let i = 0; i < dotCount; i++) {
            positions.push({ x: 40 + i * stepX, y: currentY });
            currentY += (Math.random() - 0.5) * 180;
            if (currentY < 250) currentY = 300;
            if (currentY > WINDOW_HEIGHT - 250) currentY = WINDOW_HEIGHT - 300;
        }
        return positions;
    }, []);

    const handleToggle = () => {
        if (!isSynthesizing) setLinePositions(generateRandomWalk());
        setIsSynthesizing(!isSynthesizing);
    };

    if (!data) return null;
    const t: any = data.payload;

    return (
        <View className="flex-1 bg-primary">
            {/* Animated Background Layers */}
            <BigPlanet />
            <View className="absolute inset-0 z-0">
                {Array.from({ length: dotCount }).map((_, i) => (
                    <SignalDot
                        key={i}
                        index={i}
                        isSynthesizing={isSynthesizing}
                        targetPos={linePositions[i] || { x: 0, y: 0 }}
                    />
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-8 pt-20 z-10">
                {/* Header Header Header Label */}
                <Animated.View entering={FadeInDown.delay(100)} className="mb-12">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="h-[2px] w-10 bg-dark" />
                        <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                            {t.profile.label}
                        </Text>
                    </View>
                    <Text className="text-6xl font-elms-bold italic text-dark tracking-tighter leading-none">
                        {t.profile.title}
                    </Text>
                </Animated.View>

                {/* Avatar Block */}
                <View className="items-center mb-16">
                    <View className="relative">
                        <View className="absolute inset-0 bg-dark rounded-[40px] translate-x-3 translate-y-3" />
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleToggle}
                            className={`w-32 h-32 rounded-[40px] items-center justify-center border-4 border-dark overflow-hidden ${isSynthesizing ? 'bg-primary' : 'bg-white'}`}
                        >
                            <Feather name="user" size={56} color="#141414" />
                            {isSynthesizing && <View className="absolute inset-0 bg-dark/5" />}
                        </TouchableOpacity>
                        <View className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-primary ${isSynthesizing ? 'bg-green-500' : 'bg-dark'}`} />
                    </View>

                    <Animated.View entering={FadeInDown.delay(300)} className="items-center mt-10">
                        <Text className="text-4xl font-elms-bold italic text-dark tracking-tighter leading-none">
                            {user?.firstName || "EXPR_001"}
                        </Text>
                        <Text className="text-xs font-elms-bold text-dark/40 uppercase tracking-[0.2em] mt-3 text-center">
                            ID: {user?.id?.slice(-8) || "882.3.S-NODE"}
                        </Text>
                    </Animated.View>
                </View>

                {/* Stats Grid */}
                <Animated.View entering={FadeInDown.delay(400)} className="flex-row gap-5 mb-16">
                    <View className="flex-1 relative h-24">
                        <View className="absolute inset-0 bg-dark rounded-3xl translate-x-1.5 translate-y-1.5" />
                        <View className="flex-1 bg-white border-2 border-dark p-4 rounded-3xl justify-center">
                            <Text className="text-[9px] font-elms-bold text-dark/40 uppercase tracking-widest mb-1">{t.profile.stats.signals}</Text>
                            <Text className="text-2xl font-elms-bold text-dark italic leading-none">1.2k</Text>
                        </View>
                    </View>
                    <View className="flex-1 relative h-24">
                        <View className="absolute inset-0 bg-dark rounded-3xl translate-x-1.5 translate-y-1.5" />
                        <View className="flex-1 bg-white border-2 border-dark p-4 rounded-3xl justify-center">
                            <Text className="text-[9px] font-elms-bold text-dark/40 uppercase tracking-widest mb-1">{t.profile.stats.accuracy}</Text>
                            <Text className="text-2xl font-elms-bold text-dark italic leading-none">94%</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Options List */}
                <Animated.View entering={FadeInDown.delay(500)} className="space-y-4">
                    <Text className="text-[10px] font-elms-bold text-dark/40 uppercase tracking-[0.35em] mb-4">{t.profile.settings.label}</Text>

                    {[
                        { icon: "settings", label: t.profile.settings.items.preferences },
                        { icon: "shield", label: t.profile.settings.items.secureVault },
                        { icon: "help-circle", label: t.profile.settings.items.manual },
                    ].map((item, idx) => (
                        <View key={idx} className="relative w-full mb-2">
                            <View className="absolute inset-0 bg-dark rounded-[24px] translate-y-1.5" />
                            <TouchableOpacity
                                className="flex-row items-center py-5 px-6 bg-white border-2 border-dark rounded-[24px]"
                                activeOpacity={0.8}
                            >
                                <View className="w-10 h-10 items-center justify-center rounded-2xl bg-primary/20">
                                    <Feather name={item.icon as any} size={18} color={THEME_COLORS.dark} />
                                </View>
                                <Text className="text-lg font-elms-bold italic text-dark ml-4 tracking-tight">{item.label}</Text>
                                <Feather name="arrow-right" size={18} color={THEME_COLORS.dark} className="-rotate-45" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={() => signOut()}
                        className="flex-row items-center mb-4 justify-center py-6 border-4 border-dark rounded-[32px] mt-10 active:bg-dark group"
                    >
                        <Text className="text-xl font-elms-bold italic text-dark uppercase tracking-widest">Sign out{t.profile.settings.terminateSession}</Text>
                    </TouchableOpacity>

                    <SunButton text="Clear Lang" onPress={async () => {
                        await AsyncStorage.removeItem("language");
                        await translationStorage.clear("en");
                        await translationStorage.clear("it");
                        router.replace("/(preauth)/lang");
                    }} />
                </Animated.View>

                <View style={{ height: 150 }} />
            </ScrollView>
        </View>
    );
};

export default Profile;