// ─── Shared envelope ────────────────────────────────────────
interface BaseScenario {
    id: string;
    weekNumber: number;         // determines weekly rotation
    title: string;
    prompt: string;             // what the user is asked BEFORE seeing data
    unit: string;
    realStory: string;          // the reveal text
    sourceName: string;
}

// ─── Per-tool payloads ──────────────────────────────────────

// Manipulation Studio — unchanged shape, aliased for clarity
export interface ManipulationPayload {
    tool: 'manipulation_studio';
    sourceChartId: string;
    targetClaim: string;
    seriesKey: string;
    apiData: {
        activeGeos: string[];
        activePeriods: string[];
        variableLabels: Record<string, string>;
        series: Record<string, { value: number }[]>;
    };
}

// Time Machine — periods unified to strings, split into known/future
export interface TimeMachinePayload {
    tool: 'time_machine';
    knownSeries: { period: string; value: number }[];
    futureSeries: { period: string; value: number }[];
}

// Confounder's Garden — aggregate + named subgroup splits
export interface ConfounderPayload {
    tool: 'confounders_garden';
    // What the user sees first: one number per group (e.g. men vs women)
    aggregateSeries: {
        groupLabel: string;   // e.g. "Men", "Women"
        value: number;        // e.g. 0.44 (acceptance rate)
    }[];
    // The confounder dimension (e.g. "Department")
    confounderLabel: string;
    // After reveal: each subgroup broken down by the confounder
    disaggregatedSeries: {
        confounderValue: string;  // e.g. "Engineering", "Law"
        groups: {
            groupLabel: string;
            value: number;
        }[];
        // optional weight so the paradox magnitude can be shown
        weight?: number;          // share of applicants in this subgroup
    }[];
    // Which groupLabel "wins" in aggregate but "loses" (or ties) when disaggregated
    // Used to auto-validate the user's answer
    misleadingWinner: string;
    correctAnswer: string;     // plain-language name of the confounder
}

// Future tools — placeholder payloads (same envelope, different tool key)
export interface BaseRatePayload { tool: 'base_rate_oracle'; prevalence: number; sensitivity: number; specificity: number; scenario: string; }
export interface HeadlinePayload { tool: 'headline_splitter'; relativeChange: number; absoluteChangeFrom: number; absoluteChangeTo: number; headlines: string[]; realHeadlineIndex: number; }
export interface SurvivorPayload { tool: 'survivorship_lens'; visibleSample: { label: string; value: number }[]; hiddenSample: { label: string; value: number }[]; hiddenLabel: string; }
export interface ScopeShiftPayload { tool: 'scope_shift'; aggregatePoints: { x: number; y: number; label: string }[]; individualPoints: { x: number; y: number }[]; }
export interface SamplePayload { tool: 'sample_inspector'; population: { label: string; value: number; inSample: boolean }[]; sampleMethods: string[]; }
export interface ControlPayload { tool: 'control_room'; interventionSeries: { period: string; value: number }[]; controlSeries: { period: string; value: number }[]; interventionPeriod: string; }

// ─── Discriminated union ─────────────────────────────────────
export type ToolPayload =
    | ManipulationPayload
    | TimeMachinePayload
    | ConfounderPayload
    | BaseRatePayload
    | HeadlinePayload
    | SurvivorPayload
    | ScopeShiftPayload
    | SamplePayload
    | ControlPayload;

export type ToolScenario = BaseScenario & ToolPayload;

// ─── Type guard helpers ──────────────────────────────────────
export const isConfounder = (s: ToolScenario): s is BaseScenario & ConfounderPayload =>
    s.tool === 'confounders_garden';

// ============================================================
//  CONFOUNDER'S GARDEN — SCENARIO LIBRARY
//  Each object is a complete ToolScenario<ConfounderPayload>.
//  Add new weeks by appending to this array.
// ============================================================

