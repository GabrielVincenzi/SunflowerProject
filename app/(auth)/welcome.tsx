import OptionCard from "@/components/cards/OptionCard";
import SunLineChart from "@/components/charts/SunLineChart";
import BloomDoorTransition, { BloomTransitionRef } from "@/components/design/BloomDoorTransition";
import ProgressBar from "@/components/design/ProgressBar";
import { LogoIcon } from "@/components/icons/Logo";
import AnimatedWords from "@/components/layoutcomp/DelayedWords";
import SunButton from "@/components/SunButton2";
import { THEME_COLORS } from "@/constants/utilities";
import { Feather } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
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
                className="font-sf-bold text-4xl"
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
                className="font-sf-regular text-md"
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
/* Content constants                                                     */
/* ------------------------------------------------------------------ */
// One extra slide inserted between "path" and "reveal": a big-word
// interstitial. Advancing off it is NOT part of the normal swipe track —
// it's triggered by tapping the headline, which plays BloomDoorTransition
// and only then swaps the underlying slide index (see handleWelcomeReveal).
const SLIDES = ["hero", "topics", "path", "welcome", "reveal"] as const;

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

// TODO: swap for your real chart palette source (e.g. CHART_PALETTES[selectedPalette].colors).
const FALLBACK_CHART_PALETTE = [THEME_COLORS.secondary, THEME_COLORS.marked, THEME_COLORS.primary];

const PROGRESS_TARGET: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 95 };

/* ------------------------------------------------------------------ */
/* TODO: mock preview data for the reveal chart.                        */
/* Replace this whole hook with wherever your real per-category         */
/* onboarding preview data actually comes from (endpoint / context /    */
/* existing hook). The shape below is only a guess at what              */
/* SunLineChart expects (activeGeos / activePeriods / series / vars),   */
/* built to match the enrichedApiData pattern you shared.               */
/* ------------------------------------------------------------------ */
function buildMockCategoryData(categoryKey: string) {
    if (!categoryKey) return undefined;
    const months = ["2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"];
    const seed = categoryKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const points = months.map((_, i) => ({ value: Math.round(40 + 30 * Math.sin((i + seed) / 2.4) + i * 2) }));
    return {
        activeGeos: ["World"],
        activePeriods: months,
        variables: [categoryKey],
        series: { [`${categoryKey}_World`]: points },
    };
}

