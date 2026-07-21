/**
 * ─────────────────────────────────────────────────────────────
 *  SUNFLOWER — THE SAMPLE INSPECTOR
 *  Tool 8 · Repeatable mechanic: drag-select a sample from a
 *  living particle field, then see how well it represents the
 *  true population. New scenario every week; same cognitive
 *  workout every time.
 *
 *  Phase machine:  intro → sampling → verdict → reveal
 *
 *  Animation arch: mirrors TerrainBuilder —
 *    · Single SharedValue<ParticleState[]> (no per-particle hooks)
 *    · useAnimatedProps on AnimatedCircle for SVG rendering
 *    · JS-thread interval drives Brownian motion updates
 *    · Gesture.Pan() (RNGH) for drag-select rectangle
 * ─────────────────────────────────────────────────────────────
 */

import { postNewEvent } from '@/services/api';
import { useAuthFetch } from '@/services/useAuthFetch';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    SharedValue,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';

// ─── Design tokens ────────────────────────────────────────────
const C = {
    cream: '#FBF7EE',
    dark: '#1A1A18',
    yellow: '#F7CE46',
    white: '#FFFFFF',
    muted: 'rgba(26,26,24,0.40)',
    subtle: 'rgba(26,26,24,0.08)',
    border: 'rgba(26,26,24,0.10)',
    green: '#3D6B4A',
    greenBg: '#E3EFE6',
    red: '#993C1D',
    redBg: '#FAECE7',
    blue: '#185FA5',
    blueBg: '#E6F1FB',
};

// ─── Canvas dimensions ────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_W = SCREEN_W - 40;
const CANVAS_H = CANVAS_W * 0.75;

// ─── Brownian motion config ───────────────────────────────────
const STEP = 1.8;   // px per tick
const TICK = 60;    // ms between updates
const DRIFT = 0.15;  // stratum-pull strength (gentle clustering)

// ─── Types ───────────────────────────────────────────────────
interface Stratum {
    id: string;
    label: string;
    color: string;        // particle fill
    trueShare: number;    // ground-truth population proportion 0-1
    clusterX: number;     // preferred x zone 0-1 (creates realistic clustering)
    clusterY: number;
}

