import React, { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

// ─── Shared shimmer primitive ─────────────────────────────────────────────────

function ShimmerBox({
    width = "100%" as string | number,
    height = 16,
    borderRadius = 10,
    style = {} as object,
}) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor: "#E5E0D5" },
                animStyle,
                style,
            ]}
        />
    );
}

// ─── Sub-blocks ───────────────────────────────────────────────────────────────

/**
 * Stats banner — four equal cells in a row (streak / answers / correct / tools)
 * Matches StatsBanner's horizontal layout.
 */
function StatsBannerSkeleton() {
    return (
        <View
            style={{
                flexDirection: "row",
                backgroundColor: "#EDE8DE",
                borderRadius: 24,
                padding: 16,
                gap: 8,
                marginBottom: 28,
            }}
        >
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                    {/* Big number */}
                    <ShimmerBox width={28} height={22} borderRadius={6} />
                    {/* Label */}
                    <ShimmerBox width="80%" height={9} borderRadius={5} />
                </View>
            ))}
        </View>
    );
}

/**
 * Journey card — the featured tall card with progress bar and CTA.
 * Matches JourneyCard's dark background with offset shadow.
 */
function JourneyCardSkeleton() {
    return (
        <View style={{ marginBottom: 28, position: "relative" }}>
            {/* Offset shadow */}
            <View
                style={{
                    position: "absolute",
                    top: 6, left: 6, right: -6, bottom: -6,
                    borderRadius: 32,
                    backgroundColor: "#C8C2B8",
                }}
            />
            <View
                style={{
                    borderRadius: 32,
                    backgroundColor: "#EDE8DE",
                    padding: 24,
                    gap: 14,
                    overflow: "hidden",
                }}
            >
                {/* Tag chip */}
                <ShimmerBox width={80} height={18} borderRadius={9} />
                {/* Title line 1 */}
                <ShimmerBox height={22} borderRadius={8} />
                {/* Title line 2 (shorter) */}
                <ShimmerBox width="65%" height={22} borderRadius={8} />
                {/* Progress track */}
                <View style={{ marginTop: 6 }}>
                    <View
                        style={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#D8D2C6",
                            overflow: "hidden",
                        }}
                    >
                        <ShimmerBox width="35%" height={6} borderRadius={3} />
                    </View>
                    {/* "X / 9 completed" label */}
                    <ShimmerBox width={90} height={9} borderRadius={5} style={{ marginTop: 8 }} />
                </View>
                {/* CTA button */}
                <ShimmerBox width={130} height={36} borderRadius={18} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
}

/**
 * Single tool tile — square card with icon area + label.
 * GreenhouseScreen uses a flex-wrap two-column layout (justify-between).
 */
function ToolTileSkeleton() {
    return (
        <View
            style={{
                width: "47%",
                backgroundColor: "#EDE8DE",
                borderRadius: 24,
                padding: 16,
                gap: 12,
                marginBottom: 4, // gap-y-4 is handled by parent gap
            }}
        >
            {/* Icon circle */}
            <ShimmerBox width={40} height={40} borderRadius={20} />
            {/* Tool name */}
            <ShimmerBox width="80%" height={13} borderRadius={6} />
            {/* Stage badge */}
            <ShimmerBox width={52} height={18} borderRadius={9} />
        </View>
    );
}

/** 9-tool grid — 3 rows × 2 cols (+ 1 leftover, centered) */
function ToolGridSkeleton() {
    return (
        <View>
            {/* Section eyebrow */}
            <ShimmerBox width={160} height={10} borderRadius={6} style={{ marginBottom: 16 }} />
            {/* Wrap grid — matches flex-row flex-wrap justify-between gap-y-4 */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 16 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                    <ToolTileSkeleton key={i} />
                ))}
            </View>
        </View>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function GreenhouseSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
            >
                <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
                    {/* ── Header ───────────────────────────────────────── */}
                    <View style={{ marginBottom: 24 }}>
                        {/* Icon pill + eyebrow row */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <ShimmerBox width={36} height={36} borderRadius={18} />
                            <ShimmerBox width={120} height={10} borderRadius={6} />
                        </View>
                        {/* Title */}
                        <ShimmerBox width={220} height={26} borderRadius={9} />
                    </View>

                    {/* ── Stats banner ─────────────────────────────────── */}
                    <StatsBannerSkeleton />

                    {/* ── Journey card ─────────────────────────────────── */}
                    <JourneyCardSkeleton />

                    {/* ── Tool grid ────────────────────────────────────── */}
                    <ToolGridSkeleton />
                </View>
            </ScrollView>
        </View>
    );
}