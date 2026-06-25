
import { CHART_PALETTES, CHART_REGISTRY } from '@/constants/charts';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ─── Chart icon lookup ────────────────────────────────────────────────────
function getChartIcon(chartType?: string): keyof typeof Feather.glyphMap {
    if (!chartType) return 'activity';
    return (CHART_REGISTRY[chartType as keyof typeof CHART_REGISTRY]?.icon ??
        'activity') as keyof typeof Feather.glyphMap;
}

// ─── Topic pill palette ───────────────────────────────────────────────────
const TOPIC_PALETTE: { bg: string; text: string }[] = CHART_PALETTES.ink.colors
    .slice(2, 6) // mid-light tones only — skip the near-black/near-yellow extremes
    .map((c) => ({ bg: `${c}33`, text: '#1A1A18' }));

function getTopicStyle(category?: string) {
    if (!category) return TOPIC_PALETTE[1];
    const hash = category
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TOPIC_PALETTE[hash % TOPIC_PALETTE.length];
}

const SunSavedCard = ({
    data: { id, chart_id, title, description, db_name, vars, chart_type, category },
    savedAt,
}: SavedCardProps) => {
    const topicStyle = getTopicStyle(category);
    const chartIcon = getChartIcon(chart_type);

    const formattedDate = savedAt
        ? new Date(savedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Recently saved';

    return (
        <View className="relative w-full mb-4">
            {/* Shadow layer — same lighter offset as SunCard */}
            <View
                className="absolute inset-0 bg-dark rounded-[32px]"
                style={{ transform: [{ translateX: 4 }, { translateY: 4 }] }}
            />

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                    router.push({
                        pathname: "/infos/[id]",
                        params: { id, chart_id, title, description, db: db_name, chart_type, variables: vars },
                    })
                }
                className="w-full bg-white rounded-[32px] border border-dark/10 overflow-hidden p-5"
            >
                {/* 1. Header row: topic pill (left) + chart-type icon (right) —
                    identical pattern to SunCard, the "SAVED" state no longer
                    needs its own pill since this entire screen is the saved list */}
                <View className="flex-row justify-between items-center mb-3">
                    <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: topicStyle.bg }}
                    >
                        <Text
                            className="text-[11px] font-elms-bold"
                            style={{ color: topicStyle.text }}
                        >
                            {category || db_name || 'General'}
                        </Text>
                    </View>
                    <Feather name={chartIcon} size={14} color="#A6A398" />
                </View>

                {/* 2. Headline + description */}
                <Text
                    className="text-lg font-elms-bold italic text-dark tracking-tight leading-snug mb-2"
                    numberOfLines={2}
                >
                    {title}
                </Text>
                <Text
                    className="text-[13px] font-elms-regular text-dark/55 leading-relaxed mb-4"
                    numberOfLines={2}
                >
                    {description || "No description available for this saved chart yet."}
                </Text>

                {/* 3. Footer — review action (left) + saved date (right), replacing
                    the pulsing-dot "Review Signal" with the same quiet dot pattern
                    used elsewhere, plus the date kept exactly where it was useful */}
                <View className="flex-row items-center justify-between pt-3 border-t border-dark/5">
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-[7px] h-[7px] rounded-full bg-primary" />
                        <Text className="text-[11px] font-elms-bold text-dark/60 uppercase tracking-[0.05em]">
                            Open chart
                        </Text>
                    </View>
                    <Text className="text-[11px] font-elms-regular text-dark/35">
                        Saved {formattedDate}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default SunSavedCard;