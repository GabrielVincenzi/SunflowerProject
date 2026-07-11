import OptionCard from "@/components/cards/OptionCard";
import OutlineFlower from "@/components/design/OutlineSunFlower";
import ProgressBar from "@/components/design/ProgressBar";
import AnimatedWords from "@/components/layoutcomp/DelayedWords";
import SunButton from "@/components/SunButton2";
import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";


function Headline({ children, active, size = 32 }: { children: string; active: boolean; size?: number }) {
    return (
        <View className="mt-16">
            <AnimatedWords
                text={children}
                active={active}
                baseDelay={80}
                stagger={70}
                className="font-elms-bold text-4xl"
                style={{ lineHeight: size, color: THEME_COLORS.dark }}
            />
        </View>
    );
}

function Body({ children, active }: { children: string; active: boolean }) {
    return (
        <View className="mt-4 mb-8">
            <AnimatedWords
                text={children}
                active={active}
                baseDelay={220}
                stagger={38}
                className="font-elms-regular text-md"
                style={{ color: THEME_COLORS.grey }}
            />
        </View>
    );
}


/* ------------------------------------------------------------------ */
/* Static decorative background lines for the topics slide              */
/* ------------------------------------------------------------------ */
const CHART_LINE_D =
    "M0,150 C40,140 60,110 90,120 C130,135 150,90 190,95 C230,100 250,60 290,55 C320,50 340,20 380,10";

function TopicBackgroundLines() {
    return (
        <Svg
            width="100%"
            height="100%"
            viewBox="0 0 380 160"
            className="absolute opacity-[0.16]"
            preserveAspectRatio="none"
            pointerEvents="none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4 }}
        >
            <Path d={CHART_LINE_D} fill="none" stroke={THEME_COLORS.grey} strokeWidth={2} />
            <Path
                d={CHART_LINE_D}
                fill="none"
                stroke={THEME_COLORS.secondary}
                strokeWidth={1}
                transform={[{ translateY: 26 }, { scaleY: 0.7 }]}
            />
        </Svg>
    );
}


/* ------------------------------------------------------------------ */
/* Content constants — unchanged                                        */
/* ------------------------------------------------------------------ */
const SLIDES = ["hero", "topics", "path", "reveal"] as const;

const CATEGORIES = [
    { key: "climate", icon: "globe", label: "Climate & Environment" },
    { key: "economies", icon: "shopping-cart", label: "Global Economies" },
    { key: "tech", icon: "cpu", label: "Tech & AI Shifts" },
    { key: "health", icon: "users", label: "Public Health & Science" },
];

const PATHS = [
    { key: "casual", label: "The Casual Explorer", description: "Quick insights, visual storytelling" },
    { key: "analyst", label: "The Data Analyst", description: "Deep dives, technical metrics, raw code" },
];

const CHART_TITLES: Record<string, string> = {
    climate: "Tracking Global Renewable Energy Adoption (2015–2026)",
    economies: "Global GDP Growth, Quarter by Quarter",
    tech: "AI Compute Growth Since 2018",
    health: "Vaccination Coverage Worldwide",
};

const PROGRESS_TARGET: Record<number, number> = { 1: 30, 2: 65, 3: 90 };

/* ------------------------------------------------------------------ */
/* Parallax: gives each slide a subtle scale/opacity/lift based on its  */
/* distance from the active index, driven straight off translateX.     */
/* This is what keeps the transition from reading as a flat "swipe a    */
/* card left" carousel — it's still a slider mechanically, it just      */
/* doesn't look or feel like one.                                       */
/* ------------------------------------------------------------------ */
function useParallaxStyle(slideIndex: number, translateX: SharedValue<number>, width: number) {
    return useAnimatedStyle(() => {
        const relative = (translateX.value + slideIndex * width) / width; // 0 = active, ±1 = neighbor
        const opacity = interpolate(relative, [-1, 0, 1], [0.4, 1, 0.4], Extrapolation.CLAMP);
        const scale = interpolate(relative, [-1, 0, 1], [0.95, 1, 0.95], Extrapolation.CLAMP);
        const translateY = interpolate(relative, [-1, 0, 1], [12, 0, 12], Extrapolation.CLAMP);
        return { opacity, transform: [{ scale }, { translateY }] };
    });
}

