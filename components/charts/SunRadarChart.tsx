import { animationDuration, HEIGHT, THEME_COLORS } from "@/constants/utilities";
import { scaleLinear } from "d3-scale";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Path, PathProps, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedRadarPolygon({ d, stroke, fill, strokeWidth = 3 }: { d: string; stroke: string; fill: string; strokeWidth?: number }) {
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
                    progress.value = withTiming(1, { duration: animationDuration });
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
        <AnimatedPath ref={pathRef} d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill}
            animatedProps={animatedProps} opacity={pathLength > 0 ? 1 : 0} />
    );
}

function SunRadarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const geos = apiData.activeGeos || [];
    const height = screenHeight ? screenHeight * 0.35 : HEIGHT;

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf("_"))))),
        [apiData]
    );

    const dataSet = useMemo(
        () => geos.map((geo: string) => variables.map((v) => apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0)),
        [geos, variables, apiData]
    );

    const maxValue = useMemo(() => Math.max(1, ...dataSet.flat()), [dataSet]);

    const width = screenWidth;
    const labelPadding = 42;
    const radius = Math.min(width, height) / 2 - labelPadding;
    const svgHeight = radius * 2 + labelPadding * 2;
    const cx = width / 2;
    const cy = svgHeight / 2;
    const levels = 4;
    const angleSlice = variables.length > 0 ? (Math.PI * 2) / variables.length : 0;

    const rScale = useMemo(() => scaleLinear().domain([0, maxValue]).range([0, radius]), [maxValue, radius]);

    const buildPolygonPath = useCallback((vals: number[]) => {
        if (variables.length === 0) return "";
        const cmds: string[] = [];
        for (let i = 0; i < variables.length; i++) {
            const angle = -Math.PI / 2 + i * angleSlice;
            const r = rScale(vals[i]);
            cmds.push(`${i === 0 ? "M" : "L"} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`);
        }
        cmds.push("Z");
        return cmds.join(" ");
    }, [variables.length, angleSlice, rScale, cx, cy]);

    const legendItems = useMemo<LegendItem[]>(
        () => geos.map((geo, i) => ({
            label: geo,
            color: i === 0 ? THEME_COLORS.primary : THEME_COLORS.dark,
        })),
        [geos]
    );

    return (
        <View style={{ backgroundColor: THEME_COLORS.background, padding: 20, borderWidth: 4, borderColor: THEME_COLORS.dark, borderRadius: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontWeight: '900', fontStyle: 'italic', fontSize: 10, color: THEME_COLORS.dark, opacity: 0.3 }}>
                    DIAGNOSTIC_MODULE // RADAR_001
                </Text>
            </View>

            <ChartLegend items={legendItems} />

            <Svg width={width} height={svgHeight}>
                <G>
                    {/* Concentric Circles Grid */}
                    {[0.25, 0.5, 0.75, 1].map((p, i) => (
                        <Circle key={`grid-${i}`} cx={cx} cy={cy} r={radius * p} fill="none" stroke={THEME_COLORS.dark} strokeWidth={1} strokeDasharray="4 4" opacity={0.1} />
                    ))}

                    {variables.map((_, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        return <Line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + radius * Math.cos(angle)} y2={cy + radius * Math.sin(angle)} stroke={THEME_COLORS.dark} strokeWidth={2} opacity={0.15} />;
                    })}

                    {variables.map((v, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        const lx = cx + (radius + labelPadding * 0.7) * Math.cos(angle);
                        const ly = cy + (radius + labelPadding * 0.7) * Math.sin(angle);
                        return (
                            <SvgText key={`label-${i}`} x={lx} y={ly} fontSize={10} fontWeight="900" fontStyle="italic" fill={THEME_COLORS.dark} textAnchor="middle" alignmentBaseline="middle">
                                {v.toUpperCase()}
                            </SvgText>
                        );
                    })}

                    {dataSet.map((vals, i) => {
                        const d = buildPolygonPath(vals);
                        const color = i === 0 ? THEME_COLORS.primary : THEME_COLORS.dark;
                        return <AnimatedRadarPolygon key={`geo-${geos[i] ?? i}`} d={d} stroke={color} fill={color + "33"} />;
                    })}
                </G>
            </Svg>
        </View>
    );
};

export default SunRadarChart;