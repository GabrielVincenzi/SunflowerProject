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
            [...new Set(
                Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2}$/, ""))
            )],
        [apiData]
    );

    // Prepare grouped data
    const data = useMemo(
        () =>
            geos.map((geo) => ({
                geo,
                values: variables.map((variable, varIdx) => {
                    const key = `${variable}_${geo}`;
                    const value = apiData.series[key]?.[0]?.value ?? 0;
                    return {
                        variable,
                        value,
                        color: safeColors[varIdx % safeColors.length],
                    };
                }),
            })),
        [variables, geos, apiData, safeColors]
    );

    const minBarWidth = 20; // minimum width per bar

    // Dynamic SVG width based on number of bars
    const totalBars = geos.length * variables.length;
    const svgWidth = Math.max(screenWidth * 0.9, totalBars * minBarWidth);

    // X scales
    const x0 = scaleBand<string>()
        .domain(geos)
        .range([margin.left, svgWidth - margin.right])
        .paddingInner(0.2);

    const x1 = scaleBand<string>()
        .domain(variables)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    // Y scale
    const yMax = max(data.flatMap((d) => d.values.map((v) => v.value))) || 0;
    const y = scaleLinear().domain([0, yMax]).nice().range([height - margin.bottom, margin.top]);
    const yTicks = y.ticks(5);

    return (
        <View className="w-full bg-background">
            {/* Legend */}
            <View className="items-center">
                <View className="flex-row flex-wrap justify-center mt-1">
                    {variables.map((variable, idx) => (
                        <View
                            key={variable}
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
                            <Text style={{ fontSize: 12, color: "grey" }}>{variable}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Svg width={svgWidth} height={height}>

                        {/* X Axis */}
                        <G transform={`translate(0, ${height - margin.bottom})`}>
                            <Line
                                x1={margin.left}
                                x2={svgWidth - margin.right}
                                stroke="grey"
                                strokeWidth={1}
                            />

                            {geos.map((geo) => (
                                <G
                                    key={geo}
                                    transform={`translate(${(x0(geo) ?? 0) + x0.bandwidth() / 2}, 0)`}
                                >
                                    <Line y2={6} stroke="grey" />
                                    <SvgText y={20} fontSize={13} fill="grey" textAnchor="middle">
                                        {geo}
                                    </SvgText>
                                </G>
                            ))}
                        </G>

                        {/* Y Axis */}
                        <G transform={`translate(${margin.left}, 0)`}>
                            {yTicks.map((tick) => (
                                <G key={tick} transform={`translate(0, ${y(tick)})`}>
                                    <Line x2={-6} stroke="grey" />
                                    <SvgText
                                        x={-10}
                                        dy="0.32em"
                                        fontSize={13}
                                        fill="grey"
                                        textAnchor="end"
                                    >
                                        {tick}
                                    </SvgText>
                                </G>
                            ))}

                            <Line
                                y1={margin.top}
                                y2={height - margin.bottom}
                                stroke="grey"
                                strokeWidth={1}
                            />
                        </G>

                        {/* Horizontal gridlines */}
                        {yTicks.map((tick) => (
                            <Line
                                key={tick}
                                x1={margin.left}
                                x2={svgWidth - margin.right}
                                y1={y(tick)}
                                y2={y(tick)}
                                stroke="#e0e0e0"
                                strokeWidth={1}
                            />
                        ))}

                        {/* Bars */}
                        {data.map((group) => (
                            <G key={group.geo} x={x0(group.geo) || 0}>
                                {group.values.map((d) => (
                                    <AnimatedBar
                                        key={`${group.geo}-${d.variable}`}
                                        x={x1(d.variable) || 0}
                                        width={x1.bandwidth() || minBarWidth}
                                        color={d.color}
                                        value={d.value}
                                        yScale={y}
                                        chartHeight={height - margin.bottom}
                                    />
                                ))}
                            </G>
                        ))}

                    </Svg>
                </ScrollView>
            </View>
        </View>
    );
}

export default SunBarChart;
