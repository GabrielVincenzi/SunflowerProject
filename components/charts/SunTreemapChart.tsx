import { animationDuration, CHART_COLORS, CHART_TEXT_FONT, HEIGHT, margin } from "@/constants/utilities";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, Rect, RectProps, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Animated tile — mirrors AnimatedBar (width + height grow) ─
function AnimatedTile({ x, y, w, h, fill, delay = 0 }: { x: number; y: number; w: number; h: number; fill: string; delay?: number }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = 0;
        progress.value = withDelay(delay, withTiming(1, { duration: animationDuration }));
    }, [w, h]);

    const animatedProps = useAnimatedProps<RectProps>(() => ({
        width: w * progress.value,
        height: h * progress.value,
    }));

    return <AnimatedRect x={x} y={y} fill={fill} rx={6} opacity={0.9} animatedProps={animatedProps} />;
}

// ─── Component ────────────────────────────────────────────────
// Geos = color groups; variables = leaves. Uses first period value.
function SunTreemapChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const safeColors = CHART_COLORS || ["#FCD34D"];
    const width = screenWidth;
    const height = screenHeight ? screenHeight * 0.42 : HEIGHT;

    const geos = apiData.activeGeos || [];
    const variables = useMemo(() => {
        return Array.from(new Set(
            Object.keys(apiData.series || {}).map((k) =>
                k.substring(0, k.lastIndexOf('_'))  // Everything BEFORE last _
            )
        ));
    }, [apiData.series]);

    const lastPeriodIndex = Math.max(0, (apiData.activePeriods?.length ?? 1) - 1);
    const filteredGeos = variables.length === 1 ? geos : [geos[0]].filter(Boolean);

    const chartData = useMemo(() => ({
        name: "root",
        children: filteredGeos.map((geo, gi) => ({
            name: geo,
            children: variables.map((v, vi) => ({
                name: v, geo,
                value: Math.abs(apiData.series[`${v}_${geo}`]?.[lastPeriodIndex]?.value ?? 0),
                geoIndex: gi, varIndex: vi,
            })),
        })),
    }), [filteredGeos, variables, apiData, lastPeriodIndex]);

    const legendItems = useMemo<LegendItem[]>(
        () => variables.length > 1
            ? variables.map((v, i) => ({
                label: apiData.variableLabels?.[v] ?? v,
                color: safeColors[i % safeColors.length],
            }))
            : filteredGeos.map((geo, i) => ({
                label: geo,
                color: safeColors[i % safeColors.length],
            })),
        [variables, filteredGeos, safeColors, apiData.variableLabels]
    );

    const leaves = useMemo(() => {
        const chartW = width - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;
        const root = hierarchy(chartData as any).sum((d: any) => d.value).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
        treemap<any>().size([chartW, chartH]).tile(treemapSquarify).padding(3).round(true)(root);
        return root.leaves() as any[];
    }, [chartData, width, height]);

    const formatVal = (v: number) => {
        if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
        if (v >= 1_000) return (v / 1_000).toFixed(0) + "K";
        return v.toFixed(0);
    };

    return (
        <View className="w-full bg-background">
            {/* Legend */}
            <ChartLegend items={legendItems} />

            {/* Chart Section */}
            <Svg width={width} height={height}>
                <G transform={`translate(${margin.left}, ${margin.top})`}>
                    {leaves.map((node: any, i: number) => {
                        const w = node.x1 - node.x0;
                        const h = node.y1 - node.y0;
                        if (w < 2 || h < 2) return null;
                        const col = variables.length > 1
                            ? safeColors[node.data.varIndex % safeColors.length]
                            : safeColors[node.data.geoIndex % safeColors.length];
                        return (
                            <G key={`${node.data.geo}-${node.data.name}`}>
                                <AnimatedTile x={node.x0} y={node.y0} w={w} h={h} fill={col} delay={i * 30} />
                                {w > 40 && h > 20 && (
                                    <SvgText x={node.x0 + 8} y={node.y0 + 32} fontSize={CHART_TEXT_FONT} fill="#F0EFEC">
                                        {formatVal(node.data.value)}
                                    </SvgText>
                                )}

                            </G>
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}

export default SunTreemapChart;