/* ------------------------------------------------------------------ */
/* Main screen                                                          */
/* ------------------------------------------------------------------ */
export default function OnboardingScreen() {
    const { width } = Dimensions.get("window");

    const [index, setIndex] = useState(0);
    const translateX = useSharedValue(0);
    const dragStartX = useSharedValue(0);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [progress, setProgress] = useState(10);

    // Measured once from the overlays themselves (see below) so the padding
    // slides 1-3 reserve for the floating header/footer always matches the
    // real rendered chrome height — no magic numbers to keep in sync.
    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);

    function canAdvance(i: number) {
        if (i === 1) return selectedCategories.length > 0;
        if (i === 2) return selectedPath !== null;
        return true;
    }

    function goTo(i: number) {
        const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
        if (clamped > index && !canAdvance(index)) {
            translateX.value = withTiming(-index * width, { duration: 300, easing: Easing.out(Easing.cubic) });
            return;
        }
        setIndex(clamped);
        translateX.value = withTiming(-clamped * width, { duration: 450, easing: Easing.out(Easing.cubic) });
        const target = PROGRESS_TARGET[clamped];
        if (target != null) setTimeout(() => setProgress(target), 160);
    }

    function toggleCategory(key: string) {
        setSelectedCategories((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    }

    // Pan gesture now live-tracks the finger via onUpdate (clamped to the
    // carousel's bounds) instead of only reacting on release. onEnd decides
    // whether to commit to the next/previous slide or snap back.
    const pan = Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
            dragStartX.value = translateX.value;
        })
        .onUpdate((e) => {
            const min = -(SLIDES.length - 1) * width;
            const next = dragStartX.value + e.translationX;
            translateX.value = Math.min(0, Math.max(min, next));
        })
        .onEnd((e) => {
            if (e.translationX < -60) goTo(index + 1);
            else if (e.translationX > 60) goTo(index - 1);
            else goTo(index);
        });

    // Fixed number of slides (4), so calling this hook 4x in a row every
    // render is safe — same hook order every time.
    const slideStyles = [
        useParallaxStyle(0, translateX, width),
        useParallaxStyle(1, translateX, width),
        useParallaxStyle(2, translateX, width),
        useParallaxStyle(3, translateX, width),
    ];

    const trackStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Chrome (header/footer) opacity is a continuous function of translateX,
    // not of the discrete `index` state — it fades in smoothly as you leave
    // slide 0, in step with the actual drag/animation, rather than snapping.
    const chromeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, -width * 0.5], [0, 1], Extrapolation.CLAMP),
    }));

    const chartKey = CATEGORIES.map((c) => c.key).find((k) => selectedCategories.includes(k)) || "";
    const chartTitle = CHART_TITLES[chartKey];

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1" style={{ backgroundColor: THEME_COLORS.background }}>
                <View className="flex-1">
                    {/* Carousel: always fills the full available height. Header and
                        footer are absolutely positioned overlays on top of it, so
                        their appearance never resizes this box. That resize used to
                        happen the instant `index` changed — before the slide had
                        actually finished animating in — which is what caused slide 0's
                        bottom-anchored content to jump. */}
                    <GestureDetector gesture={pan}>
                        <View className="flex-1 overflow-hidden">
                            <Animated.View style={[{ flexDirection: "row", width: width * SLIDES.length, flex: 1 }, trackStyle]}>
                                {/* Slide 0 — hero */}
                                <Animated.View style={[{ width }, slideStyles[0]]} className="items-center px-8">
                                    <View className="flex-1" />
                                    <OutlineFlower size={140} />
                                    <Text className="font-elms-bold text-[44px] mt-[22px] mb-2" style={{ color: THEME_COLORS.dark }}>
                                        Sunflower
                                    </Text>
                                    <Text className="font-elms-regular text-[15px] mb-10" style={{ color: "rgba(52,58,64,0.55)" }}>
                                        Chart the world for free.
                                    </Text>
                                    <View className="w-full items-center gap-3.5 pb-7">
                                        <SunButton label="Get Started" icon={<Feather name="arrow-right" size={15} color={THEME_COLORS.background} />} onPress={() => goTo(1)} />
                                        <Pressable onPress={() => router.replace("(auth)/sign-in)")}>
                                            <Text className="font-elms-regular text-[12.5px] underline" style={{ color: "rgba(52,58,64,0.5)" }}>
                                                I already have an account
                                            </Text>
                                        </Pressable>
                                    </View>
                                </Animated.View>

                                {/* Slide 1 — topics */}
                                <Animated.View
                                    style={[{ width, paddingTop: headerHeight, paddingBottom: footerHeight }, slideStyles[1]]}
                                    className="px-6"
                                >
                                    <TopicBackgroundLines />
                                    <Headline active={index === 1}>The world is drowning in information, but starving for wisdom.</Headline>
                                    <Body active={index === 1}>
                                        Let's calibrate your data engine — a first step to turn towards the light. What matters to you most?
                                    </Body>
                                    <View className="mt-4.5 gap-4">
                                        {CATEGORIES.map((c, i) => (
                                            <OptionCard
                                                key={c.key}
                                                icon={c.icon}
                                                label={c.label}
                                                selected={selectedCategories.includes(c.key)}
                                                onPress={() => toggleCategory(c.key)}
                                                delay={100 + i * 70}
                                                active={index === 1}
                                            />
                                        ))}
                                    </View>
                                </Animated.View>

                                {/* Slide 2 — path */}
                                <Animated.View
                                    style={[{ width, paddingTop: headerHeight, paddingBottom: footerHeight }, slideStyles[2]]}
                                    className="px-6"
                                >
                                    <Headline active={index === 2}>We lack the instruments to pass from open data to open understanding.</Headline>
                                    <Body active={index === 2}>Choose your path of exploration:</Body>
                                    <View className="mt-4.5 gap-2.5">
                                        {PATHS.map((p, i) => (
                                            <OptionCard
                                                key={p.key}
                                                label={p.label}
                                                description={p.description}
                                                radio
                                                selected={selectedPath === p.key}
                                                onPress={() => setSelectedPath(p.key)}
                                                delay={100 + i * 90}
                                                active={index === 2}
                                            />
                                        ))}
                                    </View>
                                </Animated.View>

                                {/* Slide 3 — reveal */}
                                <Animated.View
                                    style={[{ width, paddingTop: headerHeight, paddingBottom: footerHeight }, slideStyles[3]]}
                                    className="px-6"
                                >
                                    <View className="flex-row items-center gap-2.5 mb-4">
                                        <View className="flex-1">
                                            <Headline active={index === 3}>
                                                Or better... we lacked. Welcome to Sunflower.
                                            </Headline>
                                        </View>
                                    </View>
                                    <Text className="font-elms-bold italic text-[13.5px] mb-1" style={{ color: THEME_COLORS.secondary }}>
                                        "{chartTitle}"
                                    </Text>
                                </Animated.View>
                            </Animated.View>
                        </View>
                    </GestureDetector>

                    {/* Header overlay — always mounted, never affects carousel height.
                        pointerEvents is still gated on `index` so slide 0 stays fully
                        swipeable even while this sits invisibly on top of it. */}
                    <Animated.View
                        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                        pointerEvents={index > 0 ? "auto" : "none"}
                        style={[
                            { position: "absolute", top: 0, left: 0, right: 0 },
                            chromeOpacity
                        ]}
                        className="px-6 pt-2"
                    >
                        <ProgressBar value={progress} pulse={index === 3 && progress >= 90} />
                        <Pressable
                            onPress={() => goTo(index - 1)}
                            className="flex-row items-center mt-2.5 gap-1"
                        >
                            <Feather name="arrow-left" size={12} color="rgba(52,58,64,0.4)" />
                            <Text
                                className="font-elms-regular text-xs"
                                style={{ color: "rgba(52,58,64,0.4)" }}
                            >
                                Back
                            </Text>
                        </Pressable>
                    </Animated.View>

                    {/* Footer overlay — same idea. Slides 1-3 pad themselves by
                        footerHeight so nothing sits underneath it. */}
                    <Animated.View
                        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                        pointerEvents={index > 0 ? "auto" : "none"}
                        style={[{ position: "absolute", bottom: 0, left: 0, right: 0 }, chromeOpacity]}
                        className="px-6 pt-3.5 pb-7"
                    >
                        {index === 3 ? (
                            <SunButton
                                label="Next: Open My Dashboard"
                                icon={<Feather name="arrow-right" size={15} color={THEME_COLORS.background} />}
                                onPress={() => router.replace("/(auth)/sign-in")}
                            />
                        ) : (
                            <View className="w-[140px] self-end">
                                <SunButton
                                    label="Next"
                                    icon={<Feather name="arrow-right" size={15} color={THEME_COLORS.background} />}
                                    onPress={() => goTo(index + 1)}
                                    disabled={!canAdvance(index)}
                                />
                            </View>
                        )}
                    </Animated.View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}