export const CONFOUNDER_SCENARIOS: (BaseScenario & ConfounderPayload)[] = [
    {
        id: 'berkeley-admissions-1973',
        weekNumber: 1,
        tool: 'confounders_garden',
        title: 'UC Berkeley graduate admissions, 1973',
        prompt:
            'Look at the overall acceptance rates for men and women. What do you conclude about the admissions process?',
        unit: '% accepted',
        confounderLabel: 'Department',
        aggregateSeries: [
            { groupLabel: 'Men', value: 44 },
            { groupLabel: 'Women', value: 35 },
        ],
        disaggregatedSeries: [
            {
                confounderValue: 'Engineering',
                weight: 0.38,
                groups: [
                    { groupLabel: 'Men', value: 62 },
                    { groupLabel: 'Women', value: 68 },
                ],
            },
            {
                confounderValue: 'Chemistry',
                weight: 0.22,
                groups: [
                    { groupLabel: 'Men', value: 55 },
                    { groupLabel: 'Women', value: 59 },
                ],
            },
            {
                confounderValue: 'Law',
                weight: 0.28,
                groups: [
                    { groupLabel: 'Men', value: 18 },
                    { groupLabel: 'Women', value: 20 },
                ],
            },
            {
                confounderValue: 'English',
                weight: 0.12,
                groups: [
                    { groupLabel: 'Men', value: 14 },
                    { groupLabel: 'Women', value: 15 },
                ],
            },
        ],
        misleadingWinner: 'Men',
        correctAnswer: 'Department selectivity',
        realStory:
            'Women were accepted at equal or higher rates in every single department. The paradox appeared because women disproportionately applied to Law and English — the most competitive departments overall. The confounder was department selectivity, not gender bias.',
        sourceName: 'Bickel et al., Science, 1975',
    },

    {
        id: 'kidney-stones-treatment',
        weekNumber: 2,
        tool: 'confounders_garden',
        title: 'Kidney stone treatments: A vs B',
        prompt:
            'Treatment A has a higher overall success rate than Treatment B. Which treatment would you recommend?',
        unit: '% success rate',
        confounderLabel: 'Stone size',
        aggregateSeries: [
            { groupLabel: 'Treatment A', value: 78 },
            { groupLabel: 'Treatment B', value: 83 },
        ],
        disaggregatedSeries: [
            {
                confounderValue: 'Small stones',
                weight: 0.51,
                groups: [
                    { groupLabel: 'Treatment A', value: 93 },
                    { groupLabel: 'Treatment B', value: 87 },
                ],
            },
            {
                confounderValue: 'Large stones',
                weight: 0.49,
                groups: [
                    { groupLabel: 'Treatment A', value: 73 },
                    { groupLabel: 'Treatment B', value: 69 },
                ],
            },
        ],
        misleadingWinner: 'Treatment B',
        correctAnswer: 'Kidney stone size',
        realStory:
            'Treatment A is superior for both small and large stones. Treatment B appeared better overall because it was predominantly used on small stones — the easier cases. Doctors assigned the harder cases to Treatment A, which dragged down its aggregate number. Stone size was the hidden confounder.',
        sourceName: 'Charig et al., British Medical Journal, 1986',
    },

    {
        id: 'covid-fatality-age',
        weekNumber: 3,
        tool: 'confounders_garden',
        title: 'Early COVID-19 fatality rates: Italy vs China',
        prompt:
            "Italy's early COVID fatality rate was dramatically higher than China's. What does this tell you about the virus or healthcare systems?",
        unit: '% fatality rate',
        confounderLabel: 'Age group of infected',
        aggregateSeries: [
            { groupLabel: 'Italy', value: 7.2 },
            { groupLabel: 'China', value: 2.3 },
        ],
        disaggregatedSeries: [
            {
                confounderValue: 'Under 60',
                weight: 0.41,
                groups: [
                    { groupLabel: 'Italy', value: 0.4 },
                    { groupLabel: 'China', value: 0.3 },
                ],
            },
            {
                confounderValue: '60–79',
                weight: 0.35,
                groups: [
                    { groupLabel: 'Italy', value: 12.8 },
                    { groupLabel: 'China', value: 11.9 },
                ],
            },
            {
                confounderValue: '80+',
                weight: 0.24,
                groups: [
                    { groupLabel: 'Italy', value: 29.1 },
                    { groupLabel: 'China', value: 27.8 },
                ],
            },
        ],
        misleadingWinner: 'China',
        correctAnswer: 'Age distribution of infected population',
        realStory:
            "Within every age group, fatality rates were nearly identical between Italy and China. The difference was demographic: Italy's outbreak spread heavily through an older population, while China's early cases skewed younger. The confounder was age distribution — not healthcare quality or virus strain.",
        sourceName: 'Dowd et al., PNAS, 2020',
    },

    {
        id: 'exercise-heart-attack',
        weekNumber: 4,
        tool: 'confounders_garden',
        title: 'Exercise habits and heart attack rates',
        prompt:
            'People who exercise more frequently appear in hospital cardiac wards at higher rates. Does exercise increase heart attack risk?',
        unit: 'hospital admissions per 1,000 people',
        confounderLabel: 'Baseline health status',
        aggregateSeries: [
            { groupLabel: 'High exercise', value: 8.4 },
            { groupLabel: 'Low exercise', value: 5.1 },
        ],
        disaggregatedSeries: [
            {
                confounderValue: 'Pre-existing condition',
                weight: 0.30,
                groups: [
                    { groupLabel: 'High exercise', value: 21.0 },
                    { groupLabel: 'Low exercise', value: 28.5 },
                ],
            },
            {
                confounderValue: 'No condition',
                weight: 0.70,
                groups: [
                    { groupLabel: 'High exercise', value: 2.1 },
                    { groupLabel: 'Low exercise', value: 3.8 },
                ],
            },
        ],
        misleadingWinner: 'Low exercise',
        correctAnswer: 'Pre-existing health conditions',
        realStory:
            'People with pre-existing cardiac conditions are prescribed more exercise by doctors — and they also end up in hospital more. Within both the healthy and the condition groups, exercise reduces cardiac events. The confounder was baseline health: sick people exercise more AND get hospitalized more, creating a false correlation in raw data.',
        sourceName: 'Illustrative of reverse causality confounding, based on observational study literature',
    },
];