interface Particle {
    id: number;
    stratumId: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface SelectionRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface SampleResult {
    total: number;
    byStratum: Record<string, number>;
    biasScore: number;       // 0 (perfectly representative) → 100 (completely biased)
    representativePct: number;
    worstStratum: string;
    bestStratum: string;
}

// ─── Scenario shape (extends BaseScenario from ToolScenario) ─
export interface SampleScenario {
    id: string;
    weekNumber: number;
    tool: 'sample_inspector';
    title: string;
    prompt: string;
    context: string;       // one-sentence world setup
    unit: string;          // what each particle is (e.g. "voter")
    strata: Stratum[];
    totalParticles: number;
    realStory: string;
    sourceName: string;
    // The key insight the user should walk away with
    principle: string;
}

// ─── Particle color palette (Sunflower ink palette mid-tones) ─
const STRATUM_COLORS = [
    '#F7CE46',  // yellow  — always the "you" group or most visible
    '#185FA5',  // blue
    '#3D6B4A',  // green
    '#993C1D',  // coral
    '#534AB7',  // violet
    '#B8941F',  // amber dark
];

// ─── Scenario library (3 initial scenarios) ───────────────────
export const SAMPLE_SCENARIOS: SampleScenario[] = [
    // ── Scenario 1: Literary Digest poll (convenience sampling) ──
    {
        id: 'literary-digest-1936',
        weekNumber: 1,
        tool: 'sample_inspector',
        title: '1936 US presidential poll',
        context: 'A magazine is polling voters by mailing questionnaires to telephone and car-registration lists.',
        prompt: 'Drag a box to select your sample of voters. Try to predict the election result.',
        unit: 'voter',
        strata: [
            {
                id: 'wealthy',
                label: 'Wealthy (phone/car owners)',
                color: STRATUM_COLORS[1],
                trueShare: 0.25,   // 25% of real electorate
                clusterX: 0.75,    // bunch on the right side of canvas
                clusterY: 0.30,
            },
            {
                id: 'working',
                label: 'Working class',
                color: STRATUM_COLORS[2],
                trueShare: 0.50,   // largest group
                clusterX: 0.35,
                clusterY: 0.65,
            },
            {
                id: 'rural',
                label: 'Rural (no phone/car)',
                color: STRATUM_COLORS[3],
                trueShare: 0.25,
                clusterX: 0.20,
                clusterY: 0.40,
            },
        ],
        totalParticles: 120,
        realStory:
            'The Digest sent 10 million questionnaires and got 2.4 million back — yet predicted the wrong winner by 20 points. Their list came from telephone directories and car registrations, oversampling the wealthy who favoured Landon. The working class and rural poor — who voted overwhelmingly for Roosevelt — were almost invisible in the sample.',
        sourceName: 'Squire (1988), Why the 1936 Literary Digest Poll Failed',
        principle: 'A large sample that is systematically drawn from the wrong pool is worse than a small random one. Size doesn\'t fix selection bias — it amplifies it.',
    },

    // ── Scenario 2: Voluntary response bias (internet poll) ──
    {
        id: 'voluntary-response-vaccine',
        weekNumber: 2,
        tool: 'sample_inspector',
        title: 'Online vaccine sentiment survey',
        context: 'A health website invites readers to complete an optional poll about vaccine confidence.',
        prompt: 'Drag a box to select who actually fills in the survey. Notice which groups self-select.',
        unit: 'reader',
        strata: [
            {
                id: 'strongly_against',
                label: 'Strongly opposed (highly motivated)',
                color: STRATUM_COLORS[3],
                trueShare: 0.10,
                clusterX: 0.80,   // concentrated — they always show up
                clusterY: 0.20,
            },
            {
                id: 'neutral',
                label: 'Neutral / mildly supportive',
                color: STRATUM_COLORS[2],
                trueShare: 0.60,  // majority but dispersed — unlikely to bother
                clusterX: 0.45,
                clusterY: 0.60,
            },
            {
                id: 'strongly_for',
                label: 'Strongly supportive (motivated)',
                color: STRATUM_COLORS[1],
                trueShare: 0.30,
                clusterX: 0.20,
                clusterY: 0.30,
            },
        ],
        totalParticles: 100,
        realStory:
            'Voluntary response polls systematically over-represent people with strong opinions — in either direction. The large, moderate middle, who would produce a boring but accurate result, rarely bother to respond. This is why online polls routinely produce headline-grabbing numbers that contradict rigorous surveys.',
        sourceName: 'Dillman et al., Internet, Phone, Mail and Mixed-Mode Surveys, 2014',
        principle: 'Voluntary samples measure enthusiasm for answering the survey, not the underlying attitude. The people most likely to respond are the least likely to be representative.',
    },

    // ── Scenario 3: Spatial/geographic sampling bias ──
    {
        id: 'street-interview-city',
        weekNumber: 3,
        tool: 'sample_inspector',
        title: 'City street interview study',
        context: 'Researchers interview pedestrians in the financial district to measure city-wide commute satisfaction.',
        prompt: 'Drag a box to sample from the street. See which residents are reachable at all.',
        unit: 'resident',
        strata: [
            {
                id: 'office_workers',
                label: 'Office workers (downtown)',
                color: STRATUM_COLORS[1],
                trueShare: 0.20,
                clusterX: 0.65,   // clustered downtown (right side)
                clusterY: 0.35,
            },
            {
                id: 'shift_workers',
                label: 'Shift workers (never downtown 9–5)',
                color: STRATUM_COLORS[3],
                trueShare: 0.30,
                clusterX: 0.20,   // spread to the left — periphery
                clusterY: 0.70,
            },
            {
                id: 'remote',
                label: 'Remote workers (rarely outside)',
                color: STRATUM_COLORS[2],
                trueShare: 0.25,
                clusterX: 0.40,
                clusterY: 0.25,
            },
            {
                id: 'elderly',
                label: 'Elderly / mobility-limited',
                color: STRATUM_COLORS[4],
                trueShare: 0.25,
                clusterX: 0.30,
                clusterY: 0.80,
            },
        ],
        totalParticles: 140,
        realStory:
            'Street interviews in a business district capture a self-selected, mobile, daytime population. Shift workers, remote employees, elderly residents, and anyone who travels through a different part of the city are structurally excluded. The resulting data describes the experience of people who happen to be downtown at 11 am — not the city.',
        sourceName: 'Groves et al., Survey Methodology, 2009',
        principle: 'Where and when you sample determines who you can reach. A geographically or temporally fixed sample can never represent a population that moves through different spaces at different times.',
    },
];

// ─── Particle initialiser ──────────────────────────────────────
function initParticles(scenario: SampleScenario): Particle[] {
    const particles: Particle[] = [];
    let id = 0;

    scenario.strata.forEach(stratum => {
        const count = Math.round(scenario.totalParticles * stratum.trueShare);
        for (let i = 0; i < count; i++) {
            // Spawn near the stratum cluster with Gaussian-ish spread
            const spread = 0.25;
            const x = Math.max(8, Math.min(CANVAS_W - 8,
                (stratum.clusterX + (Math.random() - 0.5) * spread) * CANVAS_W
            ));
            const y = Math.max(8, Math.min(CANVAS_H - 8,
                (stratum.clusterY + (Math.random() - 0.5) * spread) * CANVAS_H
            ));
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                id: id++,
                stratumId: stratum.id,
                x, y,
                vx: Math.cos(angle) * STEP,
                vy: Math.sin(angle) * STEP,
            });
        }
    });

    return particles;
}

