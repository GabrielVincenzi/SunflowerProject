/**
 * SearchSkeleton.tsx
 *
 * Shimmer skeleton matching the SearchScreen layout:
 *   header label → title → mode switch tabs → search bar →
 *   section eyebrow → chart card list (with category grid interrupt after 3)
 *
 * Usage:
 *   const { data: translated } = useTranslations();
 *   if (!translated) return <SearchSkeleton />;
 */

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

// ─── Shared shimmer primitive (same as HomeSkeleton) ──────────────────────────

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

/** Mode switch — two pill tabs */
function ModeSwitchSkeleton() {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 12,
                backgroundColor: "#EDE8DE",
                borderRadius: 24,
                padding: 4,
            }}
        >
            <ShimmerBox width="50%" height={32} borderRadius={20} />
            <ShimmerBox width="48%" height={32} borderRadius={20} />
        </View>
    );
}

/** Search bar + filter button row */
function SearchBarSkeleton() {
    return (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <ShimmerBox height={44} borderRadius={22} style={{ flex: 1 }} />
            {/* Filter icon button */}
            <ShimmerBox width={44} height={44} borderRadius={22} />
        </View>
    );
}

/** Single chart card row (icon thumb + two text lines + tag) */
function ChartCardSkeleton() {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: "#EDE8DE",
                borderRadius: 24,
                marginBottom: 12,
            }}
        >
            {/* Thumbnail */}
            <ShimmerBox width={56} height={56} borderRadius={16} />
            {/* Text block */}
            <View style={{ flex: 1, gap: 8 }}>
                <ShimmerBox height={13} borderRadius={7} />
                <ShimmerBox width="70%" height={11} borderRadius={6} />
                {/* Tag chip */}
                <ShimmerBox width={64} height={20} borderRadius={10} />
            </View>
        </View>
    );
}

/** Category grid interrupt — 2 rows × 3 chips + "See all" */
function CategoryGridSkeleton() {
    return (
        <View style={{ marginBottom: 20 }}>
            {/* Grid label */}
            <ShimmerBox width={100} height={10} borderRadius={6} style={{ marginBottom: 14 }} />
            {/* Row 1 */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                {[90, 70, 100].map((w, i) => (
                    <ShimmerBox key={i} width={w} height={36} borderRadius={18} />
                ))}
            </View>
            {/* Row 2 */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                {[80, 110, 60].map((w, i) => (
                    <ShimmerBox key={i} width={w} height={36} borderRadius={18} />
                ))}
            </View>
            {/* "See all topics" link */}
            <ShimmerBox width={110} height={10} borderRadius={6} style={{ marginTop: 4 }} />
        </View>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SearchSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
            >
                {/* ── Header ───────────────────────────────────────────── */}
                <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
                    {/* Eyebrow */}
                    <ShimmerBox width={110} height={10} borderRadius={6} style={{ marginBottom: 8 }} />
                    {/* Title */}
                    <ShimmerBox width={200} height={24} borderRadius={8} style={{ marginBottom: 16 }} />

                    {/* Mode switch tabs */}
                    <ModeSwitchSkeleton />

                    {/* Search bar */}
                    <SearchBarSkeleton />

                    {/* Section eyebrow ("Recommended for you") */}
                    <ShimmerBox width={150} height={10} borderRadius={6} style={{ marginBottom: 14 }} />
                </View>

                {/* ── Chart cards 1-3 ─────────────────────────────────── */}
                <View style={{ paddingHorizontal: 24 }}>
                    <ChartCardSkeleton />
                    <ChartCardSkeleton />
                    <ChartCardSkeleton />
                </View>

                {/* ── Category grid interrupt (after index 3) ──────────── */}
                <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
                    <CategoryGridSkeleton />
                </View>

                {/* ── Remaining chart cards ────────────────────────────── */}
                <View style={{ paddingHorizontal: 24 }}>
                    <ChartCardSkeleton />
                    <ChartCardSkeleton />
                </View>
            </ScrollView>
        </View>
    );
}