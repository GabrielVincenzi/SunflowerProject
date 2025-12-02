import { animationDuration, colors, height, margin } from "@/constants/utilities";
import { max } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { area, stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { G, Path, Line as SvgLine, Text as SvgText } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type AnimatedAreaProps = {
    d: string;
    fill: string;
    stroke: string;
    startDelay?: number;
};

function AnimatedArea({ d, fill, stroke, startDelay = 0 }: AnimatedAreaProps) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d || !pathRef.current) return;

        const length = pathRef.current.getTotalLength?.() ?? 0;
        setPathLength(length);

        // Start animation AFTER pathLength is set
        progress.value = 0;
        progress.value = withDelay(
            startDelay,
            withTiming(1, { duration: animationDuration, easing: Easing.inOut(Easing.ease) })
        );
    }, [d]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
        opacity: progress.value,
    }));

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={2}
            animatedProps={animatedProps}
            opacity={pathLength > 0 ? 1 : 0}
        />
    );
}


function SunAreaChart({ screenWidth, apiData }: ChartProps) {
    const safeColors = colors || ["#000000"];

    const hasData =
        apiData &&
        Array.isArray(apiData.activeGeos) &&
        apiData.activeGeos.length > 0 &&
        apiData.series &&
        Object.keys(apiData.series).length > 0;

    const flatData: Record<string, number | string>[] = [];
    if (hasData) {
        if (apiData.activeGeos.length > 1) {
            apiData.activePeriods?.forEach((period, i) => {
                const year = new Date(period).getFullYear().toString();
                const entry: Record<string, number | string> = { label: year };
                apiData.activeGeos.forEach((geo) => {
                    const key = Object.keys(apiData.series).find((k) => k.endsWith(`_${geo}`));
                    entry[geo] = key && apiData.series[key]?.[i]?.value != null ? apiData.series[key][i].value : 0;
                });
                flatData.push(entry);
            });
        } else {
            const geo = apiData.activeGeos[0];
            const variableKeys = Object.keys(apiData.series).filter((k) => k.endsWith(`_${geo}`));
            apiData.activePeriods?.forEach((period, i) => {
                const year = new Date(period).getFullYear().toString();
                const entry: Record<string, number | string> = { label: year };
                variableKeys.forEach((key) => {
                    const variableName = key.replace(`_${geo}`, "");
                    entry[variableName] = apiData.series[key]?.[i]?.value ?? 0;
                });
                flatData.push(entry);
            });
        }
    }

    const keys = flatData.length > 0 ? Object.keys(flatData[0]).filter((k) => k !== "label") : [];

    const xLabels = flatData.map((d) => d.label as string);
    const stackedSums = flatData.map(d => keys.reduce((sum, k) => sum + (d[k] as number), 0));
    const yMax = max(stackedSums) ?? 0;
    const width = screenWidth;

    const xScale = scalePoint<string>()
        .domain(xLabels)
        .range([margin.left, width - margin.right]);

    const yScale = scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const stackedSeries = stack<Record<string, string | number>>()
        .keys(keys)
        .order(stackOrderNone)
        .offset(stackOffsetNone)(flatData as any);

    const areaGen = area<{
        0: number;
        1: number;
        data: Record<string, string | number>;
    }>()
        .x((d) => xScale(d.data.label as string)!)
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]));

    return (
        <View>
            {/* Legend */}
            {hasData && (
                <View className="flex-row flex-wrap justify-center mt-1">
                    {keys.map((key, idx) => (
                        <View key={key} className="flex-row items-center m-2" style={{ gap: 6 }}>
                            <View
                                style={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: safeColors[idx % safeColors.length],
                                    borderRadius: 2,
                                }}
                            />
                            <Text style={{ fontSize: 12, color: "grey" }}>{key}</Text>
                        </View>
                    ))}
                </View>
            )}
            <Svg width={width} height={height}>
                {/* X Axis */}
                <G transform={`translate(0, ${height - margin.bottom})`}>
                    {xLabels.map((label, i) => (
                        <G key={i} transform={`translate(${xScale(label)}, 0)`}>
                            <SvgLine y2={6} stroke="grey" />
                            <SvgText y={20} fontSize={12} fill="grey" textAnchor="middle">
                                {label}
                            </SvgText>
                        </G>
                    ))}
                    <SvgLine x1={margin.left} x2={width - margin.right} stroke="grey" strokeWidth={1} />
                </G>

                {/* Y Axis */}
                <G transform={`translate(${margin.left}, 0)`}>
                    {yScale.ticks(5).map((tick, i) => (
                        <G key={i} transform={`translate(0, ${yScale(tick)})`}>
                            <SvgLine x2={-6} stroke="grey" />
                            <SvgText x={-10} dy="0.32em" fontSize={12} fill="grey" textAnchor="end">
                                {tick}
                            </SvgText>
                        </G>
                    ))}
                    <SvgLine y1={margin.top} y2={height - margin.bottom} stroke="grey" strokeWidth={1} />
                </G>

                {/* Animated stacked areas (wave from left to right) */}
                {stackedSeries.map((series, idx) => (
                    <AnimatedArea
                        key={series.key as string}
                        d={areaGen(series) ?? ""}
                        fill={safeColors[idx % safeColors.length]}
                        stroke={safeColors[idx % safeColors.length]}
                        startDelay={idx * 150} // stagger start, like a wave
                    />
                ))}
            </Svg>
        </View>
    );
}

export default SunAreaChart;
