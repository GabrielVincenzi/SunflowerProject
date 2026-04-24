import { animationDuration, CHART_COLORS, CHART_TEXT_FONT, HEIGHT } from "@/constants/utilities";
import { scaleLinear } from "d3-scale";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { G, Line, Path, PathProps, Text as SvgText } from "react-native-svg";
import ChartLegend from "../ChartLegend";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Animated polygon ─────────────────────────────────────────
function AnimatedRadarPolygon({ d, stroke, fill, strokeWidth = 2 }: { d: string; stroke: string; fill: string; strokeWidth?: number }) {
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

// ─── Component ────────────────────────────────────────────────
function SunRadarChart({ screenWidth, screenHeight, apiData }: ChartProps) {
    const safeColors = CHART_COLORS || ["#FCD34D"];
    const geos = apiData.activeGeos || [];
    const height = screenHeight ? screenHeight * 0.35 : HEIGHT;

    const variables = useMemo(
        () => Array.from(new Set(Object.keys(apiData.series || {}).map((k) => k.substring(0, k.lastIndexOf("_"))))),
        [apiData]
    );

    const dataSet = useMemo(
        () => geos.map((geo) => variables.map((v) => apiData.series?.[`${v}_${geo}`]?.[0]?.value ?? 0)),
        [geos, variables, apiData]
    );

    const maxValue = useMemo(() => Math.max(1, ...dataSet.flat()), [dataSet]);

    const width = screenWidth;
    const labelPadding = 36; // space reserved for axis labels on each side
    const radius = Math.min(width, height) / 2 - labelPadding;
    const svgHeight = radius * 2 + labelPadding * 2;
    const cx = width / 2;
    const cy = svgHeight / 2;
    const levels = 4;
    const angleSlice = variables.length > 0 ? (Math.PI * 2) / variables.length : 0;

    const rScale = useMemo(() => scaleLinear().domain([0, maxValue]).range([0, radius]), [maxValue, radius]);

    const gridPaths = useMemo(() => {
        if (variables.length === 0) return [];
        return Array.from({ length: levels }, (_, i) => {
            const r = ((i + 1) / levels) * radius;
            const cmds: string[] = [];
            for (let j = 0; j < variables.length; j++) {
                const angle = -Math.PI / 2 + j * angleSlice;
                cmds.push(`${j === 0 ? "M" : "L"} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`);
            }
            cmds.push("Z");
            return cmds.join(" ");
        });
    }, [variables.length, levels, radius, angleSlice, cx, cy]);

    const legendItems = useMemo<LegendItem[]>(
        () => geos.map((geo, i) => ({
            label: geo,
            color: safeColors[i % safeColors.length],
        })),
        [geos, safeColors]
    );

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

    return (
        <View className="w-full px-4">
            {/* Legend */}
            <ChartLegend items={legendItems} />

            {/* Chart Section */}
            <Svg width={width} height={svgHeight}>
                <G>
                    {gridPaths.map((d, i) => <Path key={`grid-${i}`} d={d} stroke="#ccc" strokeWidth={1} fill="none" />)}
                    {variables.map((_, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        return <Line key={`axis-${i}`} x1={cx} y1={cy} x2={cx + radius * Math.cos(angle)} y2={cy + radius * Math.sin(angle)} stroke="#ccc" strokeWidth={1} />;
                    })}
                    {variables.map((v, i) => {
                        const angle = -Math.PI / 2 + i * angleSlice;
                        const lx = cx + (radius + labelPadding * 0.8) * Math.cos(angle);
                        const ly = cy + (radius + labelPadding * 0.8) * Math.sin(angle);
                        return (
                            <SvgText
                                key={`label-${i}`}
                                x={lx}
                                y={ly}
                                fontSize={CHART_TEXT_FONT}
                                fill="grey"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {v}
                            </SvgText>
                        );
                    })}
                    {dataSet.map((vals, i) => {
                        const d = buildPolygonPath(vals);
                        const stroke = safeColors[i % safeColors.length];
                        return <AnimatedRadarPolygon key={`geo-${geos[i] ?? i}`} d={d} stroke={stroke} fill={stroke + "33"} />;
                    })}
                </G>
            </Svg>
        </View>
    );
}

export default SunRadarChart;