function useCategoryPreviewData(categoryKey: string) {
    return useMemo(() => buildMockCategoryData(categoryKey), [categoryKey]);
}

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

    const [headerHeight, setHeaderHeight] = useState(0);
    const [footerHeight, setFooterHeight] = useState(0);

    // Bloom-door transition: plays on tap of the "welcome" slide's headline.
    // onCovered fires while the wall panels are fully closed (screen hidden),
    // which is the moment we actually swap the carousel to the reveal slide —
    // no crossfade/slide needed underneath since it's covered.
    const bloomRef = useRef<BloomTransitionRef>(null);
    const [isBlooming, setIsBlooming] = useState(false);

    function canAdvance(i: number) {
        if (i === 1) return selectedCategories.length > 0;
        if (i === 2) return selectedPath !== null;
        if (i === 3) return false; // "welcome" only advances via the bloom transition, never swipe
        return true;
    }

    function goTo(i: number) {
        const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
        if (clamped > index && !canAdvance(index)) {
            translateX.value = withTiming(-index * width, { duration: 600, easing: Easing.out(Easing.linear) });
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

    // Tap handler for the "welcome" slide. Plays the bloom door; the actual
    // index swap happens in onCovered below, once the doors have shut.
    function handleWelcomeReveal() {
        if (isBlooming || index !== 3) return;
        setIsBlooming(true);
        bloomRef.current?.play();
    }

    const pan = Gesture.Pan()
        .runOnJS(true)
        .onStart(() => {
            dragStartX.value = translateX.value;
        })
        .onUpdate((e) => {
            if (isBlooming) return;
            const min = -(SLIDES.length - 1) * width;
            const next = dragStartX.value + e.translationX;
            translateX.value = Math.min(0, Math.max(min, next));
        })
        .onEnd((e) => {
            if (isBlooming) return;
            if (e.translationX < -60) goTo(index + 1);
            else if (e.translationX > 60) goTo(index - 1);
            else goTo(index);
        });

    // Fixed number of slides (5), so calling this hook 5x in a row every
    // render is safe — same hook order every time.
    const slideStyles = [
        useParallaxStyle(0, translateX, width),
        useParallaxStyle(1, translateX, width),
        useParallaxStyle(2, translateX, width),
        useParallaxStyle(3, translateX, width),
        useParallaxStyle(4, translateX, width),
    ];

    const trackStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const chromeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, -width * 0.5], [0, 1], Extrapolation.CLAMP),
    }));

    const chartKey = CATEGORIES.map((c) => c.key).find((k) => selectedCategories.includes(k)) || "";
    const chartTitle = CHART_TITLES[chartKey];

    // TODO: replace useCategoryPreviewData with your real data source.
    const apiData = useCategoryPreviewData(chartKey);
    const enrichedApiData = useMemo(() => {
        if (!apiData) return undefined;
        return {
            ...apiData,
            variableLabels: { [chartKey]: chartTitle },
            palette: FALLBACK_CHART_PALETTE,
        };
    }, [apiData, chartKey, chartTitle]);

    const chartElement = useMemo(
        () => <SunLineChart screenWidth={width * 0.9} apiData={enrichedApiData} />,
        [width, enrichedApiData],
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1" style={{ backgroundColor: THEME_COLORS.background }}>
                <View className="flex-1">
                    <GestureDetector gesture={pan}>
                        <View className="flex-1 overflow-hidden">
                            <Animated.View style={[{ flexDirection: "row", width: width * SLIDES.length, flex: 1 }, trackStyle]}>
                                {/* Slide 0 — hero */}
                                <Animated.View style={[{ width }, slideStyles[0]]} className="items-center px-8">
                                    <View className="flex-1" />
                                    <LogoIcon size={200} color={THEME_COLORS.dark} />
                                    <Text className="font-sf-regular text-[15px] mb-10 mt-16" style={{ color: "rgba(52,58,64,0.55)" }}>
                                        Chart the world for free.
                                    </Text>
                                    <View className="w-full items-center gap-3.5 pb-7">
                                        <SunButton label="Get Started" icon={<Feather name="arrow-right" size={15} color={THEME_COLORS.background} />} onPress={() => goTo(1)} />
                                        <Pressable onPress={() => router.replace("(auth)/sign-in)")}>
                                            <Text className="font-sf-regular text-[12.5px] underline" style={{ color: "rgba(52,58,64,0.5)" }}>
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

                                {/* Slide 3 — welcome (interstitial, tap-to-advance) */}
                                <Animated.View style={[{ width, paddingTop: headerHeight, paddingBottom: footerHeight }, slideStyles[3]]}
                                    className="px-6"
                                >
                                    <Headline active={index === 3}>At least we lacked...</Headline>
                                    <Pressable
                                        className="flex-1 items-center justify-center"
                                        onPress={handleWelcomeReveal}
                                        disabled={isBlooming}
                                    >

                                        <AnimatedWords
                                            text="welcome to"
                                            active={index === 3}
                                            baseDelay={600}
                                            stagger={90}
                                            className="font-sf-bold text-3xl"
                                            style={{ lineHeight: 54, color: THEME_COLORS.dark }}
                                        />
                                        <AnimatedWords
                                            text="Sunflower"
                                            active={index === 3}
                                            baseDelay={1200}
                                            stagger={90}
                                            className="font-sf-extrabold text-7xl"
                                            style={{ color: THEME_COLORS.primary }}
                                        />
                                        <Text
                                            className="font-sf-regular text-[12.5px] mt-8"
                                            style={{ color: "rgba(52,58,64,0.4)" }}
                                        >
                                            Tap to continue
                                        </Text>
                                    </Pressable>
                                </Animated.View>

                                {/* Slide 4 — reveal (chart) */}
                                <Animated.View
                                    style={[{ width, paddingTop: headerHeight, paddingBottom: footerHeight }, slideStyles[4]]}
                                    className="px-6"
                                >
                                    <Text className="font-sf-bold italic text-[13.5px] mb-3" style={{ color: THEME_COLORS.secondary }}>
                                        "{chartTitle}"
                                    </Text>
                                    <View className="items-center">
                                        {chartElement}
                                    </View>
                                </Animated.View>
                            </Animated.View>
                        </View>
                    </GestureDetector>

                    {/* Header overlay */}
                    <Animated.View
                        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                        pointerEvents={index > 0 ? "auto" : "none"}
                        style={[
                            { position: "absolute", top: 0, left: 0, right: 0 },
                            chromeOpacity
                        ]}
                        className="px-6 pt-2"
                    >
                        <ProgressBar value={progress} pulse={index === 4 && progress >= 90} />
                        <Pressable
                            onPress={() => goTo(index - 1)}
                            className="flex-row items-center mt-2.5 gap-1"
                        >
                            <Feather name="arrow-left" size={12} color="rgba(52,58,64,0.4)" />
                            <Text
                                className="font-sf-regular text-xs"
                                style={{ color: "rgba(52,58,64,0.4)" }}
                            >
                                Back
                            </Text>
                        </Pressable>
                    </Animated.View>

                    {/* Footer overlay — no "Next" button on the welcome slide (index 3);
                        advancing there only happens via the tap + bloom transition. */}
                    <Animated.View
                        onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                        pointerEvents={index > 0 && index !== 3 ? "auto" : "none"}
                        style={[{ position: "absolute", bottom: 0, left: 0, right: 0 }, chromeOpacity]}
                        className="px-6 pt-3.5 pb-7"
                    >
                        {index === 4 ? (
                            <SunButton
                                label="Next: Open My Dashboard"
                                icon={<Feather name="arrow-right" size={15} color={THEME_COLORS.background} />}
                                onPress={() => router.replace("/(auth)/sign-in")}
                            />
                        ) : index === 3 ? null : (
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

                    {/* Bloom door transition overlay — rendered last so it stacks above
                        everything else. It's a no-op (returns null) while idle. */}
                    <BloomDoorTransition
                        ref={bloomRef}
                        onCovered={() => {
                            setIndex(4);
                            translateX.value = -4 * width; // instant snap — hidden behind the closed doors
                            setProgress(PROGRESS_TARGET[4] ?? 95);
                        }}
                        onFinished={() => setIsBlooming(false)}
                    />
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}