// ─── Brownian step (pure function, runs in interval) ──────────
function stepParticles(
    prev: Particle[],
    scenario: SampleScenario,
): Particle[] {
    return prev.map(p => {
        const stratum = scenario.strata.find(s => s.id === p.stratumId)!;
        // Gentle drift toward cluster centre
        const driftX = (stratum.clusterX * CANVAS_W - p.x) * DRIFT * 0.02;
        const driftY = (stratum.clusterY * CANVAS_H - p.y) * DRIFT * 0.02;

        // Random walk + drift
        const angle = Math.random() * Math.PI * 2;
        let vx = p.vx * 0.8 + Math.cos(angle) * STEP * 0.6 + driftX;
        let vy = p.vy * 0.8 + Math.sin(angle) * STEP * 0.6 + driftY;

        // Speed cap
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > STEP * 1.5) { vx = (vx / speed) * STEP * 1.5; vy = (vy / speed) * STEP * 1.5; }

        // Bounce off walls
        let nx = p.x + vx;
        let ny = p.y + vy;
        if (nx < 8 || nx > CANVAS_W - 8) { vx = -vx; nx = Math.max(8, Math.min(CANVAS_W - 8, nx)); }
        if (ny < 8 || ny > CANVAS_H - 8) { vy = -vy; ny = Math.max(8, Math.min(CANVAS_H - 8, ny)); }

        return { ...p, x: nx, y: ny, vx, vy };
    });
}

// ─── Scoring ──────────────────────────────────────────────────
function scoreSelection(
    particles: Particle[],
    selected: Set<number>,
    scenario: SampleScenario,
): SampleResult | null {
    if (selected.size < 5) return null;

    const byStratum: Record<string, number> = {};
    scenario.strata.forEach(s => { byStratum[s.id] = 0; });
    selected.forEach(id => {
        const p = particles.find(p => p.id === id);
        if (p) byStratum[p.stratumId] = (byStratum[p.stratumId] || 0) + 1;
    });

    const total = selected.size;

    // Mean absolute deviation from true shares
    let totalDeviation = 0;
    let worstDev = 0, bestDev = Infinity;
    let worstStratum = '', bestStratum = '';

    scenario.strata.forEach(s => {
        const sampleShare = (byStratum[s.id] || 0) / total;
        const dev = Math.abs(sampleShare - s.trueShare);
        totalDeviation += dev;
        if (dev > worstDev) { worstDev = dev; worstStratum = s.label; }
        if (dev < bestDev) { bestDev = dev; bestStratum = s.label; }
    });

    const biasScore = Math.min(100, Math.round(totalDeviation * 200));
    const representativePct = Math.max(0, 100 - biasScore);

    return { total, byStratum, biasScore, representativePct, worstStratum, bestStratum };
}

