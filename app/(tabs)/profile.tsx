import { translationStorage } from "@/interfaces/translationStorage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────────────
// Mirrors the shape used by the Greenhouse screen, so both screens can be
// fed from the same progress/stats data source without adapting anything.

type GrowthStage = 'seed' | 'sprout' | 'bloom';

interface ToolProgress {
    completions: number;
    hasStarted: boolean;
    isMastered: boolean;
}

interface ToolDef {
    id: string;
    title: string;
    icon: keyof typeof Feather.glyphMap;
}

interface GreenhouseStats {
    dayStreak: number;
    totalAnswers: number;
    correctAnswers: number;
    toolsStarted: number;
    toolsCompleted: number;
}

interface ProfileScreenProps {
    progressMap?: Record<string, ToolProgress>;
    stats?: GreenhouseStats;
}

// ─── The 9 Greenhouse tools — same registry as the Greenhouse screen ───────
// Kept local to this file per request; if you already export GREENHOUSE_TOOLS
// elsewhere, swap this constant for that import and nothing else here needs
// to change, since only `id`, `title`, and `icon` are used.

const TOOLS: ToolDef[] = [
    { id: 'manipulators-studio', title: "Manipulator's Studio", icon: 'edit-3' },
    { id: 'time-machine', title: 'The Time Machine', icon: 'clock' },
    { id: 'sample-thief', title: 'The Sample Thief', icon: 'crop' },
    { id: 'headline-factory', title: 'The Headline Factory', icon: 'file-text' },
    { id: 'forecaster', title: 'The Forecaster', icon: 'target' },
    { id: 'translator', title: 'The Translator', icon: 'repeat' },
    { id: 'devils-advocate', title: "Devil's Advocate", icon: 'message-square' },
    { id: 'consensus-map', title: 'The Consensus Map', icon: 'compass' },
    { id: 'replication-game', title: 'The Replication Game', icon: 'refresh-cw' },
];

const DEFAULT_STATS: GreenhouseStats = {
    dayStreak: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    toolsStarted: 0,
    toolsCompleted: 0,
};

function getGrowthStage(progress: ToolProgress | undefined): GrowthStage {
    if (!progress || !progress.hasStarted) return 'seed';
    if (progress.isMastered) return 'bloom';
    return 'sprout';
}

const STAGE_VISUALS: Record<GrowthStage, { bg: string; tint: string }> = {
    seed: { bg: '#F0ECE0', tint: '#A6A398' },
    sprout: { bg: '#E3EFE6', tint: '#3D6B4A' },
    bloom: { bg: '#FCEFC4', tint: '#B8941F' },
};

// Orbital physics per stage — distance and speed both driven by growth
// stage. This IS the metaphor, not decoration on top of one: bloomed
// tools have been pulled into a tight, fast orbit close to the light;
// seeds drift in a slow, distant ring, not yet drawn in.
const STAGE_ORBIT: Record<GrowthStage, { radiusFactor: number; periodMs: number }> = {
    seed: { radiusFactor: 1.75, periodMs: 42000 },
    sprout: { radiusFactor: 1.22, periodMs: 28000 },
    bloom: { radiusFactor: 0.95, periodMs: 16000 },
};

const STAGE_SORT_ORDER: Record<GrowthStage, number> = { sprout: 0, seed: 1, bloom: 2 };

function accuracyRatio(stats: GreenhouseStats): number {
    if (stats.totalAnswers === 0) return 0;
    return Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
}

// ─── Sizing constants for the orbital field ────────────────────────────────

const CENTER_SIZE = 124;
const FIELD_SIZE = 320;

// ─── Sub-component: a single orbiting tool body ────────────────────────────
// Kept inline (not a separate file) per request, but still its own small
// function so the per-body animation hook setup stays readable.