// ============================================================
//  CONFOUNDERS GARDEN COMPONENT
// ============================================================

import { THEME_COLORS } from '@/constants/utilities';
import { postNewEvent } from '@/services/api';
import { useAuthFetch } from '@/services/useAuthFetch';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Phase machine ───────────────────────────────────────────
type Phase = 'commit' | 'reveal' | 'answer' | 'result';

// ─── Sub-components ──────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
    return (
        <Text style={{
            fontSize: 10, fontFamily: 'font-sf-bold', letterSpacing: 1.4,
            textTransform: 'uppercase', color: THEME_COLORS.grey, marginBottom: 10,
        }}>
            {children}
        </Text>
    );
}

function AggregateBar({
    label, value, unit, maxValue, highlight,
}: {
    label: string; value: number; unit: string; maxValue: number;
    highlight?: boolean;
}) {
    const pct = value / maxValue;
    return (
        <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 14, color: THEME_COLORS.dark }}>{label}</Text>
                <Text style={{ fontFamily: 'font-sf-bold', fontSize: 14, color: highlight ? THEME_COLORS.dark : THEME_COLORS.grey }}>
                    {value}{unit.includes('%') ? '%' : ` ${unit}`}
                </Text>
            </View>
            <View style={{ height: 10, backgroundColor: THEME_COLORS.background, borderRadius: 5, overflow: 'hidden' }}>
                <View style={{
                    width: `${pct * 100}%`, height: '100%', borderRadius: 5,
                    backgroundColor: highlight ? THEME_COLORS.primary : THEME_COLORS.dark,
                }} />
            </View>
        </View>
    );
}