// ─── Animated SVG circle (reads from SharedValue array by index) ─
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ParticleNode({
    index,
    positions,
    color,
    isSelected,
}: {
    index: number;
    positions: SharedValue<{ x: number; y: number }[]>;
    color: string;
    isSelected: boolean;
}) {
    const animProps = useAnimatedProps(() => {
        const p = positions.value[index];
        if (!p) return { cx: -100, cy: -100 };
        return { cx: p.x, cy: p.y };
    });

    return (
        <AnimatedCircle
            animatedProps={animProps}
            r={isSelected ? 7 : 5}
            fill={isSelected ? C.yellow : color}
            stroke={isSelected ? C.dark : 'rgba(26,26,24,0.20)'}
            strokeWidth={isSelected ? 1.5 : 0.5}
        />
    );
}

// ─── Selection rect (animated overlay) ───────────────────────
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function SelectionOverlay({
    rect,
}: {
    rect: SharedValue<SelectionRect | null>;
}) {
    const animProps = useAnimatedProps(() => {
        const r = rect.value;
        if (!r) return { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
        return {
            x: Math.min(r.x, r.x + r.w),
            y: Math.min(r.y, r.y + r.h),
            width: Math.abs(r.w),
            height: Math.abs(r.h),
            opacity: 0.9,
        };
    });

    return (
        <AnimatedRect
            animatedProps={animProps}
            fill="rgba(247,206,70,0.12)"
            stroke={C.yellow}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            rx={4}
        />
    );
}

// ─── Sub-components ───────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
    return (
        <Text style={{
            fontSize: 10, fontFamily: 'font-sf-bold', letterSpacing: 1.4,
            textTransform: 'uppercase', color: C.muted, marginBottom: 10,
        }}>
            {children}
        </Text>
    );
}

