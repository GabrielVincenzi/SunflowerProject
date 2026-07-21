import { Feather } from '@expo/vector-icons';
import { scaleLinear, scalePoint } from 'd3-scale';
import * as d3 from 'd3-shape';
import { line as d3Line } from 'd3-shape';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Circle, G, Line, Path, Rect, Svg, Text as SvgText } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'draw' | 'submitted' | 'reveal';

interface DataPoint {
    period: string;   // x-axis label, e.g. "2010"
    value: number;    // y-axis value
}

interface Scenario {
    id: string;
    title: string;
    claim: string;       // the Socratic framing question shown to the user
    unit: string;
    knownSeries: DataPoint[];   // the history the user sees before drawing
    futureSeries: DataPoint[];  // the truth revealed after submission
    realStory: string;          // one-paragraph explanation shown after reveal
    sourceName: string;
    /** Which series key to overlay for comparison (e.g. a reference series) */
    referenceSeries?: DataPoint[];
    referenceLabel?: string;
}

interface DrawnPoint {
    periodIndex: number;  // index into futureSeries
    value: number;
}

// ─── Curated scenarios ────────────────────────────────────────────────────────
// Same pattern as Manipulator's Studio: hand-authored to demonstrate specific
// cognitive biases (here: scope insensitivity, anchoring on short windows,
// base-rate neglect). Swap getRandomScenario() for a real fetch later.

const SCENARIOS: Scenario[] = [
    {
        id: 'co2-transport-2010-2023',
        title: 'Transport emissions, 2000–2023',
        claim: 'You can see how transport CO₂ emissions grew from 2000 to 2012. Draw where you think they went next.',
        unit: 'Gt CO₂',
        knownSeries: [
            { period: '2000', value: 5.4 },
            { period: '2002', value: 5.7 },
            { period: '2004', value: 6.1 },
            { period: '2006', value: 6.4 },
            { period: '2008', value: 6.5 },
            { period: '2010', value: 6.6 },
            { period: '2012', value: 6.8 },
        ],
        futureSeries: [
            { period: '2014', value: 7.0 },
            { period: '2016', value: 7.2 },
            { period: '2018', value: 7.5 },
            { period: '2020', value: 6.1 },
            { period: '2022', value: 7.1 },
            { period: '2023', value: 7.3 },
        ],
        realStory:
            'Most people draw a continuation of the upward trend — and they are right until 2019. Then COVID-19 caused the sharpest single-year drop in recorded transport history (2020: −19%). By 2022, emissions had largely rebounded. The lesson: long-run trends can be derailed by single discontinuous events that are impossible to predict from history alone, but are easy to explain in hindsight.',
        sourceName: 'IEA Transport Emissions, 2024',
    },
    {
        id: 'global-temp-anomaly',
        title: 'Global temperature anomaly, 1980–2023',
        claim: 'You can see the temperature anomaly from 1980 to 2000. Draw where you think it went in the following decades.',
        unit: '°C vs 1951–1980 avg',
        knownSeries: [
            { period: '1980', value: 0.26 },
            { period: '1982', value: 0.12 },
            { period: '1984', value: 0.16 },
            { period: '1986', value: 0.18 },
            { period: '1988', value: 0.38 },
            { period: '1990', value: 0.44 },
            { period: '1992', value: 0.23 },
            { period: '1994', value: 0.31 },
            { period: '1996', value: 0.35 },
            { period: '1998', value: 0.61 },
            { period: '2000', value: 0.42 },
        ],
        futureSeries: [
            { period: '2002', value: 0.56 },
            { period: '2004', value: 0.54 },
            { period: '2006', value: 0.61 },
            { period: '2008', value: 0.54 },
            { period: '2010', value: 0.72 },
            { period: '2012', value: 0.64 },
            { period: '2014', value: 0.75 },
            { period: '2016', value: 1.01 },
            { period: '2018', value: 0.85 },
            { period: '2020', value: 1.02 },
            { period: '2022', value: 0.89 },
            { period: '2023', value: 1.17 },
        ],
        realStory:
            'Research consistently shows people underestimate the slope of long-run warming when shown only a 20-year window — the 1998 El Niño spike anchors their mental model, making subsequent years look flat by comparison. In reality, every decade since 2000 has set new records. The 2023 anomaly of +1.17°C was the highest ever recorded, and 2016 broke the record at the time. Drawing the past trains your eye on noise; the signal was always pointing upward.',
        sourceName: 'NASA GISS Surface Temperature Analysis, 2024',
    },
    {
        id: 'internet-users',
        title: 'Global internet users, 1995–2023',
        claim: 'You can see how internet adoption grew from 1995 to 2005. Draw where you think it went over the next 18 years.',
        unit: 'billion users',
        knownSeries: [
            { period: '1995', value: 0.04 },
            { period: '1997', value: 0.12 },
            { period: '1999', value: 0.28 },
            { period: '2001', value: 0.50 },
            { period: '2003', value: 0.78 },
            { period: '2005', value: 1.02 },
        ],
        futureSeries: [
            { period: '2007', value: 1.37 },
            { period: '2009', value: 1.73 },
            { period: '2011', value: 2.27 },
            { period: '2013', value: 2.77 },
            { period: '2015', value: 3.37 },
            { period: '2017', value: 3.96 },
            { period: '2019', value: 4.39 },
            { period: '2021', value: 4.95 },
            { period: '2023', value: 5.40 },
        ],
        realStory:
            'People who saw the 1995–2005 data typically predict a flattening S-curve that tops out around 2–3 billion — reasonable given that early adoption curves always flatten. What they miss: mobile internet in Asia and Africa drove a second wave of adoption after 2010. The real curve never flattened the way Western adoption models predicted. Today over 5 billion people are online. S-curves exist, but where the ceiling sits is almost always underestimated.',
        sourceName: 'ITU/Our World in Data, 2024',
    },
];