function OrbitingTool({
    stage,
    index,
    totalCount,
}: {
    stage: GrowthStage;
    index: number;
    totalCount: number;
}) {
    const visuals = STAGE_VISUALS[stage];
    const orbit = STAGE_ORBIT[stage];
    const radius = (CENTER_SIZE / 2) * (orbit.radiusFactor + (Math.random() * 0.4) - 0.2) + 36;

    const startAngle = (index / totalCount) * 360;
    const angle = useSharedValue(startAngle);

    useEffect(() => {
        // Slight per-body jitter so same-stage bodies don't move in
        // perfect lockstep — keeps the field feeling organic.
        const jitter = 1 + ((index % 5) - 2) * 0.04;
        angle.value = withRepeat(
            withTiming(startAngle + 360, {
                duration: orbit.periodMs * jitter,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [stage]);

    const animatedStyle = useAnimatedStyle(() => {
        const rad = (angle.value * Math.PI) / 180;
        return {
            transform: [
                { translateX: radius * Math.cos(rad) },
                { translateY: radius * Math.sin(rad) },
            ],
        };
    });

    const bodySize = stage === 'bloom' ? 30 : stage === 'sprout' ? 26 : 20;

    return (
        <Animated.View
            style={[
                { position: 'absolute', left: '50%', top: '50%', marginLeft: -bodySize / 2, marginTop: -bodySize / 2 },
                animatedStyle,
            ]}
        >
            <View
                style={{
                    width: bodySize,
                    height: bodySize,
                    borderRadius: bodySize / 2,
                    backgroundColor: visuals.bg,
                    borderWidth: 1.5,
                    borderColor: visuals.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: stage === 'bloom' ? '#F7CE46' : 'transparent',
                    shadowOpacity: stage === 'bloom' ? 0.6 : 0,
                    shadowRadius: 6,
                }}
            >
                <View
                    style={{
                        width: bodySize * 0.36,
                        height: bodySize * 0.36,
                        borderRadius: bodySize * 0.18,
                        backgroundColor: visuals.tint,
                    }}
                />
            </View>
        </Animated.View>
    );
}

// ─── Sub-component: faint rotating dashed ring (atmosphere only) ───────────

function OrbitRing({ size }: { size: number }) {
    const rotate = useSharedValue(0);
    useEffect(() => {
        rotate.value = withRepeat(
            withTiming(360, { duration: 90000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: '#1A1A18',
                    opacity: 0.08,
                },
                style,
            ]}
        />
    );
}

// ─── Sub-component: a single row in the stats reveal panel ─────────────────

function StatRow({
    icon,
    label,
    value,
}: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View className="flex-row items-center justify-between py-3 border-b border-dark/[0.06]">
            <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-[#F0ECE0]">
                    <Feather name={icon} size={13} color="#5F5E5A" />
                </View>
                <Text className="text-[13px] font-elms-bold text-dark/70">{label}</Text>
            </View>
            <Text className="text-[15px] font-elms-bold italic text-dark">{value}</Text>
        </View>
    );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function ProfileScreen({
    progressMap = {},
    stats = DEFAULT_STATS,
}: ProfileScreenProps) {
    const { signOut } = useAuth();
    const { user } = useUser();
    const [statsRevealed, setStatsRevealed] = useState(false);

    const displayName =
        user?.firstName ?? user?.username ?? user?.emailAddresses?.[0]?.emailAddress ?? "Friend";

    const sortedTools = useMemo(() => {
        return TOOLS
            .map((tool) => ({ tool, stage: getGrowthStage(progressMap[tool.id]) }))
            .sort((a, b) => STAGE_SORT_ORDER[a.stage] - STAGE_SORT_ORDER[b.stage]);
    }, [progressMap]);

    const ratio = accuracyRatio(stats);

    const handleClearLanguage = async () => {
        await AsyncStorage.removeItem("language");
        await translationStorage.clear("en");
        await translationStorage.clear("it");
        router.replace("/(preauth)/lang");
    };

    return (
        <View className="flex-1 bg-background">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="px-6 pt-14">
                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(80)} className="mb-2">
                        <View className="flex-row items-center gap-2.5 mb-2">
                            <View className="w-9 h-9 rounded-full items-center justify-center bg-dark">
                                <Feather name="sun" size={15} color="#F7CE46" />
                            </View>
                            <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40">
                                Your light
                            </Text>
                        </View>
                        <Text className="text-[26px] font-elms-bold italic text-dark leading-tight">
                            {displayName}
                        </Text>
                    </Animated.View>

                    {/* ── The Sun System ─────────────────────────────────────
                        Avatar at the center (the sun), 9 tool bodies in orbit
                        — distance + speed driven by each tool's growth stage.
                        Tap the avatar to flip it to the streak number and
                        reveal the stats panel below. */}
                    <Animated.View entering={FadeInDown.delay(200)} className="items-center mt-4 mb-2">
                        <View style={{ width: FIELD_SIZE, height: FIELD_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                            <OrbitRing size={FIELD_SIZE * 0.95} />
                            <OrbitRing size={FIELD_SIZE * 0.7} />

                            {sortedTools.map(({ stage }, i) => (
                                <OrbitingTool
                                    key={TOOLS[i]?.id ?? i}
                                    stage={stage}
                                    index={i}
                                    totalCount={sortedTools.length}
                                />
                            ))}

                            <View className="relative">
                                <View
                                    className="absolute inset-0 bg-dark rounded-[40px]"
                                    style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                                />
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setStatsRevealed((v) => !v)}
                                    style={{ width: CENTER_SIZE, height: CENTER_SIZE }}
                                    className="rounded-[40px] border-[3px] border-dark bg-primary items-center justify-center overflow-hidden"
                                >
                                    <View
                                        pointerEvents="none"
                                        style={{
                                            position: 'absolute', top: -20, left: -20,
                                            width: CENTER_SIZE * 0.8, height: CENTER_SIZE * 0.8,
                                            borderRadius: CENTER_SIZE * 0.4, backgroundColor: '#FFFFFF', opacity: 0.25,
                                        }}
                                    />
                                    {!statsRevealed ? (
                                        <Feather name="user" size={42} color="#1A1A18" />
                                    ) : (
                                        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} className="items-center">
                                            <Feather name="zap" size={20} color="#1A1A18" />
                                            <Text className="text-2xl font-elms-bold italic text-dark mt-1">{stats.dayStreak}</Text>
                                            <Text className="text-[8px] font-elms-bold text-dark/60 uppercase tracking-[0.1em]">day streak</Text>
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View className="absolute -bottom-2">
                                <Text className="text-[9px] font-elms-bold text-dark/30 uppercase tracking-[0.12em]">
                                    {statsRevealed ? 'Tap to see yourself' : 'Tap to see your growth'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Stats reveal panel */}
                    {statsRevealed && (
                        <Animated.View entering={FadeInDown.duration(300)} className="w-full mt-10">
                            <View className="relative w-full">
                                <View
                                    className="absolute inset-0 bg-dark rounded-[32px]"
                                    style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                                />
                                <View className="bg-white border border-dark/10 rounded-[32px] p-6">
                                    <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/35 mb-1">
                                        Your growth so far
                                    </Text>
                                    <Text className="text-[18px] font-elms-bold italic text-dark mb-3 leading-snug">
                                        {stats.toolsCompleted === 0
                                            ? "Every flower starts as a seed."
                                            : `${stats.toolsCompleted} of 9 tools in full bloom.`}
                                    </Text>

                                    <StatRow icon="zap" label="Day streak" value={String(stats.dayStreak)} />
                                    <StatRow icon="check-circle" label="Accuracy" value={`${ratio}%`} />
                                    <StatRow icon="edit-3" label="Questions answered" value={String(stats.totalAnswers)} />
                                    <StatRow icon="sun" label="Tools started" value={`${stats.toolsStarted}/9`} />
                                </View>
                            </View>
                        </Animated.View>
                    )}

                    {/* Options list */}
                    <Animated.View entering={FadeInDown.delay(320)} className="mt-12">
                        <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40 mb-4">
                            Settings
                        </Text>

                        {[
                            { icon: 'settings' as const, label: 'Preferences' },
                            { icon: 'shield' as const, label: 'Privacy & data' },
                            { icon: 'help-circle' as const, label: 'How Sunflower works' },
                        ].map((item, idx) => (
                            <View key={idx} className="relative w-full mb-2.5">
                                <View
                                    className="absolute inset-0 bg-dark rounded-[22px]"
                                    style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
                                />
                                <TouchableOpacity
                                    className="flex-row items-center py-4 px-5 bg-white border border-dark/10 rounded-[22px]"
                                    activeOpacity={0.85}
                                >
                                    <View className="w-9 h-9 items-center justify-center rounded-2xl bg-[#F0ECE0]">
                                        <Feather name={item.icon} size={16} color="#5F5E5A" />
                                    </View>
                                    <Text className="text-[14px] font-elms-bold italic text-dark ml-3.5 tracking-tight flex-1">
                                        {item.label}
                                    </Text>
                                    <Feather name="chevron-right" size={16} color="#A6A398" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Sign out — preserved functionally, rethemed visually */}
                        <TouchableOpacity
                            onPress={() => signOut()}
                            activeOpacity={0.85}
                            className="flex-row items-center justify-center py-4 border-[1.5px] border-dark/15 rounded-[24px] mt-8"
                        >
                            <Feather name="log-out" size={15} color="#5F5E5A" style={{ marginRight: 8 }} />
                            <Text className="text-[13px] font-elms-bold text-dark/60 uppercase tracking-[0.1em]">
                                Sign out
                            </Text>
                        </TouchableOpacity>

                        {/* Language change — preserved functionally, rethemed visually */}
                        <TouchableOpacity
                            onPress={handleClearLanguage}
                            activeOpacity={0.85}
                            className="flex-row items-center justify-center py-3.5 mt-3"
                        >
                            <Feather name="globe" size={13} color="#A6A398" style={{ marginRight: 7 }} />
                            <Text className="text-[12px] font-elms-bold text-dark/35 uppercase tracking-[0.08em]">
                                Change language
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}