function DisaggregatedBlock({
    item, groups, revealed,
}: {
    item: ConfounderPayload['disaggregatedSeries'][0];
    groups: string[];
    revealed: boolean;
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
        if (revealed) Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, [revealed]);

    const maxVal = Math.max(...item.groups.map(g => g.value));

    return (
        <Animated.View style={{ opacity, marginBottom: 20 }}>
            <View style={{
                backgroundColor: THEME_COLORS.background, borderRadius: 20, borderWidth: 0.5,
                borderColor: THEME_COLORS.dark, padding: 16,
                shadowColor: THEME_COLORS.dark,
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.06, shadowRadius: 0,
            }}>
                <Text style={{
                    fontFamily: 'font-sf-bold', fontSize: 11, color: THEME_COLORS.grey,
                    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
                }}>
                    {item.confounderValue}
                    {item.weight !== undefined ? ` · ${Math.round(item.weight * 100)}% of cases` : ''}
                </Text>
                {item.groups.map(g => (
                    <AggregateBar
                        key={g.groupLabel}
                        label={g.groupLabel}
                        value={g.value}
                        unit="%"
                        maxValue={maxVal * 1.2}
                        highlight={false}
                    />
                ))}
                {/* Show which group "wins" in this subgroup */}
                {(() => {
                    const winner = item.groups.reduce((a, b) => a.value > b.value ? a : b);
                    const loser = item.groups.find(g => g.groupLabel !== winner.groupLabel)!;
                    const diff = Math.abs(winner.value - loser.value).toFixed(1);
                    return (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', marginTop: 4,
                            backgroundColor: THEME_COLORS.marked, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                        }}>
                            <Feather name="arrow-up" size={12} color={THEME_COLORS.marked} />
                            <Text style={{ fontFamily: 'font-sf-regular', fontSize: 12, color: THEME_COLORS.marked, marginLeft: 5 }}>
                                {winner.groupLabel} leads by {diff}pp here
                            </Text>
                        </View>
                    );
                })()}
            </View>
        </Animated.View>
    );
}

// ─── Main component ──────────────────────────────────────────

interface ConfoundersGardenProps {
    scenario: BaseScenario & ConfounderPayload;
    onClose: () => void;
    onComplete: () => void;
}