function getRandomScenario(excludeId?: string): Scenario {
    const pool = excludeId ? SCENARIOS.filter((s) => s.id !== excludeId) : SCENARIOS;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Chart constants ──────────────────────────────────────────────────────────

const SVG_WIDTH = Dimensions.get('window').width - 48;
const SVG_HEIGHT = 240;
const MARGIN = { top: 20, right: 20, bottom: 36, left: 48 };
const INNER_W = SVG_WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface ScoreResult {
    meanAbsErrorPct: number;
    verdict: 'oracle' | 'sharp' | 'decent' | 'offtrack' | 'lost';
    headline: string;
    explanation: string;
}

function scoreDrawing(scenario: Scenario, drawn: DrawnPoint[]): ScoreResult {
    if (drawn.length === 0) {
        return {
            meanAbsErrorPct: 100,
            verdict: 'lost',
            headline: 'No prediction drawn.',
            explanation: 'Draw a line next time to see how your intuition holds up.',
        };
    }

    let totalError = 0;
    let count = 0;

    scenario.futureSeries.forEach((pt, i) => {
        const match = drawn.find((d) => d.periodIndex === i);
        if (!match) return;
        const denom = Math.abs(pt.value) || 1;
        totalError += Math.abs(match.value - pt.value) / denom;
        count++;
    });

    const mae = count > 0 ? (totalError / count) * 100 : 100;
    const rounded = Math.round(mae * 10) / 10;

    if (rounded < 5) return { meanAbsErrorPct: rounded, verdict: 'oracle', headline: 'Remarkable.', explanation: 'You read the trend with almost uncanny precision. Most people miss this by a wide margin.' };
    if (rounded < 15) return { meanAbsErrorPct: rounded, verdict: 'sharp', headline: 'Sharp intuition.', explanation: 'You got the direction right and the magnitude close. Your mental model of this trend is well-calibrated.' };
    if (rounded < 30) return { meanAbsErrorPct: rounded, verdict: 'decent', headline: 'Right direction, rough magnitude.', explanation: 'You sensed the trend correctly but misjudged how far it would go. That\'s where most people land.' };
    if (rounded < 55) return { meanAbsErrorPct: rounded, verdict: 'offtrack', headline: 'Off-track.', explanation: 'The real data moved more than you expected — or less. Reality rarely follows the trajectory our intuition draws.' };
    return { meanAbsErrorPct: rounded, verdict: 'lost', headline: 'Widely off.', explanation: 'The series went somewhere almost no one predicts. These are the data stories that surprise everyone — including experts.' };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TimeMachineProps {
    onClose: () => void;
    onComplete?: (event: { objectId: string; action: string; score: ScoreResult }) => void;
}

export default function TimeMachine({ onClose, onComplete }: TimeMachineProps) {
    const [scenario, setScenario] = useState<Scenario>(() => getRandomScenario());
    const [phase, setPhase] = useState<Phase>('draw');
    const [drawnPoints, setDrawnPoints] = useState<DrawnPoint[]>([]);
    const [score, setScore] = useState<ScoreResult | null>(null);

    // Track whether the user has started drawing at all
    const [hasStartedDrawing, setHasStartedDrawing] = useState(false);

    // ── Scales (known-only phase vs full-range reveal phase) ─────────────────
    // During 'draw': x-axis shows known + future periods (full range) but
    // the future portion is visually greyed. On reveal, both series plot.
    // Key architectural point: x-scale always includes ALL periods so the
    // drawn line and the real line share the same coordinate system.

    const allPeriods = useMemo(
        () => [...scenario.knownSeries, ...scenario.futureSeries].map((d) => d.period),
        [scenario]
    );
    const knownPeriods = useMemo(
        () => scenario.knownSeries.map((d) => d.period),
        [scenario]
    );

    const allValues = useMemo(
        () => [...scenario.knownSeries, ...scenario.futureSeries].map((d) => d.value),
        [scenario]
    );

    const yMin = useMemo(() => {
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const pad = (max - min) * 0.15 || 1;
        return Math.max(0, min - pad);
    }, [allValues]);

    const yMax = useMemo(() => {
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const pad = (max - min) * 0.15 || 1;
        return max + pad;
    }, [allValues]);

    // During draw phase, show only known periods on x-axis
    // (full axis appears on reveal)
    const visiblePeriods = phase === 'reveal' ? allPeriods : allPeriods;
    // Always use full x domain so drawn points map correctly
    const xScale = useMemo(
        () =>
            scalePoint<string>()
                .domain(allPeriods)
                .range([MARGIN.left, SVG_WIDTH - MARGIN.right])
                .padding(0.5),
        [allPeriods]
    );

    const yScale = useMemo(
        () =>
            scaleLinear()
                .domain([yMin, yMax])
                .range([SVG_HEIGHT - MARGIN.bottom, MARGIN.top]),
        [yMin, yMax]
    );

    // ── Path generators ───────────────────────────────────────────────────────

    const knownPath = useMemo(() => {
        const gen = d3Line<DataPoint>()
            .x((d) => xScale(d.period) ?? 0)
            .y((d) => yScale(d.value))
            .curve(d3.curveCatmullRom);
        return gen(scenario.knownSeries) ?? '';
    }, [scenario.knownSeries, xScale, yScale]);

    const futurePath = useMemo(() => {
        const gen = d3Line<DataPoint>()
            .x((d) => xScale(d.period) ?? 0)
            .y((d) => yScale(d.value))
            .curve(d3.curveCatmullRom);
        return gen(scenario.futureSeries) ?? '';
    }, [scenario.futureSeries, xScale, yScale]);

    // The user's drawn path — built from drawnPoints sorted by periodIndex
    const drawnPath = useMemo(() => {
        if (drawnPoints.length < 2) return '';
        const sorted = [...drawnPoints].sort((a, b) => a.periodIndex - b.periodIndex);

        // Connect the last known point to the first drawn point
        const lastKnown = scenario.knownSeries[scenario.knownSeries.length - 1];
        const anchorX = xScale(lastKnown.period) ?? 0;
        const anchorY = yScale(lastKnown.value);

        const points = sorted.map((pt) => {
            const period = scenario.futureSeries[pt.periodIndex]?.period;
            return { x: xScale(period ?? '') ?? 0, y: yScale(pt.value) };
        });

        const pathStr = [`M ${anchorX} ${anchorY}`]
            .concat(points.map((p) => `L ${p.x} ${p.y}`))
            .join(' ');
        return pathStr;
    }, [drawnPoints, scenario, xScale, yScale]);

    // ── Split line x-position ─────────────────────────────────────────────────
    const splitX = useMemo(() => {
        const lastKnown = scenario.knownSeries[scenario.knownSeries.length - 1];
        return xScale(lastKnown.period) ?? 0;
    }, [scenario, xScale]);

    // ── Gesture: translates Pan coordinates → data points ─────────────────────
    // The GestureDetector overlay covers ONLY the future half (x > splitX)
    // so the user can't accidentally "redraw" the known history.

    const lastIndexRef = useRef<number | null>(null);
    const lastValueRef = useRef<number | null>(null);

    const screenToData = useCallback(
        (screenX: number, screenY: number): { periodIndex: number; value: number } | null => {
            // screenX/screenY are relative to the GestureDetector overlay,
            // which is positioned at (0, 0) of the SVG container View.
            // Convert to SVG coordinate space first.
            const svgX = screenX;
            const svgY = screenY;

            // Clamp to future zone only
            if (svgX < splitX) return null;

            // Find closest future period by x position
            let closestIndex = 0;
            let closestDist = Infinity;
            scenario.futureSeries.forEach((pt, i) => {
                const px = xScale(pt.period) ?? 0;
                const dist = Math.abs(svgX - px);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = i;
                }
            });

            // Only snap if within half-step of a period column
            const step =
                (SVG_WIDTH - MARGIN.right - splitX) /
                Math.max(1, scenario.futureSeries.length - 1);
            if (closestDist > step * 0.75) return null;

            const value = Math.max(yMin, Math.min(yMax, yScale.invert(svgY)));
            return { periodIndex: closestIndex, value };
        },
        [scenario, splitX, xScale, yScale, yMin, yMax]
    );

    const updateDrawn = useCallback(
        (periodIndex: number, value: number) => {
            setDrawnPoints((prev) => {
                const next = prev.filter((p) => p.periodIndex !== periodIndex);
                // Linear interpolation to fill gaps on fast drags
                if (lastIndexRef.current !== null && lastValueRef.current !== null) {
                    const startIdx = Math.min(lastIndexRef.current, periodIndex);
                    const endIdx = Math.max(lastIndexRef.current, periodIndex);
                    if (endIdx - startIdx > 1) {
                        const startVal = lastIndexRef.current < periodIndex ? lastValueRef.current : value;
                        const endVal = lastIndexRef.current < periodIndex ? value : lastValueRef.current;
                        for (let i = startIdx + 1; i < endIdx; i++) {
                            const t = (i - startIdx) / (endIdx - startIdx);
                            const interp = startVal + t * (endVal - startVal);
                            next.push({ periodIndex: i, value: interp });
                        }
                    }
                }
                next.push({ periodIndex, value });
                return next;
            });
            lastIndexRef.current = periodIndex;
            lastValueRef.current = value;
        },
        []
    );

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .runOnJS(true)
                .onBegin((e) => {
                    lastIndexRef.current = null;
                    lastValueRef.current = null;
                    setHasStartedDrawing(true);
                    const pt = screenToData(e.x, e.y);
                    if (pt) updateDrawn(pt.periodIndex, pt.value);
                })
                .onUpdate((e) => {
                    const pt = screenToData(e.x, e.y);
                    if (pt) updateDrawn(pt.periodIndex, pt.value);
                })
                .onEnd(() => {
                    lastIndexRef.current = null;
                    lastValueRef.current = null;
                }),
        [screenToData, updateDrawn]
    );

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleReset = () => {
        setDrawnPoints([]);
        setHasStartedDrawing(false);
        lastIndexRef.current = null;
        lastValueRef.current = null;
    };

    const handleSubmit = () => {
        const result = scoreDrawing(scenario, drawnPoints);
        setScore(result);
        setPhase('submitted');
        // Brief pause before reveal so the transition feels intentional
        setTimeout(() => setPhase('reveal'), 400);
    };

    const handleNewScenario = () => {
        const next = getRandomScenario(scenario.id);
        setScenario(next);
        setPhase('draw');
        setDrawnPoints([]);
        setScore(null);
        setHasStartedDrawing(false);
        lastIndexRef.current = null;
    };

    const handleComplete = () => {
        onComplete?.({
            objectId: scenario.id,
            action: 'time_machine_complete',
            score: score!,
        });
        onClose();
    };

    // ── Progress: how many future periods have a drawn point ─────────────────
    const totalFuture = scenario.futureSeries.length;
    const drawnCount = drawnPoints.length;
    const progressPct = Math.min(100, Math.round((drawnCount / totalFuture) * 100));
    const isComplete = drawnCount >= totalFuture;

    // ── Y axis ticks ──────────────────────────────────────────────────────────
    const yTicks = yScale.ticks(5);

    // ── X axis labels — show known only until reveal ──────────────────────────
    const xLabels = phase === 'reveal' ? allPeriods : knownPeriods;
    const labelStride = Math.max(1, Math.ceil(xLabels.length / 6));

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View className="flex-1 bg-background">
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={phase !== 'draw' || !hasStartedDrawing}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    >
                        <View className="px-6 pt-14">
                            {/* ── Header ─────────────────────────────────── */}
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-row items-center gap-2.5">
                                    <View className="w-9 h-9 rounded-full items-center justify-center bg-dark">
                                        <Feather name="clock" size={15} color="#F7CE46" />
                                    </View>
                                    <Text className="text-[11px] font-sf-bold uppercase tracking-[0.12em] text-dark/40">
                                        The Time Machine
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="w-9 h-9 rounded-full bg-white border border-dark/10 items-center justify-center"
                                >
                                    <Feather name="x" size={16} color="#1A1A18" />
                                </TouchableOpacity>
                            </View>

                            {/* ── Scenario framing ───────────────────────── */}
                            <Animated.View entering={FadeInDown.delay(80)} className="mb-5">
                                <Text className="text-[11px] font-sf-bold uppercase tracking-[0.12em] text-dark/35 mb-1">
                                    {scenario.title}
                                </Text>
                                <Text className="text-[20px] font-sf-bold italic text-dark leading-snug">
                                    {scenario.claim}
                                </Text>
                            </Animated.View>

                            {/* ── Chart container ────────────────────────── */}
                            <Animated.View entering={FadeInDown.delay(160)} className="mb-3">
                                <View
                                    className="relative bg-white border border-dark/10 rounded-2xl overflow-hidden"
                                    style={{ height: SVG_HEIGHT }}
                                >
                                    {/* SVG chart — rendered below the gesture overlay */}
                                    <Svg
                                        width={SVG_WIDTH}
                                        height={SVG_HEIGHT}
                                        style={{ position: 'absolute', top: 0, left: 0 }}
                                    >
                                        {/* Y gridlines */}
                                        {yTicks.map((tick, i) => (
                                            <G key={`ygrid-${i}`}>
                                                <Line
                                                    x1={MARGIN.left}
                                                    x2={SVG_WIDTH - MARGIN.right}
                                                    y1={yScale(tick)}
                                                    y2={yScale(tick)}
                                                    stroke="#1A1A18"
                                                    strokeOpacity={0.06}
                                                    strokeDasharray="3 3"
                                                    strokeWidth={1}
                                                />
                                                <SvgText
                                                    x={MARGIN.left - 6}
                                                    y={yScale(tick)}
                                                    fontSize={9}
                                                    fill="#A6A398"
                                                    textAnchor="end"
                                                    dy="0.32em"
                                                    fontWeight="700"
                                                >
                                                    {tick % 1 === 0 ? tick : tick.toFixed(1)}
                                                </SvgText>
                                            </G>
                                        ))}

                                        {/* X axis labels */}
                                        {xLabels
                                            .filter((_, i) => i % labelStride === 0)
                                            .map((period) => (
                                                <SvgText
                                                    key={`xlabel-${period}`}
                                                    x={xScale(period) ?? 0}
                                                    y={SVG_HEIGHT - MARGIN.bottom + 18}
                                                    fontSize={9}
                                                    fill="#A6A398"
                                                    textAnchor="middle"
                                                    fontWeight="700"
                                                >
                                                    {period}
                                                </SvgText>
                                            ))}

                                        {/* Future zone background — greyed until reveal */}
                                        {phase !== 'reveal' && (
                                            <Rect
                                                x={splitX}
                                                y={MARGIN.top}
                                                width={SVG_WIDTH - MARGIN.right - splitX}
                                                height={INNER_H}
                                                fill="#1A1A18"
                                                fillOpacity={0.03}
                                            />
                                        )}

                                        {/* Split vertical line */}
                                        <Line
                                            x1={splitX}
                                            x2={splitX}
                                            y1={MARGIN.top}
                                            y2={SVG_HEIGHT - MARGIN.bottom}
                                            stroke="#1A1A18"
                                            strokeOpacity={0.2}
                                            strokeDasharray="4 3"
                                            strokeWidth={1.5}
                                        />
                                        {/* Split label pill */}
                                        <Rect
                                            x={splitX - 24}
                                            y={MARGIN.top - 14}
                                            width={48}
                                            height={14}
                                            rx={4}
                                            fill="#1A1A18"
                                            fillOpacity={0.12}
                                        />
                                        <SvgText
                                            x={splitX}
                                            y={MARGIN.top - 4}
                                            fontSize={8}
                                            fill="#1A1A18"
                                            fillOpacity={0.5}
                                            textAnchor="middle"
                                            fontWeight="700"
                                        >
                                            NOW →
                                        </SvgText>

                                        {/* Known series path */}
                                        {/* Outer stroke (dark, thin) for crispness */}
                                        <Path
                                            d={knownPath}
                                            stroke="#1A1A18"
                                            strokeWidth={3.5}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        {/* Inner yellow line */}
                                        <Path
                                            d={knownPath}
                                            stroke="#F7CE46"
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                            fill="none"
                                        />

                                        {/* Anchor dot at split point */}
                                        <Circle
                                            cx={splitX}
                                            cy={yScale(scenario.knownSeries[scenario.knownSeries.length - 1].value)}
                                            r={5}
                                            fill="#F7CE46"
                                            stroke="#1A1A18"
                                            strokeWidth={2}
                                        />

                                        {/* User drawn path */}
                                        {drawnPath.length > 0 && (
                                            <>
                                                <Path
                                                    d={drawnPath}
                                                    stroke="#1A1A18"
                                                    strokeWidth={3}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeDasharray="5 4"
                                                    fill="none"
                                                />
                                                <Path
                                                    d={drawnPath}
                                                    stroke="#5B8DB8"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeDasharray="5 4"
                                                    fill="none"
                                                />
                                            </>
                                        )}

                                        {/* Future (true) path — revealed after submit */}
                                        {phase === 'reveal' && (
                                            <>
                                                <Path
                                                    d={futurePath}
                                                    stroke="#1A1A18"
                                                    strokeWidth={3.5}
                                                    strokeLinecap="round"
                                                    fill="none"
                                                />
                                                <Path
                                                    d={futurePath}
                                                    stroke="#F7CE46"
                                                    strokeWidth={2.5}
                                                    strokeLinecap="round"
                                                    fill="none"
                                                />
                                                {/* Reveal dots on future points */}
                                                {scenario.futureSeries.map((pt) => (
                                                    <Circle
                                                        key={`revdot-${pt.period}`}
                                                        cx={xScale(pt.period) ?? 0}
                                                        cy={yScale(pt.value)}
                                                        r={4}
                                                        fill="#F7CE46"
                                                        stroke="#1A1A18"
                                                        strokeWidth={1.5}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </Svg>

                                    {/* ── Gesture overlay — sits above SVG ──
                                        Covers the full chart area. screenToData()
                                        internally restricts drawing to x > splitX,
                                        so taps on the known zone are safely ignored. */}
                                    {phase === 'draw' && (
                                        <GestureDetector gesture={panGesture}>
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: SVG_WIDTH,
                                                    height: SVG_HEIGHT,
                                                }}
                                            />
                                        </GestureDetector>
                                    )}
                                </View>

                                {/* Legend */}
                                <View className="flex-row gap-4 px-1 mt-2">
                                    <View className="flex-row items-center gap-1.5">
                                        <View className="w-3 h-1.5 rounded-full bg-primary" />
                                        <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.06em]">
                                            Known history
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5">
                                        <View className="w-3 h-1.5 rounded-full bg-[#5B8DB8]" style={{ borderStyle: 'dashed' }} />
                                        <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.06em]">
                                            Your prediction
                                        </Text>
                                    </View>
                                    {phase === 'reveal' && (
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="w-3 h-1.5 rounded-full bg-primary" />
                                            <Text className="text-[10px] font-sf-bold text-dark/40 uppercase tracking-[0.06em]">
                                                Reality
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>

                            {/* ── Draw phase: instruction + progress + controls */}
                            {phase === 'draw' && (
                                <Animated.View entering={FadeInDown.delay(240)}>
                                    {/* Instruction hint */}
                                    {!hasStartedDrawing && (
                                        <View className="bg-[#FCEFC4] rounded-2xl px-4 py-3.5 mb-4 flex-row items-center gap-3">
                                            <Feather name="edit-2" size={14} color="#B8941F" />
                                            <Text className="text-[12.5px] font-sf-regular text-[#6B5A12] flex-1 leading-relaxed">
                                                Draw on the grey area to the right of the dashed line — that's the future you're predicting.
                                            </Text>
                                        </View>
                                    )}

                                    {/* Progress bar */}
                                    {hasStartedDrawing && (
                                        <View className="mb-4">
                                            <View className="flex-row items-center justify-between mb-1.5">
                                                <Text className="text-[10px] font-sf-bold text-dark/35 uppercase tracking-[0.08em]">
                                                    Prediction coverage
                                                </Text>
                                                <Text className="text-[10px] font-sf-bold text-dark/50">
                                                    {progressPct}%
                                                </Text>
                                            </View>
                                            <View className="h-2 bg-dark/5 rounded-full overflow-hidden">
                                                <View
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {/* Controls */}
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={handleReset}
                                            activeOpacity={0.85}
                                            className="flex-1 flex-row items-center justify-center gap-2 py-3.5 bg-white border border-dark/10 rounded-[20px]"
                                        >
                                            <Feather name="rotate-ccw" size={14} color="#5F5E5A" />
                                            <Text className="text-[12px] font-sf-bold text-dark/50 uppercase tracking-[0.06em]">
                                                Reset
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={!isComplete}
                                            activeOpacity={0.9}
                                            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-[20px] ${isComplete ? 'bg-dark' : 'bg-dark/10'
                                                }`}
                                        >
                                            <Feather
                                                name="play"
                                                size={14}
                                                color={isComplete ? '#F7CE46' : '#A6A398'}
                                            />
                                            <Text
                                                className={`text-[12px] font-sf-bold uppercase tracking-[0.06em] ${isComplete ? 'text-primary' : 'text-dark/30'
                                                    }`}
                                            >
                                                {isComplete ? 'Reveal reality' : `Draw all ${totalFuture} points`}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}

                            {/* ── Reveal phase: score + explanation ─────────── */}
                            {phase === 'reveal' && score && (
                                <Animated.View entering={FadeInUp.delay(300)}>
                                    {/* Score card */}
                                    <View className="relative w-full mb-5">
                                        <View
                                            className="absolute inset-0 bg-dark rounded-[32px]"
                                            style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                                        />
                                        <View className="bg-white border-[1.5px] border-dark rounded-[32px] p-6 overflow-hidden">
                                            <View
                                                pointerEvents="none"
                                                style={{
                                                    position: 'absolute', top: -30, right: -24,
                                                    width: 110, height: 110, borderRadius: 55,
                                                    backgroundColor: '#F7CE46', opacity: 0.16,
                                                }}
                                            />
                                            <View className="flex-row items-center gap-3 mb-3">
                                                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                                                    <Feather
                                                        name={
                                                            score.verdict === 'oracle' || score.verdict === 'sharp'
                                                                ? 'sun'
                                                                : score.verdict === 'decent'
                                                                    ? 'trending-up'
                                                                    : 'map'
                                                        }
                                                        size={18}
                                                        color="#1A1A18"
                                                    />
                                                </View>
                                                <View>
                                                    <Text className="text-[18px] font-sf-bold italic text-dark leading-none">
                                                        {score.headline}
                                                    </Text>
                                                    <Text className="text-[11px] font-sf-regular text-dark/40 mt-0.5">
                                                        {score.meanAbsErrorPct}% mean error
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-[13px] font-sf-regular text-dark/60 leading-relaxed">
                                                {score.explanation}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Real story */}
                                    <View className="bg-[#FCEFC4] rounded-2xl p-5 mb-6">
                                        <Text className="text-[11px] font-sf-bold uppercase tracking-[0.1em] text-[#8A6B1A] mb-2">
                                            What actually happened
                                        </Text>
                                        <Text className="text-[13px] font-sf-regular text-[#5C4A12] leading-relaxed">
                                            {scenario.realStory}
                                        </Text>
                                        <Text className="text-[10px] font-sf-regular text-[#8A6B1A]/70 mt-2.5">
                                            Source: {scenario.sourceName}
                                        </Text>
                                    </View>

                                    {/* Action buttons */}
                                    <View className="flex-row gap-3">
                                        <TouchableOpacity
                                            onPress={handleNewScenario}
                                            activeOpacity={0.85}
                                            className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-white border border-dark/10 rounded-[24px]"
                                        >
                                            <Feather name="refresh-cw" size={14} color="#5F5E5A" />
                                            <Text className="text-[12px] font-sf-bold text-dark/50 uppercase tracking-[0.06em]">
                                                New scenario
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleComplete}
                                            activeOpacity={0.9}
                                            className="flex-1 py-4 bg-dark rounded-[24px] items-center"
                                        >
                                            <Text className="text-[12px] font-sf-bold text-primary uppercase tracking-[0.06em]">
                                                Done
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}