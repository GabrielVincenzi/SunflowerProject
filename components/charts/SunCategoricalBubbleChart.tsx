import { animationDuration, CHART_COLORS, THEME_COLORS } from "@/constants/utilities";
import { detectScale } from "@/functions/formatHandlers";
import { max } from "d3-array";
import { forceCollide, forceSimulation, forceX, forceY } from "d3-force";
import { scaleOrdinal, scaleSqrt } from "d3-scale";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BubbleNode {
    id: string;
    value: number;
    category: string;
    radius: number;
    color: string;
    x?: number;
    y?: number;
}

function AnimatedBubble({ x, y, radius, color }: { x: number; y: number; radius: number; color: string }) {
    const progress = useSharedValue(0);
    const posX = useSharedValue(x);
    const posY = useSharedValue(y);

    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
        posX.value = withTiming(x, { duration: animationDuration });
        posY.value = withTiming(y, { duration: animationDuration });
    }, [x, y, radius]);

    const animatedProps = useAnimatedProps(() => ({
        cx: posX.value,
        cy: posY.value,
        r: radius * progress.value,
    }));

    return (
        <AnimatedCircle
            fill={color}
            stroke="#141414"
            strokeWidth={1.5}
            animatedProps={animatedProps}
        />
    );
}

function SunCategoricalBubbleChart({ screenWidth, apiData }: any) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const chartHeight = 500;
    const padding = 60;

    const processedData = useMemo(() => {
        const geos = apiData.activeGeos || [];
        const variable = Object.keys(apiData.series || {})[0]?.replace(/_[A-Z0-9]+$/, "");
        const categories = [...new Set(geos.map((geo: string) => apiData.geoMetadata?.[geo]?.category || "Default"))];

        const colorScale = scaleOrdinal<string>()
            .domain(categories)
            .range(palette);

        const nodes: BubbleNode[] = geos.map((geo: string) => {
            const val = apiData.series[`${variable}_${geo}`]?.[0]?.value ?? 0;
            const cat = apiData.geoMetadata?.[geo]?.category || "Default";
            return {
                id: geo,
                value: val,
                category: cat,
                radius: 0,
                color: colorScale(cat),
            };
        });

        return { nodes, categories };
    }, [apiData, palette]);

    const maxVal = max(processedData.nodes.map(n => n.value)) || 0;
    const radiusScale = scaleSqrt()
        .domain([0, maxVal])
        .range([2, screenWidth * 0.12]);

    const [layoutNodes, setLayoutNodes] = useState<BubbleNode[]>([]);

    useEffect(() => {
        const { nodes, categories } = processedData;
        const nodesWithRadius = nodes.map(n => ({ ...n, radius: radiusScale(n.value) }));
        const sectionHeight = (chartHeight - padding * 2) / categories.length;

        const simulation = forceSimulation<BubbleNode>(nodesWithRadius)
            .force("x", forceX(screenWidth / 2).strength(0.1))
            .force("y", forceY((d) => {
                const catIdx = categories.indexOf(d.category);
                return padding + (catIdx * sectionHeight) + (sectionHeight / 2);
            }).strength(0.2))
            .force("collide", forceCollide<BubbleNode>((d) => d.radius + 2))
            .stop();

        for (let i = 0; i < 120; ++i) simulation.tick();
        setLayoutNodes([...nodesWithRadius]);
    }, [processedData, screenWidth, radiusScale]);

    const { label: yUnitLabel } = detectScale(maxVal);

    return (
        <View className="w-full bg-background items-center py-6">
            <ChartLegend
                items={processedData.categories.map((cat, i) => ({
                    label: cat.toUpperCase(),
                    color: palette[i % palette.length]
                }))}
                yUnitLabel={yUnitLabel}
            />

            <View style={{ width: screenWidth, height: chartHeight }}>
                <Svg width={screenWidth} height={chartHeight}>
                    {processedData.categories.map((cat, i) => {
                        const sectionHeight = (chartHeight - padding * 2) / processedData.categories.length;
                        const yPos = padding + (i * sectionHeight);
                        return (
                            <G key={`grid-${cat}`}>
                                <Line
                                    x1={20} x2={screenWidth - 20} y1={yPos} y2={yPos}
                                    stroke="#141414" strokeWidth={1} strokeDasharray="4,4" opacity={0.1}
                                />
                                <SvgText
                                    x={20}
                                    y={yPos + 22}
                                    fontSize={10}
                                    fontWeight="900"
                                    fontStyle="italic"
                                    fill={THEME_COLORS.dark}
                                    opacity={0.3}
                                    letterSpacing={1.5}
                                >
                                    {cat.toUpperCase()}
                                </SvgText>
                            </G>
                        );
                    })}

                    {layoutNodes.map((node) => (
                        <G key={node.id}>
                            <AnimatedBubble
                                x={node.x || 0}
                                y={node.y || 0}
                                radius={node.radius}
                                color={node.color}
                            />
                        </G>
                    ))}
                </Svg>
            </View>
        </View>
    );
}

export default SunCategoricalBubbleChart;