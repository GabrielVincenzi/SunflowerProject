import { animationDuration, CHART_COLORS, HEIGHT, margin, THEME_COLORS } from "@/constants/utilities";
import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import React, { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Rect, RectProps, Line as SvgLine, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Right bar: x is fixed at cx, width grows rightward
function AnimatedBarRight({ cx, y, fullWidth, bh, color }: { cx: number; y: number; fullWidth: number; bh: number; color: string }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }, [fullWidth]);
    const animatedProps = useAnimatedProps<RectProps>(() => ({ width: fullWidth * progress.value }));
    return <AnimatedRect x={cx} y={y} height={bh} fill={color} stroke={THEME_COLORS.dark} strokeWidth={1.5} animatedProps={animatedProps} />;
}

// Left bar: both x and width animate so bar grows leftward from cx
function AnimatedBarLeft({ cx, y, fullWidth, bh, color }: { cx: number; y: number; fullWidth: number; bh: number; color: string }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = 0;
        progress.value = withTiming(1, { duration: animationDuration, easing: Easing.bezier(0.16, 1, 0.3, 1) });
    }, [fullWidth]);
    const animatedProps = useAnimatedProps<RectProps>(() => ({
        x: cx - fullWidth * progress.value,
        width: fullWidth * progress.value,
    }));
    return <AnimatedRect y={y} height={bh} fill={color} stroke={THEME_COLORS.dark} strokeWidth={1.5} animatedProps={animatedProps} />;
}

function SunPopulationPyramidChart({ screenWidth, screenHeight, apiData }: any) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const width = screenWidth;
    const height = screenHeight ? screenHeight * 0.45 : HEIGHT;
    const geos = apiData.activeGeos || [];
    const lastIdx = Math.max(0, (apiData.activePeriods || []).length - 1);
    const variables = useMemo(() => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.replace(/_[A-Z]{2,3}$/, "")))), [apiData]);

    const leftValues = variables.map((v) => Math.abs(apiData.series[`${v}_${geos[0] || ""}`]?.[lastIdx]?.value ?? 0));
    const rightValues = variables.map((v) => Math.abs(apiData.series[`${v}_${geos[1] || geos[0] || ""}`]?.[lastIdx]?.value ?? 0));

    const maxVal = max([...leftValues, ...rightValues]) ?? 1;
    const halfWidth = (width - margin.left - margin.right) / 2 - 12;
    const cx = width / 2;

    const yScale = scaleBand<string>().domain(variables).range([margin.top, height - margin.bottom]).padding(0.2);
    const xScale = scaleLinear().domain([0, maxVal]).range([0, halfWidth]);

    return (
        <View className="w-full bg-background py-4">
            <View className="flex-row justify-center mb-6" style={{ gap: 20 }}>
                {geos.slice(0, 2).map((geo: string, i: number) => (
                    <View key={geo + i} className="flex-row items-center">
                        <View
                            style={{
                                width: 12,
                                height: 12,
                                backgroundColor: palette[i % palette.length],
                                borderWidth: 1.5,
                                borderColor: "#141414",
                                marginRight: 8,
                            }}
                        />
                        <Text className="text-[10px] font-black italic uppercase tracking-widest text-dark">
                            {geo}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={{ width: "100%", alignItems: "center" }}>
                <Svg width={width} height={height}>
                    <SvgLine
                        x1={cx}
                        x2={cx}
                        y1={margin.top - 4}
                        y2={height - margin.bottom + 4}
                        stroke={THEME_COLORS.dark}
                        strokeWidth={2.5}
                    />
                    <SvgLine
                        x1={margin.left}
                        x2={width - margin.right}
                        y1={height - margin.bottom}
                        y2={height - margin.bottom}
                        stroke={THEME_COLORS.dark}
                        strokeWidth={2.5}
                    />
                    {variables.map((v, i) => (
                        <G key={v}>
                            <AnimatedBarLeft
                                cx={cx}
                                y={yScale(v) ?? 0}
                                fullWidth={xScale(leftValues[i])}
                                bh={yScale.bandwidth()}
                                color={palette[0]}
                            />
                            <AnimatedBarRight
                                cx={cx}
                                y={yScale(v) ?? 0}
                                fullWidth={xScale(rightValues[i])}
                                bh={yScale.bandwidth()}
                                color={palette[1 % palette.length]}
                            />
                            <SvgText
                                x={cx}
                                y={(yScale(v) ?? 0) + yScale.bandwidth() / 2 + 4}
                                textAnchor="middle"
                                fontSize={10}
                                fontWeight="900"
                                fill={THEME_COLORS.dark}
                                opacity={0.2}
                            >
                                {v.toUpperCase()}
                            </SvgText>
                        </G>
                    ))}
                </Svg>
            </View>
        </View>
    );
}

export default SunPopulationPyramidChart;