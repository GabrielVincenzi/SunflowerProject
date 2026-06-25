import { CHART_PALETTES, CHART_REGISTRY } from '@/constants/charts';
import { THEME_COLORS } from '@/constants/utilities';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ─── Topic pill color rotation ──────────────────────────────────────────────
const TOPIC_PALETTE: { bg: string; text: string }[] = CHART_PALETTES.ink.colors
    .slice(2, 6) // mid-light tones only — skip the near-black/near-yellow extremes
    .map((c) => ({ bg: `${c}33`, text: '#1A1A18' }));

function getTopicStyle(category?: string) {
    if (!category) return TOPIC_PALETTE[1]; // neutral default
    const hash = category
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TOPIC_PALETTE[hash % TOPIC_PALETTE.length];
}

function getChartIcon(chartType?: string): keyof typeof Feather.glyphMap {
    if (!chartType) return 'activity';
    return (CHART_REGISTRY[chartType as keyof typeof CHART_REGISTRY]?.icon ??
        'activity') as keyof typeof Feather.glyphMap;
}

const SunCard = ({
    id,
    chart_id,
    title,
    description,
    db_name,
    vars,
    variableLabels,
    chart_type,
    category,
    featured = false,
}: CardProps) => {
    const topicStyle = getTopicStyle(category);
    const chartIcon = getChartIcon(chart_type);

    return (
        <View className="relative w-full mb-4">
            <View
                className="absolute inset-0 bg-dark rounded-[32px]"
                style={{ transform: [{ translateX: featured ? 6 : 4 }, { translateY: featured ? 6 : 4 }] }}
            />

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() =>
                    router.push({
                        pathname: "/infos/[id]",
                        params: {
                            id,
                            chart_id,
                            title,
                            description,
                            db: db_name,
                            chart_type,
                            variables: vars,
                            variableLabels: JSON.stringify(variableLabels ?? {}),
                        },
                    })
                }
                className={`w-full bg-white rounded-[32px] overflow-hidden p-5 border ${featured ? "border-[1.5px] border-dark" : "border-dark/10"
                    }`}
            >
                {/* ── Sunflower glow — featured cards only ──────────────────
                    A soft radial "sun" emerging from the top-right corner,
                    rendered behind the content. This is where the app spends
                    its reserved primary-yellow budget: on the single most
                    important card in a list, not as ambient decoration. */}
                {featured && (
                    <>
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                top: -36,
                                right: -36,
                                width: 130,
                                height: 130,
                                borderRadius: 65,
                                backgroundColor: '#F7CE46',
                                opacity: 0.16,
                            }}
                        />
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                top: -14,
                                right: -10,
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: '#F7CE46',
                                opacity: 0.22,
                            }}
                        />
                    </>
                )}

                {/* Left accent strip */}
                <View className="absolute left-0 top-[16%] bottom-[16%] w-[4px] bg-primary" />

                {/* 1. Header row: topic pill (left) + chart-type icon (right) */}
                <View className="flex-row justify-between items-center mb-3">
                    <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: featured ? '#FFFFFF' : topicStyle.bg }}
                    >
                        <Text
                            className="text-[11px] font-elms-bold"
                            style={{ color: featured ? 'text-dark' : topicStyle.text }}
                        >
                            {category || db_name || 'General'}
                        </Text>
                    </View>
                    <Feather name={chartIcon} size={14} color={featured ? '#1A1A18' : '#A6A398'} />
                </View>

                {/* 2. Headline */}
                <Text
                    className="text-lg font-elms-bold italic text-dark tracking-tight leading-snug mb-2"
                    numberOfLines={2}
                >
                    {title}
                </Text>

                {/* 3. Description */}
                <Text
                    className="text-[13px] font-elms-regular text-dark/55 leading-relaxed mb-4"
                    numberOfLines={2}
                >
                    {description || "No description available for this chart yet."}
                </Text>

                {/* 4. Footer action — arrow carries the affordance now, not a
                    text instruction. A quiet label stays for accessibility/
                    clarity but is visually secondary to the icon. */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-elms-regular text-dark/35">
                        {featured ? "Today's pick" : "Tap to explore"}
                    </Text>
                    <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: featured ? THEME_COLORS.primary : THEME_COLORS.dark }}
                    >
                        <Feather
                            name="arrow-right"
                            size={14}
                            color={featured ? THEME_COLORS.dark : THEME_COLORS.primary}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default SunCard;