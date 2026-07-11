import { animationDuration, CHART_COLORS, margin, THEME_COLORS } from "@/constants/utilities";
import { hierarchy, pack } from "d3-hierarchy";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, CircleProps, G, Text as SvgText } from "react-native-svg";
import ChartLegend from "../chartscomp/ChartLegend";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// ─── Animated bubble + label ──────────────────────────────────
// Structure unchanged: circle grows in, label fades in over the
// last 30% of that growth. Only the fill/stroke/text styling below
// has been retouched to match the rest of the chart family.
function AnimatedBubble({
    cx, cy, r, fill, showLabel, labelValue
}: {
    cx: number;
    cy: number;
    r: number;
    fill: string;
    showLabel: boolean;
    labelValue: string;
}) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }, [r]);

    const animatedCircleProps = useAnimatedProps<CircleProps>(() => ({
        r: r * progress.value,
    }));

    const animatedTextGroupProps = useAnimatedProps(() => ({
        opacity: Math.max(0, (progress.value - 0.7) / 0.3),
    }));

    return (
        <G transform={`translate(${cx}, ${cy})`}>
            <AnimatedCircle cx={0} cy={0} fill={fill}
                animatedProps={animatedCircleProps} />
            {showLabel && (
                <AnimatedG animatedProps={animatedTextGroupProps}>
                    <SvgText
                        x={0}
                        y={0}
                        dy="0.35em"
                        textAnchor="middle"
                        fontSize={11}
                        fontStyle="italic"
                        fill={THEME_COLORS.background}
                    >
                        {labelValue}
                    </SvgText>
                </AnimatedG>
            )}
        </G>
    );
}

// ─── Component ────────────────────────────────────────────────
// Pack-layout logic and node computation unchanged — only the
// container styling and prop names have been aligned to the
// shared SunChartProps contract.
function SunPackedCircleChart({
    screenWidth,
    apiData,
    xTickCount,
    yTickCount,
    height = 280,
    yDomainOverride, // no axis here — accepted and silently ignored, per contract
}: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const width = screenWidth;

    const leaves = useMemo(() => {
        const variables = Array.from(
            new Set(Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))
        );
        const activeGeos = apiData.activeGeos || [];
        const lastPeriodIndex = (apiData.activePeriods || []).length - 1;
        const result: { id: string; label: string; value: number; color: string }[] = [];
        let ci = 0;

        activeGeos.forEach((geo) => {
            variables.forEach((v) => {
                const key = `${v}_${geo}`;
                const val = apiData.series[key]?.[lastPeriodIndex]?.value ?? 0;
                result.push({
                    id: key,
                    label: activeGeos.length > 1 ? `${apiData.variableLabels?.[v] ?? v} (${geo})` : (apiData.variableLabels?.[v] ?? v),
                    value: Math.abs(val),
                    color: palette[ci++ % palette.length],
                });
            });
        });
        return result.filter((d) => d.value > 0);
    }, [apiData, palette]);

    const legendItems = useMemo<LegendItem[]>(
        () => leaves.map(({ label, color }) => ({ label, color })),
        [leaves]
    );

    const packedNodes = useMemo(() => {
        const root = hierarchy({ children: leaves } as any).sum((d: any) => d.value);
        pack<any>().size([width - margin.left - margin.right, height]).padding(4)(root);
        return root.leaves() as any[];
    }, [leaves, width, height]);

    return (
        // No card, no border, no radius, no background of its own.
        <View className="w-full">
            <ChartLegend items={legendItems} />
            <Svg width={width} height={height}>
                <G transform={`translate(${margin.left}, 0)`}>
                    {packedNodes.map((node: any) => (
                        <AnimatedBubble
                            key={node.data.id} cx={node.x} cy={node.y} r={node.r}
                            fill={node.data.color} showLabel={node.r > 20}
                            labelValue={node.data.value.toLocaleString()}
                        />
                    ))}
                </G>
            </Svg>
        </View>
    );
}

export default SunPackedCircleChart;