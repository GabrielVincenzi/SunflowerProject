import React, { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";

// ─── Shimmer primitive ────────────────────────────────────────────────────────
//
// Renders a rounded rectangle that pulses between two opacities, giving the
// classic "breathing" skeleton feel Instagram uses.
//
interface ShimmerBoxProps {
    width?: string | number;   // e.g. "100%" | 160
    height?: number;
    borderRadius?: number;
    className?: string;
    style?: object;
}

function ShimmerBox({
    width = "100%",
    height = 16,
    borderRadius = 10,
    className = "",
    style = {},
}: ShimmerBoxProps) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,   // infinite
            false // don't reverse — sequence already handles both directions
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: "#E5E0D5", // matches your "cream" palette
                },
                animStyle,
                style,
            ]}
            className={className}
        />
    );
}

// ─── Block helpers ────────────────────────────────────────────────────────────

/** Thin label line (section eyebrow like "Today's light") */
function EyebrowSkeleton() {
    return <ShimmerBox width={90} height={10} borderRadius={6} style={{ marginBottom: 12 }} />;
}

/** A rounded card shell */
function CardShell({
    height,
    borderRadius = 36,
    style = {},
}: {
    height: number;
    borderRadius?: number;
    style?: object;
}) {
    return (
        <View
            style={[
                {
                    borderRadius,
                    overflow: "hidden",
                    backgroundColor: "#EDE8DE",
                    height,
                },
                style,
            ]}
        >
            {/* Single shimmer that fills the card */}
            <ShimmerBox width="100%" height={height} borderRadius={0} />
        </View>
    );
}

/** Two side-by-side mini cards */
function MiniCardRowSkeleton() {
    return (
        <View style={{ flexDirection: "row", gap: 20 }}>
            <CardShell height={120} borderRadius={28} style={{ flex: 1 }} />
            <CardShell height={120} borderRadius={28} style={{ flex: 1 }} />
        </View>
    );
}

/** Category chip strip */
function CategoryRowSkeleton() {
    return (
        <View style={{ flexDirection: "row", gap: 12 }}>
            {[80, 110, 70, 95, 60].map((w, i) => (
                <ShimmerBox key={i} width={w} height={34} borderRadius={20} />
            ))}
        </View>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomeSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: "#FAF7F2" /* bg-background */ }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24, paddingTop: 56 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} // skeleton shouldn't be interactive
            >
                {/* ── 1. Header ──────────────────────────────────────────── */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                    <View style={{ gap: 8 }}>
                        <ShimmerBox width={120} height={13} borderRadius={7} />
                        <ShimmerBox width={180} height={22} borderRadius={8} />
                    </View>
                    {/* Avatar placeholder */}
                    <ShimmerBox width={42} height={42} borderRadius={21} />
                </View>

                {/* ── 2. Question card ───────────────────────────────────── */}
                <View style={{ marginBottom: 20 }}>
                    <CardShell height={130} />
                    {/* Streak pips row */}
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 10, paddingHorizontal: 4 }}>
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <ShimmerBox key={i} width={22} height={8} borderRadius={4} />
                        ))}
                    </View>
                </View>

                {/* ── 3. Today's light (featured dark card) ─────────────── */}
                <View style={{ marginBottom: 48 }}>
                    <EyebrowSkeleton />
                    {/* Shadow offset shell */}
                    <View style={{ position: "relative" }}>
                        <View
                            style={{
                                position: "absolute",
                                inset: 0,
                                top: 6,
                                left: 6,
                                right: -6, // simulate the translateX(6) shadow
                                bottom: -6,
                                borderRadius: 36,
                                backgroundColor: "#C8C2B8",
                            }}
                        />
                        <CardShell height={170} />
                    </View>
                </View>

                {/* ── 4. Growing now ─────────────────────────────────────── */}
                <View style={{ marginBottom: 40 }}>
                    <EyebrowSkeleton />
                    <MiniCardRowSkeleton />
                </View>

                {/* ── 5. From the greenhouse ─────────────────────────────── */}
                <View style={{ marginBottom: 56 }}>
                    <EyebrowSkeleton />
                    <MiniCardRowSkeleton />
                </View>

                {/* ── 6. By category ─────────────────────────────────────── */}
                <View>
                    <ShimmerBox width={160} height={28} borderRadius={10} style={{ marginBottom: 24 }} />
                    <CategoryRowSkeleton />
                    {/* Category content cards */}
                    <View style={{ gap: 16, marginTop: 20 }}>
                        <CardShell height={90} borderRadius={24} />
                        <CardShell height={90} borderRadius={24} />
                        <CardShell height={90} borderRadius={24} />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}