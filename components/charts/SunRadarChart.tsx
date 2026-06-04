import { animationDuration, CHART_COLORS, HEIGHT, THEME_COLORS } from "@/constants/utilities";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Path, PathProps, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedRadarPolygon({
    d,
    stroke,
    fill,
    strokeWidth = 3,
}: {
    d: string;
    stroke: string;
    fill: string;
    strokeWidth?: number;
}) {
    const progress = useSharedValue(0);
    const pathRef = useRef<Path>(null);
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        if (!d) return;

        const timeout = setTimeout(() => {
            if (pathRef.current) {
                const length = pathRef.current.getTotalLength?.() ?? 0;
                if (length > 0) {
                    setPathLength(length);
                    progress.value = 0;
                    progress.value = withTiming(1, {
                        duration: animationDuration,
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                    });
                }
            }
        }, 0);

        return () => clearTimeout(timeout);
    }, [d]);

    const animatedProps = useAnimatedProps<PathProps>(() => ({
        strokeDasharray: pathLength ? [pathLength, pathLength] : [0, 0],
        strokeDashoffset: pathLength ? pathLength * (1 - progress.value) : 0,
        opacity: pathLength ? progress.value : 0,
    }));

    return (
        <AnimatedPath
            ref={pathRef}
            d={d}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={fill}
            animatedProps={animatedProps}
            opacity={pathLength > 0 ? 1 : 0}
        />
    );
}

function SunRadarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const palette = apiData?.palette ?? CHART_COLORS;
    const geos = apiData.activeGeos || [];
    const height = screenHeight ? screenHeight * 0.45 : HEIGHT;

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf("_"))))),
        [apiData]
    );

    const chartData = useMemo(
        () =>
            geos.map((geo: string) =>
                variables.map((v) => apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0)
            ),
        [geos, variables, apiData]
    );

    const maxValue = useMemo(() => max(chartData.flat()) || 0, [chartData]);

    const width = screenWidth;
    const labelPadding = 42;
    const radius = Math.min(width, height) / 2 - labelPadding;
    const svgHeight = radius * 2 + labelPadding * 2;
    const cx = width / 2;
    const cy = svgHeight / 2;
    const levels = 4;
    const angleSlice = variables.length > 0 ? (Math.PI * 2) / variables.length : 0;

    const rScale = useMemo(() => scaleLinear().domain([0, maxValue]).range([0, radius]), [maxValue, radius]);

    const buildPolygonPath = (vals: number[]) => {
        if (!variables.length) return "";
        const cmds: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            const angle = -Math.PI / 2 + i * angleSlice;
            const r = rScale(vals[i] ?? 0);
            cmds.push(`${i === 0 ? "M" : "L"} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`);
        }
        cmds.push("Z");
        return cmds.join(" ");
    };

    const legendItems = useMemo(
        () =>
            geos.map((geo, i) => ({
                label: geo,
                color: palette[i % palette.length],
            })),
        [geos]
    );

    return (
        <View className="w-full bg-background">
            <ChartLegend items={legendItems} />

            <View className="w-full bg-background">
                <ChartLegend items={legendItems} />

                <View
                    style={{
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingBottom: 20,
                    }}
                >
                    <Svg width={width} height={svgHeight}>
                        <G>
                            {[...Array(levels)].map((_, i) => {
                                const p = (i + 1) / levels;
                                return (
                                    <Circle
                                        key={`grid-${i}`}
                                        cx={cx}
                                        cy={cy}
                                        r={radius * p}
                                        fill="none"
                                        stroke={THEME_COLORS.dark}
                                        strokeWidth={1}
                                        strokeDasharray="4,4"
                                        opacity={0.08}
                                    />
                                );
                            })}

                            {variables.map((_, i) => {
                                const angle = -Math.PI / 2 + i * angleSlice;
                                return (
                                    <Line
                                        key={`axis-${i}`}
                                        x1={cx}
                                        y1={cy}
                                        x2={cx + radius * Math.cos(angle)}
                                        y2={cy + radius * Math.sin(angle)}
                                        stroke={THEME_COLORS.dark}
                                        strokeWidth={2}
                                        opacity={0.14}
                                    />
                                );
                            })}

                            {variables.map((v, i) => {
                                const angle = -Math.PI / 2 + i * angleSlice;
                                const lx = cx + (radius + labelPadding * 0.7) * Math.cos(angle);
                                const ly = cy + (radius + labelPadding * 0.7) * Math.sin(angle);

                                return (
                                    <SvgText
                                        key={`label-${i}`}
                                        x={lx}
                                        y={ly}
                                        fontSize={10}
                                        fill={THEME_COLORS.dark}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        fontWeight="800"
                                        letterSpacing={0.5}
                                    >
                                        {v.toUpperCase()}
                                    </SvgText>
                                );
                            })}

                            {geos.map((geo, i) => {
                                const d = buildPolygonPath(chartData[i] || []);
                                const color = palette[i % palette.length];

                                return (
                                    <AnimatedRadarPolygon
                                        key={`geo-${geo}`}
                                        d={d}
                                        stroke={color}
                                        fill={color + "22"}
                                        strokeWidth={3}
                                    />
                                );
                            })}
                        </G>
                    </Svg>
                </View>
            </View>
        </View>
    );
}

export default SunRadarChart;