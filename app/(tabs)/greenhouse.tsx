import JourneyCard from '@/components/cards/JourneyCard';
import { GREENHOUSE_TOOLS, GreenhouseStats, sortToolsByStage, ToolProgress } from '@/components/GreenhouseData';
import GreenhouseSkeleton from '@/components/skeletons/GreenhouseSkeleton';
import StatsBanner from '@/components/StatsBanner';
import ToolTile from '@/components/TootTile';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GreenhouseScreenProps {
    progressMap?: Record<string, ToolProgress>;
    stats?: GreenhouseStats;
    onOpenTool: (routeKey: string) => void;
}

const DEFAULT_STATS: GreenhouseStats = {
    dayStreak: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    toolsStarted: 0,
    toolsCompleted: 0,
};

export default function GreenhouseScreen({
    progressMap = {},
    stats = DEFAULT_STATS,
}: GreenhouseScreenProps) {
    const sortedTools = useMemo(
        () => sortToolsByStage(GREENHOUSE_TOOLS, progressMap),
        [progressMap]
    );

    const [activeToolId, setActiveToolId] = useState<string | null>(null);
    const activeTool = useMemo(() => {
        return GREENHOUSE_TOOLS.find(t => t.id === activeToolId);
    }, [activeToolId]);
    const ActiveComponent = activeTool?.component;

    if (!progressMap || !stats) return <GreenhouseSkeleton />;

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="px-6 pt-14">
                    {/* Header */}
                    <Animated.View entering={FadeInDown.duration(700).delay(80)} className="mb-6">
                        <View className="flex-row items-center gap-2.5 mb-2">
                            <View className="w-9 h-9 rounded-full items-center justify-center bg-dark">
                                <Feather name="sun" size={15} color="#F7CE46" />
                            </View>
                            <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40">
                                The Greenhouse
                            </Text>
                        </View>
                        <Text className="text-[26px] font-elms-bold italic text-dark leading-tight">
                            Everything you can grow
                        </Text>
                    </Animated.View>

                    {/* Stats banner */}
                    <Animated.View entering={FadeInDown.duration(700).delay(160)} className="mb-7">
                        <StatsBanner stats={stats} />
                    </Animated.View>

                    {/* Journey — featured */}
                    <Animated.View entering={FadeInDown.duration(700).delay(240)}>
                        <JourneyCard
                            toolsCompleted={stats.toolsCompleted}
                            onPress={() => { }}
                        />
                    </Animated.View>

                    {/* Tool grid — sprout, then seed, then bloom */}
                    <Animated.View entering={FadeInDown.duration(700).delay(320)}>
                        <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40 mb-4">
                            Nine tools to grow with
                        </Text>
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {sortedTools.map(({ tool, stage }) => (
                                <ToolTile
                                    key={tool.id}
                                    tool={tool}
                                    stage={stage}
                                    onPress={() => setActiveToolId(tool.id)}
                                />
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>

            {ActiveComponent && (
                <ActiveComponent onClose={() => setActiveToolId(null)} />
            )}
        </View>
    );
}