function StratumLegendRow({ stratum, samplePct, truePct, count }: {
    stratum: Stratum; samplePct: number; truePct: number; count: number;
}) {
    const deviation = Math.abs(samplePct - truePct);
    const overRep = samplePct > truePct + 0.05;
    const underRep = samplePct < truePct - 0.05;

    return (
        <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stratum.color }} />
                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 13, color: C.dark }}>{stratum.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {(overRep || underRep) && (
                        <View style={{
                            backgroundColor: overRep ? C.blueBg : C.redBg,
                            borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
                        }}>
                            <Text style={{
                                fontFamily: 'font-sf-bold', fontSize: 10,
                                color: overRep ? C.blue : C.red,
                            }}>
                                {overRep ? '↑ over' : '↓ under'}
                            </Text>
                        </View>
                    )}
                    <Text style={{ fontFamily: 'font-sf-regular', fontSize: 12, color: C.muted }}>
                        {count} ({Math.round(samplePct * 100)}% of sample · true {Math.round(truePct * 100)}%)
                    </Text>
                </View>
            </View>
            {/* Stacked bars: true share (background) vs sample share (foreground) */}
            <View style={{ height: 8, backgroundColor: C.subtle, borderRadius: 4, overflow: 'hidden' }}>
                {/* True share reference */}
                <View style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${truePct * 100}%`,
                    backgroundColor: 'rgba(26,26,24,0.12)', borderRadius: 4,
                }} />
                {/* Sample share */}
                <View style={{
                    width: `${samplePct * 100}%`, height: '100%', borderRadius: 4,
                    backgroundColor: stratum.color, opacity: 0.85,
                }} />
            </View>
        </View>
    );
}

// ─── Bias-o-meter ─────────────────────────────────────────────
function BiasOMeter({ score }: { score: number }) {
    const segments = [
        { label: 'Representative', range: [0, 25], color: C.green },
        { label: 'Mild bias', range: [25, 50], color: '#B8941F' },
        { label: 'Significant bias', range: [50, 75], color: C.red },
        { label: 'Severely biased', range: [75, 100], color: '#712B13' },
    ];
    const active = segments.find(s => score <= s.range[1]) || segments[3];

    return (
        <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 3, marginBottom: 8 }}>
                {segments.map(s => (
                    <View
                        key={s.label}
                        style={{
                            flex: 1, height: 8, borderRadius: 4,
                            backgroundColor: score >= s.range[0] && score <= s.range[1]
                                ? s.color
                                : 'rgba(26,26,24,0.08)',
                        }}
                    />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 13, color: active.color }}>
                    {active.label}
                </Text>
                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 22, color: C.dark }}>
                    {score}<Text style={{ fontSize: 13, color: C.muted }}>/100 bias</Text>
                </Text>
            </View>
        </View>
    );
}

// ─── Main component ───────────────────────────────────────────
type Phase = 'intro' | 'sampling' | 'verdict' | 'reveal';

interface SampleInspectorProps {
    scenario: SampleScenario;
    onClose: () => void;
    onComplete: () => void;
}

export function SampleInspector({ scenario, onClose, onComplete }: SampleInspectorProps) {
    const authFetch = useAuthFetch();
    const [phase, setPhase] = useState<Phase>('intro');
    const [result, setResult] = useState<SampleResult | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [particles, setParticles] = useState<Particle[]>([]);

    // Shared values for Reanimated
    const positions = useSharedValue<{ x: number; y: number }[]>([]);
    const selRect = useSharedValue<SelectionRect | null>(null);
    const canvasOpacity = useSharedValue(0);

    const particlesRef = useRef<Particle[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Initialise particles ──────────────────────────────────
    const startSimulation = useCallback(() => {
        const initial = initParticles(scenario);
        particlesRef.current = initial;
        positions.value = initial.map(p => ({ x: p.x, y: p.y }));
        setParticles(initial);
        canvasOpacity.value = withTiming(1, { duration: 600 });

        intervalRef.current = setInterval(() => {
            const next = stepParticles(particlesRef.current, scenario);
            particlesRef.current = next;
            positions.value = next.map(p => ({ x: p.x, y: p.y }));
        }, TICK);
    }, [scenario]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // ── Pan gesture for drag-select ───────────────────────────
    const dragStart = useSharedValue<{ x: number; y: number } | null>(null);

    const panGesture = Gesture.Pan()
        .onStart(e => {
            'worklet';
            dragStart.value = { x: e.x, y: e.y };
            selRect.value = { x: e.x, y: e.y, w: 0, h: 0 };
        })
        .onUpdate(e => {
            'worklet';
            if (!dragStart.value) return;
            selRect.value = {
                x: dragStart.value.x,
                y: dragStart.value.y,
                w: e.x - dragStart.value.x,
                h: e.y - dragStart.value.y,
            };
        })
        .onEnd(() => {
            'worklet';
            // Selection rect stays visible — JS thread will read it next tick
        });

    // ── Commit selection (JS thread) ──────────────────────────
    const commitSelection = useCallback(() => {
        const r = selRect.value;
        if (!r) return;

        const x1 = Math.min(r.x, r.x + r.w);
        const y1 = Math.min(r.y, r.y + r.h);
        const x2 = Math.max(r.x, r.x + r.w);
        const y2 = Math.max(r.y, r.y + r.h);

        const inside = new Set<number>();
        particlesRef.current.forEach(p => {
            if (p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2) {
                inside.add(p.id);
            }
        });

        setSelectedIds(inside);

        const scored = scoreSelection(particlesRef.current, inside, scenario);
        if (scored && scored.total >= 5) {
            setResult(scored);
            setPhase('verdict');
            // Clear rect
            selRect.value = null;
            // Stop simulation on verdict
            if (intervalRef.current) clearInterval(intervalRef.current);

            postNewEvent({
                objectId: scenario.id,
                action: 'sample_inspector_sampled',
                result: {
                    sampleSize: scored.total,
                    biasScore: scored.biasScore,
                    representativePct: scored.representativePct,
                    worstStratum: scored.worstStratum,
                    weekNumber: scenario.weekNumber,
                },
                authFetch,
            });
        }
    }, [scenario, authFetch]);

    const handleReveal = useCallback(() => {
        setPhase('reveal');
        postNewEvent({
            objectId: scenario.id,
            action: 'sample_inspector_complete',
            result: {
                biasScore: result?.biasScore,
                weekNumber: scenario.weekNumber,
            },
            authFetch,
        });
        setTimeout(onComplete, 5000);
    }, [result, scenario, authFetch, onComplete]);

    // ── Canvas opacity animated style ─────────────────────────
    const canvasAnimStyle = { opacity: canvasOpacity };

    return (
        <Modal transparent animationType="none" statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: C.cream }}>

                {/* ── Header ── */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                            backgroundColor: C.dark, borderRadius: 20,
                            paddingHorizontal: 10, paddingVertical: 4,
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                        }}>
                            <Feather name="filter" size={11} color={C.yellow} />
                            <Text style={{ fontFamily: 'font-sf-bold', fontSize: 11, color: C.yellow, letterSpacing: 0.5 }}>
                                The Sample Inspector
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: C.subtle, borderRadius: 12,
                            paddingHorizontal: 8, paddingVertical: 3,
                        }}>
                            <Text style={{ fontFamily: 'font-sf-regular', fontSize: 11, color: C.muted }}>
                                Week {scenario.weekNumber}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Feather name="x" size={20} color={C.dark} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={phase !== 'sampling'}
                >

                    {/* ── Title ── */}
                    <Text style={{
                        fontFamily: 'font-sf-bold', fontSize: 22, color: C.dark,
                        fontStyle: 'italic', marginTop: 8, marginBottom: 4, lineHeight: 28,
                    }}>
                        {scenario.title}
                    </Text>
                    <Text style={{
                        fontFamily: 'font-sf-regular', fontSize: 13, color: C.muted,
                        fontStyle: 'italic', marginBottom: 20,
                    }}>
                        {scenario.sourceName}
                    </Text>

                    {/* ══ PHASE: INTRO ═════════════════════════════ */}
                    {phase === 'intro' && (
                        <>
                            <View style={{
                                backgroundColor: C.dark, borderRadius: 28, padding: 20, marginBottom: 24,
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Sun glow */}
                                <View style={{
                                    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                                    borderRadius: 60, backgroundColor: C.yellow, opacity: 0.16,
                                }} />
                                <View style={{
                                    position: 'absolute', top: -24, right: -24, width: 80, height: 80,
                                    borderRadius: 40, backgroundColor: C.yellow, opacity: 0.22,
                                }} />
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 14,
                                    color: 'rgba(251,247,238,0.75)', fontStyle: 'italic', lineHeight: 22,
                                }}>
                                    {scenario.context}
                                </Text>
                                <Text style={{
                                    fontFamily: 'font-sf-bold', fontSize: 14,
                                    color: C.cream, marginTop: 12, lineHeight: 20,
                                }}>
                                    {scenario.prompt}
                                </Text>
                            </View>

                            {/* Legend */}
                            <SectionLabel>Who lives in this population</SectionLabel>
                            <View style={{
                                backgroundColor: C.white, borderRadius: 24, borderWidth: 0.5,
                                borderColor: C.border, padding: 20, marginBottom: 24,
                                shadowColor: C.dark, shadowOffset: { width: 5, height: 5 },
                                shadowOpacity: 0.06, shadowRadius: 0,
                            }}>
                                {scenario.strata.map(s => (
                                    <View key={s.id} style={{
                                        flexDirection: 'row', alignItems: 'center',
                                        justifyContent: 'space-between', marginBottom: 12,
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{
                                                width: 12, height: 12, borderRadius: 6,
                                                backgroundColor: s.color,
                                            }} />
                                            <Text style={{ fontFamily: 'font-sf-regular', fontSize: 13, color: C.dark }}>
                                                {s.label}
                                            </Text>
                                        </View>
                                        <Text style={{ fontFamily: 'font-sf-bold', fontSize: 13, color: C.muted }}>
                                            {Math.round(s.trueShare * 100)}%
                                        </Text>
                                    </View>
                                ))}
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 12,
                                    color: C.muted, fontStyle: 'italic', marginTop: 4,
                                }}>
                                    These percentages reflect the true population — you won't see them during sampling.
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setPhase('sampling');
                                    startSimulation();
                                }}
                                style={{
                                    backgroundColor: C.dark, borderRadius: 24, padding: 18,
                                    alignItems: 'center',
                                    shadowColor: C.dark,
                                    shadowOffset: { width: 6, height: 6 },
                                    shadowOpacity: 0.15, shadowRadius: 0,
                                }}
                            >
                                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 15, color: C.yellow }}>
                                    Start sampling →
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ══ PHASE: SAMPLING ══════════════════════════ */}
                    {phase === 'sampling' && (
                        <>
                            <Text style={{
                                fontFamily: 'font-sf-regular', fontSize: 13,
                                color: C.muted, fontStyle: 'italic', marginBottom: 14, lineHeight: 18,
                            }}>
                                Drag a rectangle across the field to select your sample.
                                Every dot is one {scenario.unit}.
                            </Text>

                            {/* Particle canvas */}
                            <Animated.View style={[{
                                width: CANVAS_W, height: CANVAS_H,
                                backgroundColor: C.white,
                                borderRadius: 24, borderWidth: 0.5,
                                borderColor: C.border, overflow: 'hidden',
                                marginBottom: 16,
                            }, canvasAnimStyle]}>
                                <GestureDetector gesture={panGesture}>
                                    <View style={{ flex: 1 }}>
                                        <Svg width={CANVAS_W} height={CANVAS_H}>
                                            {/* Particles */}
                                            {particles.map((p, i) => {
                                                const stratum = scenario.strata.find(s => s.id === p.stratumId)!;
                                                return (
                                                    <ParticleNode
                                                        key={p.id}
                                                        index={i}
                                                        positions={positions}
                                                        color={stratum.color}
                                                        isSelected={selectedIds.has(p.id)}
                                                    />
                                                );
                                            })}
                                            {/* Selection rect overlay */}
                                            <SelectionOverlay rect={selRect} />
                                        </Svg>
                                    </View>
                                </GestureDetector>
                            </Animated.View>

                            {/* Legend dots */}
                            <View style={{
                                flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
                            }}>
                                {scenario.strata.map(s => (
                                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                                        <Text style={{ fontFamily: 'font-sf-regular', fontSize: 11, color: C.muted }}>
                                            {s.label}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Commit button */}
                            <TouchableOpacity
                                onPress={commitSelection}
                                style={{
                                    backgroundColor: C.yellow, borderRadius: 24, padding: 18,
                                    alignItems: 'center',
                                    shadowColor: C.dark,
                                    shadowOffset: { width: 6, height: 6 },
                                    shadowOpacity: 0.12, shadowRadius: 0,
                                }}
                            >
                                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 15, color: C.dark }}>
                                    This is my sample — analyse it
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ══ PHASE: VERDICT ════════════════════════════ */}
                    {phase === 'verdict' && result && (
                        <>
                            {/* Sample size pill */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                marginBottom: 20,
                            }}>
                                <View style={{
                                    backgroundColor: C.dark, borderRadius: 14,
                                    paddingHorizontal: 12, paddingVertical: 6,
                                }}>
                                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 12, color: C.yellow }}>
                                        {result.total} {scenario.unit}s selected
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: 'font-sf-regular', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
                                    out of {particles.length} in population
                                </Text>
                            </View>

                            {/* Bias-o-meter */}
                            <SectionLabel>How representative is your sample?</SectionLabel>
                            <View style={{
                                backgroundColor: C.white, borderRadius: 24, borderWidth: 0.5,
                                borderColor: C.border, padding: 20, marginBottom: 20,
                                shadowColor: C.dark, shadowOffset: { width: 5, height: 5 },
                                shadowOpacity: 0.06, shadowRadius: 0,
                            }}>
                                <BiasOMeter score={result.biasScore} />
                            </View>

                            {/* Per-stratum breakdown */}
                            <SectionLabel>Who you actually sampled</SectionLabel>
                            <View style={{
                                backgroundColor: C.white, borderRadius: 24, borderWidth: 0.5,
                                borderColor: C.border, padding: 20, marginBottom: 20,
                                shadowColor: C.dark, shadowOffset: { width: 5, height: 5 },
                                shadowOpacity: 0.06, shadowRadius: 0,
                            }}>
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 12,
                                    color: C.muted, fontStyle: 'italic', marginBottom: 14,
                                }}>
                                    Coloured bar = your sample share · grey band = true population share
                                </Text>
                                {scenario.strata.map(s => {
                                    const count = result.byStratum[s.id] || 0;
                                    return (
                                        <StratumLegendRow
                                            key={s.id}
                                            stratum={s}
                                            samplePct={count / result.total}
                                            truePct={s.trueShare}
                                            count={count}
                                        />
                                    );
                                })}
                            </View>

                            {/* Worst/best callouts */}
                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                                <View style={{
                                    flex: 1, backgroundColor: C.redBg, borderRadius: 20, padding: 14,
                                }}>
                                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 10, color: C.red, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                                        Most underrepresented
                                    </Text>
                                    <Text style={{ fontFamily: 'font-sf-regular', fontSize: 13, color: C.red, fontStyle: 'italic' }}>
                                        {result.worstStratum}
                                    </Text>
                                </View>
                                <View style={{
                                    flex: 1, backgroundColor: C.greenBg, borderRadius: 20, padding: 14,
                                }}>
                                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 10, color: C.green, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
                                        Closest to true share
                                    </Text>
                                    <Text style={{ fontFamily: 'font-sf-regular', fontSize: 13, color: C.green, fontStyle: 'italic' }}>
                                        {result.bestStratum}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleReveal}
                                style={{
                                    backgroundColor: C.dark, borderRadius: 24, padding: 18,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 15, color: C.yellow }}>
                                    What really happened →
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ══ PHASE: REVEAL ════════════════════════════ */}
                    {phase === 'reveal' && (
                        <>
                            {/* Real story card */}
                            <View style={{
                                backgroundColor: C.dark, borderRadius: 28, padding: 22,
                                position: 'relative', overflow: 'hidden', marginBottom: 20,
                            }}>
                                <View style={{
                                    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                                    borderRadius: 60, backgroundColor: C.yellow, opacity: 0.14,
                                }} />
                                <Text style={{
                                    fontFamily: 'font-sf-bold', fontSize: 11, color: C.yellow,
                                    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
                                }}>
                                    What actually happened
                                </Text>
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 14,
                                    color: 'rgba(251,247,238,0.82)', fontStyle: 'italic', lineHeight: 22,
                                }}>
                                    {scenario.realStory}
                                </Text>
                            </View>

                            {/* Principle card */}
                            <View style={{
                                backgroundColor: C.white, borderRadius: 24,
                                borderWidth: 1.5, borderColor: C.dark,
                                padding: 20, marginBottom: 20,
                                shadowColor: C.dark,
                                shadowOffset: { width: 6, height: 6 },
                                shadowOpacity: 0.10, shadowRadius: 0,
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {/* Yellow left accent strip */}
                                <View style={{
                                    position: 'absolute', left: 0, top: '16%', bottom: '16%',
                                    width: 4, backgroundColor: C.yellow,
                                }} />
                                <Text style={{
                                    fontFamily: 'font-sf-bold', fontSize: 11, color: C.muted,
                                    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
                                }}>
                                    The pattern to carry forward
                                </Text>
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 14,
                                    color: C.dark, fontStyle: 'italic', lineHeight: 22,
                                }}>
                                    {scenario.principle}
                                </Text>
                            </View>

                            {/* Personal score recap */}
                            {result && (
                                <View style={{
                                    backgroundColor: C.subtle, borderRadius: 20, padding: 16,
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <Text style={{ fontFamily: 'font-sf-regular', fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
                                        Your sample's representativeness
                                    </Text>
                                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 20, color: C.dark }}>
                                        {result.representativePct}
                                        <Text style={{ fontSize: 13, color: C.muted }}>%</Text>
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                </ScrollView>
            </View>
        </Modal>
    );
}

export default SampleInspector;