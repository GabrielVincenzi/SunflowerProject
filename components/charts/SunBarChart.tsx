import { animationDuration, colors, height, margin } from "@/constants/utilities";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({ x, width, color, value, yScale, chartHeight }: AnimatedBarProps) {
    const progress = useSharedValue(0);
    const [barLength, setBarLength] = useState(0);

    useEffect(() => {
        if (value == null || chartHeight == 0 || !yScale) return;
        const fullLength = chartHeight - yScale(value); // actual bar height
        setBarLength(fullLength);
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration });
    }, [value, chartHeight, yScale]);

    const animatedProps = useAnimatedProps(() => {
        const currentLength = barLength * progress.value;
        return {
            // start drawing from bottom (yScale(0))
            y: chartHeight - currentLength,
            height: currentLength,
        };
    });

    return (
        <AnimatedRect
            x={x}
            width={width}
            fill={color}
            animatedProps={animatedProps}
        />
    );
}


function SunBarChart({ screenWidth, apiData }: ChartProps) {
    const safeColors = colors || ["#000000"];
    const geos = apiData.activeGeos || [];

    // Extract variables
    const variables = useMemo(
        () =>
            [
                ...new Set(
                    Object.keys(apiData.series || {}).map((k) => k.split("_")[0])
                ),
            ],
        [apiData]
    );

    // Prepare grouped data
    const data = useMemo(
        () =>
            variables.map((variable) => ({
                variable,
                values: geos.map((geo, geoIdx) => {
                    const key = `${variable}_${geo}`;
                    const value =
                        key in apiData.series && apiData.series[key]?.[0]?.value != null
                            ? apiData.series[key][0].value
                            : 0;
                    return {
                        geo,
                        value,
                        color: safeColors[geoIdx % safeColors.length],
                    };
                }),
            })),
        [variables, geos, apiData, safeColors]
    );

    const minBarWidth = 20; // minimum width per bar

    // Dynamic SVG width based on number of bars
    const totalBars = variables.length * geos.length;
    const svgWidth = Math.max(screenWidth * 0.9, totalBars * minBarWidth);

    // X scales
    const x0 = scaleBand<string>()
        .domain(variables)
        .range([margin.left, svgWidth - margin.right])
        .paddingInner(0.2);

    const x1 = scaleBand<string>()
        .domain(geos)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    // Y scale
    const yMax = max(data.flatMap((d) => d.values.map((v) => v.value))) || 0;
    const y = scaleLinear().domain([0, yMax]).nice().range([height - margin.bottom, margin.top]);
    const yTicks = y.ticks(5);

    return (
        <View className="w-full px-4">
            {/* Legend */}
            <View className="flex-row flex-wrap justify-center mt-4">
                {geos.map((geo, idx) => (
                    <View
                        key={geo}
                        className="flex-row items-center m-2"
                        style={{ gap: 6 }}
                    >
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: safeColors[idx % safeColors.length],
                                borderRadius: 2,
                            }}
                        />
                        <Text style={{ fontSize: 12, color: "grey" }}>{geo}</Text>
                    </View>
                ))}
            </View>
            <View style={{ flexDirection: "row" }}>
                {/* Y-axis fixed */}
                <Svg width={margin.left} height={height}>
                    {/* Vertical axis line */}
                    <Line
                        x1={margin.left - 1}
                        y1={margin.top}
                        x2={margin.left - 1}
                        y2={height - margin.bottom}
                        stroke="grey"
                        strokeWidth={1}
                    />

                    {/* Y-axis ticks and labels */}
                    {yTicks.map((tick) => (
                        <SvgText
                            key={tick}
                            x={margin.left - 5}
                            y={y(tick)}
                            fontSize={10}
                            fill="grey"
                            textAnchor="end"
                            alignmentBaseline="middle"
                        >
                            {tick}
                        </SvgText>
                    ))}
                </Svg>

                {/* Scrollable Bars */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Svg width={svgWidth + margin.left} height={height}>
                        {/* Horizontal gridlines */}
                        {yTicks.map((tick) => (
                            <Line
                                key={tick}
                                x1={0}
                                x2={svgWidth}
                                y1={y(tick)}
                                y2={y(tick)}
                                stroke="#e0e0e0"
                                strokeWidth={1}
                            />
                        ))}

                        {/* Bars */}
                        {data.map((group) => (
                            <G key={group.variable} x={x0(group.variable) || 0}>
                                {group.values.map((d) => (
                                    <AnimatedBar
                                        key={`${group.variable}-${d.geo}`}
                                        x={x1(d.geo) || 0}
                                        width={x1.bandwidth() || minBarWidth}
                                        color={d.color}
                                        value={d.value}
                                        yScale={y}
                                        chartHeight={height - margin.bottom}
                                    />

                                ))}

                                {/* X-axis label */}
                                <SvgText
                                    x={(x0.bandwidth() || minBarWidth) / 2}
                                    y={height - margin.bottom + 15}
                                    fontSize={12}
                                    fill="grey"
                                    textAnchor="middle"
                                >
                                    {group.variable}
                                </SvgText>
                            </G>
                        ))}
                    </Svg>
                </ScrollView>

            </View>
        </View>
    );
}

export default SunBarChart;