export function ConfoundersGarden({ scenario, onClose, onComplete }: ConfoundersGardenProps) {
    const authFetch = useAuthFetch();
    const [phase, setPhase] = useState<Phase>('commit');
    const [commitment, setCommitment] = useState<string | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const maxAggregate = Math.max(...scenario.aggregateSeries.map(s => s.value)) * 1.3;

    function transition(next: Phase) {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setPhase(next), 180);
    }

    function handleCommit(label: string) {
        setCommitment(label);
        transition('reveal');
    }

    function handleCheckAnswer() {
        const correct =
            userAnswer.trim().toLowerCase().includes(
                scenario.correctAnswer.toLowerCase().split(' ')[0]
            ) ||
            scenario.disaggregatedSeries.some(d =>
                userAnswer.toLowerCase().includes(d.confounderValue.toLowerCase())
            );
        setAnswerCorrect(correct);
        transition('result');
        postNewEvent({
            objectId: scenario.id,
            action: 'confounders_garden_complete',
            result: {
                commitment,
                wasFlipped: commitment === scenario.misleadingWinner,
                userAnswer,
                correct,
                weekNumber: scenario.weekNumber,
            },
            authFetch,
        });
        setTimeout(onComplete, 4000);
    }

    return (
        <Modal transparent animationType="none" statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: THEME_COLORS.background }}>

                {/* ── Header ── */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Garden icon pill */}
                        <View style={{
                            backgroundColor: THEME_COLORS.dark, borderRadius: 20,
                            paddingHorizontal: 10, paddingVertical: 4,
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                        }}>
                            <Feather name="git-branch" size={11} color={THEME_COLORS.primary} />
                            <Text style={{ fontFamily: 'font-sf-bold', fontSize: 11, color: THEME_COLORS.primary, letterSpacing: 0.5 }}>
                                The Confounder's Garden
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: THEME_COLORS.background, borderRadius: 12,
                            paddingHorizontal: 8, paddingVertical: 3,
                        }}>
                            <Text style={{ fontFamily: 'font-sf-regular', fontSize: 11, color: THEME_COLORS.grey }}>
                                Week {scenario.weekNumber}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Feather name="x" size={20} color={THEME_COLORS.dark} />
                    </TouchableOpacity>
                </View>

                {/* ── Source tag ── */}
                <View style={{ paddingHorizontal: 20, marginBottom: 2 }}>
                    <Text style={{ fontFamily: 'font-sf-regular', fontSize: 11, color: THEME_COLORS.grey }}>
                        {scenario.sourceName}
                    </Text>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim }}>

                        {/* ── Title ── */}
                        <Text style={{
                            fontFamily: 'font-sf-bold', fontSize: 22, color: THEME_COLORS.dark,
                            fontStyle: 'italic', marginTop: 16, marginBottom: 20,
                            lineHeight: 28,
                        }}>
                            {scenario.title}
                        </Text>

                        {/* ══ PHASE: COMMIT ══════════════════════════════ */}
                        {phase === 'commit' && (
                            <>
                                {/* Prompt card */}
                                <View style={{
                                    backgroundColor: THEME_COLORS.dark, borderRadius: 28, padding: 20, marginBottom: 24,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    {/* Sun glow */}
                                    <View style={{
                                        position: 'absolute', top: -40, right: -40,
                                        width: 120, height: 120, borderRadius: 60,
                                        backgroundColor: THEME_COLORS.primary, opacity: 0.16,
                                    }} />
                                    <View style={{
                                        position: 'absolute', top: -24, right: -24,
                                        width: 80, height: 80, borderRadius: 40,
                                        backgroundColor: THEME_COLORS.primary, opacity: 0.22,
                                    }} />
                                    <Text style={{
                                        fontFamily: 'font-sf-regular', fontSize: 14, color: 'rgba(251,247,238,0.75)',
                                        fontStyle: 'italic', lineHeight: 21, marginBottom: 4,
                                    }}>
                                        {scenario.prompt}
                                    </Text>
                                </View>

                                {/* Aggregate bars */}
                                <SectionLabel>Overall data</SectionLabel>
                                <View style={{
                                    backgroundColor: THEME_COLORS.background, borderRadius: 24, borderWidth: 0.5,
                                    borderColor: THEME_COLORS.dark, padding: 20, marginBottom: 24,
                                    shadowColor: THEME_COLORS.dark,
                                    shadowOffset: { width: 5, height: 5 },
                                    shadowOpacity: 0.07, shadowRadius: 0,
                                }}>
                                    {scenario.aggregateSeries.map((s, i) => (
                                        <AggregateBar
                                            key={s.groupLabel}
                                            label={s.groupLabel}
                                            value={s.value}
                                            unit={scenario.unit}
                                            maxValue={maxAggregate}
                                            highlight={i === 0}
                                        />
                                    ))}
                                </View>

                                {/* Commit buttons */}
                                <SectionLabel>Your conclusion</SectionLabel>
                                <Text style={{
                                    fontFamily: 'font-sf-regular', fontSize: 13, color: THEME_COLORS.grey,
                                    fontStyle: 'italic', marginBottom: 14,
                                }}>
                                    Looking only at this data, which group has the advantage?
                                </Text>
                                <View style={{ gap: 10 }}>
                                    {scenario.aggregateSeries.map(s => (
                                        <TouchableOpacity
                                            key={s.groupLabel}
                                            onPress={() => handleCommit(s.groupLabel)}
                                            style={{
                                                backgroundColor: THEME_COLORS.background, borderRadius: 20, borderWidth: 0.5,
                                                borderColor: THEME_COLORS.dark, padding: 16,
                                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                                shadowColor: THEME_COLORS.dark,
                                                shadowOffset: { width: 4, height: 4 },
                                                shadowOpacity: 0.06, shadowRadius: 0,
                                            }}
                                        >
                                            <Text style={{ fontFamily: 'font-sf-bold', fontSize: 15, color: THEME_COLORS.dark }}>
                                                {s.groupLabel}
                                            </Text>
                                            <Feather name="arrow-right" size={16} color={THEME_COLORS.grey} />
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        onPress={() => handleCommit('Neither — the data is inconclusive')}
                                        style={{
                                            borderRadius: 20, borderWidth: 0.5, borderColor: THEME_COLORS.dark,
                                            padding: 16, alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'font-sf-regular', fontSize: 14, color: THEME_COLORS.grey, fontStyle: 'italic' }}>
                                            Neither — the data is inconclusive
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ══ PHASE: REVEAL ══════════════════════════════ */}
                        {phase === 'reveal' && (
                            <>
                                {/* Commitment echo */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 8,
                                    backgroundColor: commitment === scenario.misleadingWinner ? THEME_COLORS.error : THEME_COLORS.marked,
                                    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20,
                                }}>
                                    <Feather
                                        name={commitment === scenario.misleadingWinner ? 'alert-circle' : 'check-circle'}
                                        size={14}
                                        color={commitment === scenario.misleadingWinner ? THEME_COLORS.error : THEME_COLORS.marked}
                                    />
                                    <Text style={{
                                        fontFamily: 'font-sf-regular', fontSize: 13, fontStyle: 'italic',
                                        color: commitment === scenario.misleadingWinner ? THEME_COLORS.error : THEME_COLORS.marked,
                                    }}>
                                        You chose: {commitment}
                                        {commitment === scenario.misleadingWinner
                                            ? " · That's what the aggregate says. But look closer."
                                            : " · Cautious instinct. Now see why."}
                                    </Text>
                                </View>

                                {/* Confounder reveal label */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20,
                                }}>
                                    <View style={{ flex: 1, height: 0.5, backgroundColor: THEME_COLORS.dark }} />
                                    <View style={{
                                        backgroundColor: THEME_COLORS.primary, borderRadius: 12,
                                        paddingHorizontal: 12, paddingVertical: 5,
                                    }}>
                                        <Text style={{ fontFamily: 'font-sf-bold', fontSize: 11, color: THEME_COLORS.dark }}>
                                            Split by: {scenario.confounderLabel}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, height: 0.5, backgroundColor: THEME_COLORS.dark }} />
                                </View>

                                {/* Disaggregated blocks */}
                                <SectionLabel>The data, broken down</SectionLabel>
                                {scenario.disaggregatedSeries.map((item, i) => (
                                    <DisaggregatedBlock
                                        key={item.confounderValue}
                                        item={item}
                                        groups={scenario.aggregateSeries.map(s => s.groupLabel)}
                                        revealed={true}
                                    />
                                ))}

                                {/* CTA to answer phase */}
                                <TouchableOpacity
                                    onPress={() => transition('answer')}
                                    style={{
                                        backgroundColor: THEME_COLORS.dark, borderRadius: 24, padding: 18,
                                        alignItems: 'center', marginTop: 8,
                                    }}
                                >
                                    <Text style={{ fontFamily: 'font-sf-bold', fontSize: 15, color: THEME_COLORS.primary }}>
                                        Now explain it →
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ══ PHASE: ANSWER ══════════════════════════════ */}
                        {phase === 'answer' && (
                            <>
                                <View style={{
                                    backgroundColor: THEME_COLORS.dark, borderRadius: 28, padding: 20, marginBottom: 24,
                                }}>
                                    <Text style={{
                                        fontFamily: 'font-sf-regular', fontSize: 14, color: 'rgba(251,247,238,0.75)',
                                        fontStyle: 'italic', lineHeight: 21,
                                    }}>
                                        The result flipped when we split the data. In one sentence: what was the hidden variable that caused the reversal?
                                    </Text>
                                </View>

                                <TextInput
                                    value={userAnswer}
                                    onChangeText={setUserAnswer}
                                    placeholder={`Name the confounder (e.g. "${scenario.confounderLabel}")`}
                                    placeholderTextColor={THEME_COLORS.grey}
                                    multiline
                                    style={{
                                        backgroundColor: THEME_COLORS.background, borderRadius: 20, borderWidth: 0.5,
                                        borderColor: THEME_COLORS.dark, padding: 18,
                                        fontFamily: 'font-sf-regular', fontSize: 15, color: THEME_COLORS.dark,
                                        fontStyle: 'italic', minHeight: 90, marginBottom: 20,
                                        textAlignVertical: 'top',
                                    }}
                                />

                                <TouchableOpacity
                                    onPress={handleCheckAnswer}
                                    disabled={userAnswer.trim().length < 3}
                                    style={{
                                        backgroundColor: userAnswer.trim().length < 3 ? THEME_COLORS.background : THEME_COLORS.dark,
                                        borderRadius: 24, padding: 18, alignItems: 'center',
                                    }}
                                >
                                    <Text style={{
                                        fontFamily: 'font-sf-bold', fontSize: 15,
                                        color: userAnswer.trim().length < 3 ? THEME_COLORS.grey : THEME_COLORS.primary,
                                    }}>
                                        Commit answer
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ══ PHASE: RESULT ══════════════════════════════ */}
                        {phase === 'result' && (
                            <>
                                {/* Verdict */}
                                <View style={{
                                    backgroundColor: answerCorrect ? THEME_COLORS.marked : THEME_COLORS.background,
                                    borderRadius: 24, padding: 20, marginBottom: 20,
                                    borderWidth: answerCorrect ? 1.5 : 0.5,
                                    borderColor: answerCorrect ? THEME_COLORS.marked : THEME_COLORS.dark,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Feather
                                            name={answerCorrect ? 'check-circle' : 'circle'}
                                            size={16}
                                            color={answerCorrect ? THEME_COLORS.marked : THEME_COLORS.grey}
                                        />
                                        <Text style={{
                                            fontFamily: 'font-sf-bold', fontSize: 13,
                                            color: answerCorrect ? THEME_COLORS.marked : THEME_COLORS.grey,
                                            textTransform: 'uppercase', letterSpacing: 0.8,
                                        }}>
                                            {answerCorrect ? 'Good catch' : 'Worth remembering'}
                                        </Text>
                                    </View>
                                    <Text style={{
                                        fontFamily: 'font-sf-regular', fontSize: 14, color: THEME_COLORS.dark,
                                        fontStyle: 'italic', lineHeight: 21,
                                    }}>
                                        {scenario.realStory}
                                    </Text>
                                </View>

                                {/* The principle */}
                                <View style={{
                                    backgroundColor: THEME_COLORS.dark, borderRadius: 24, padding: 20,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <View style={{
                                        position: 'absolute', top: -30, right: -30, width: 90, height: 90,
                                        borderRadius: 45, backgroundColor: THEME_COLORS.primary, opacity: 0.14,
                                    }} />
                                    <Text style={{
                                        fontFamily: 'font-sf-bold', fontSize: 11, color: THEME_COLORS.primary,
                                        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
                                    }}>
                                        The pattern to carry forward
                                    </Text>
                                    <Text style={{
                                        fontFamily: 'font-sf-regular', fontSize: 14, color: 'rgba(251,247,238,0.80)',
                                        fontStyle: 'italic', lineHeight: 21,
                                    }}>
                                        Whenever a group comparison surprises you, ask: is there a third variable
                                        that determined who ended up in each group? That variable — not the groups
                                        themselves — may be the real story.
                                    </Text>
                                </View>
                            </>
                        )}

                    </Animated.View>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default ConfoundersGarden;