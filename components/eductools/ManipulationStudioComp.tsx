import { CHART_REGISTRY } from '@/constants/charts'; // adjust path to match your project
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';


// ─── Manipulator's Studio — core types and scoring engine ──────────────────
export const TECHNIQUES: Record<ManipulationTechniqueId, TechniqueDef> = {
    truncateAxis: {
        id: 'truncateAxis',
        label: 'Truncate the axis',
        shortHint: 'Raise the Y-axis floor to exaggerate the slope',
        credibilityCostPerNotch: 6,
    },
    cherryPickRange: {
        id: 'cherryPickRange',
        label: 'Cherry-pick the range',
        shortHint: 'Narrow the date window to the steepest stretch',
        credibilityCostPerNotch: 7,
    },
    absoluteVsPercent: {
        id: 'absoluteVsPercent',
        label: 'Switch units',
        shortHint: 'Swap between absolute counts and percentage change',
        credibilityCostPerNotch: 5,
    },
    missingDenominator: {
        id: 'missingDenominator',
        label: 'Drop the denominator',
        shortHint: 'Show the raw change, hide the base rate it came from',
        credibilityCostPerNotch: 8,
    },
    smoothing: {
        id: 'smoothing',
        label: 'Smooth the noise',
        shortHint: 'Apply heavy smoothing to hide real volatility',
        credibilityCostPerNotch: 4,
    },
};

export const INITIAL_MANIPULATION_STATE: ManipulationState = {
    truncateAxis: 0,
    cherryPickRange: 0,
    absoluteVsPercent: 'absolute',
    missingDenominator: false,
    smoothing: 0,
};

// ─── Applying manipulation to real ApiResponse data ─────────────────────────

function applyCherryPick(data: ChartApiData, notch: number): ChartApiData {
    if (notch === 0) return data;
    const fractionToKeep = [1, 0.65, 0.45, 0.25][Math.min(notch, 3)];
    const total = data.activePeriods.length;
    const keepFrom = Math.floor(total * (1 - fractionToKeep));

    const newSeries: ChartApiData['series'] = {};
    for (const key of Object.keys(data.series)) {
        newSeries[key] = data.series[key].slice(keepFrom);
    }

    return {
        ...data,
        activePeriods: data.activePeriods.slice(keepFrom),
        series: newSeries,
    };
}

function applySmoothing(data: ChartApiData, notch: number): ChartApiData {
    if (notch === 0) return data;
    const window = [1, 2, 3, 5][Math.min(notch, 3)];

    const newSeries: ChartApiData['series'] = {};
    for (const key of Object.keys(data.series)) {
        const points = data.series[key];
        newSeries[key] = points.map((point, i) => {
            const start = Math.max(0, i - window);
            const end = Math.min(points.length, i + window + 1);
            const slice = points.slice(start, end);
            const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
            return { value: avg };
        });
    }

    return { ...data, series: newSeries };
}

function applyPercentMode(
    data: ChartApiData,
    seriesKey: string,
    mode: ManipulationState['absoluteVsPercent']
): ChartApiData {
    if (mode === 'absolute') return data;
    const points = data.series[seriesKey];
    if (!points || points.length === 0) return data;

    const base = points[0].value;
    const rescaled = points.map((p) => ({
        value: base === 0 ? 0 : ((p.value - base) / base) * 100,
    }));

    return {
        ...data,
        series: { ...data.series, [seriesKey]: rescaled },
    };
}

/**
 * Applies the full manipulation pipeline to a scenario's real apiData,
 * producing a new ChartApiData object suitable for handing directly to
 * a CHART_REGISTRY component (e.g. <SunLineChart apiData={...} />).
 * truncateAxis and dualAxisScale are NOT data transforms — they're
 * rendering-level axis-domain concerns, surfaced via getAxisOverride.
 */
export function applyManipulation(scenario: ManipulatorScenario, state: ManipulationState): ChartApiData {
    let data = scenario.apiData;
    data = applyCherryPick(data, state.cherryPickRange);
    data = applySmoothing(data, state.smoothing);
    data = applyPercentMode(data, scenario.seriesKey, state.absoluteVsPercent);
    return data;
}

/**
 * Truncate-axis is a rendering concern. Returns an axis domain hint;
 * wire to whatever prop SunLineChart actually exposes for an explicit
 * Y domain (e.g. yDomain / axisMin+axisMax) at the call site.
 */
export function getAxisOverride(
    scenario: ManipulatorScenario,
    state: ManipulationState
): { yMin?: number; yMax?: number } {
    if (state.truncateAxis === 0) return {};

    const points = scenario.apiData.series[scenario.seriesKey] ?? [];
    const values = points.map((p) => p.value);
    if (values.length === 0) return {};

    const realMin = Math.min(...values);
    const realMax = Math.max(...values);
    const range = realMax - realMin || 1;
    const paddedMin = realMin - range * 0.15;

    const truncateFraction = [0, 0.35, 0.65, 0.88][Math.min(state.truncateAxis, 3)];
    const truncatedMin = paddedMin + (realMin - paddedMin) * truncateFraction;

    return { yMin: truncatedMin, yMax: realMax + range * 0.15 };
}

// ─── Credibility scoring ────────────────────────────────────────────────────

export interface ManipulationResult {
    activeTechniqueCount: number;
    persuasiveness: number;
    credibility: number;
    overallScore: number;
    verdict: 'subtle' | 'heavy-handed' | 'unconvincing';
}

function countActiveTechniques(state: ManipulationState): number {
    let count = 0;
    if (state.truncateAxis > 0) count++;
    if (state.cherryPickRange > 0) count++;
    if (state.absoluteVsPercent === 'percent') count++;
    if (state.missingDenominator) count++;
    if (state.smoothing > 0) count++;
    return count;
}

export function scoreManipulation(state: ManipulationState): ManipulationResult {
    const activeTechniqueCount = countActiveTechniques(state);

    const notchSum =
        state.truncateAxis +
        state.cherryPickRange +
        (state.absoluteVsPercent === 'percent' ? 2 : 0) +
        (state.missingDenominator ? 2 : 0) +
        state.smoothing;
    const persuasiveness = Math.min(100, Math.round(notchSum * 9));

    const costs = [
        state.truncateAxis * TECHNIQUES.truncateAxis.credibilityCostPerNotch,
        state.cherryPickRange * TECHNIQUES.cherryPickRange.credibilityCostPerNotch,
        state.absoluteVsPercent === 'percent' ? TECHNIQUES.absoluteVsPercent.credibilityCostPerNotch : 0,
        state.missingDenominator ? TECHNIQUES.missingDenominator.credibilityCostPerNotch : 0,
        state.smoothing * TECHNIQUES.smoothing.credibilityCostPerNotch,
    ];
    let credibilityCost = costs.reduce((a, b) => a + b, 0);

    if (activeTechniqueCount >= 3) {
        credibilityCost *= 1 + (activeTechniqueCount - 2) * 0.35;
    }

    const credibility = Math.max(0, Math.round(100 - credibilityCost));
    const overallScore = Math.round((persuasiveness * credibility) / 100);

    let verdict: ManipulationResult['verdict'] = 'unconvincing';
    if (overallScore >= 55) verdict = 'subtle';
    else if (persuasiveness >= 50 && credibility < 40) verdict = 'heavy-handed';

    return { activeTechniqueCount, persuasiveness, credibility, overallScore, verdict };
}

// ─── Completion payload ─────────────────────────────────────────────────────

export interface ManipulatorCompletionEvent {
    objectId: string;
    action: 'manipulator_round_complete';
    result: ManipulationResult;
    techniquesUsed: ManipulationTechniqueId[];
}

export function buildCompletionEvent(
    scenario: ManipulatorScenario,
    state: ManipulationState,
    result: ManipulationResult
): ManipulatorCompletionEvent {
    const techniquesUsed: ManipulationTechniqueId[] = [];
    if (state.truncateAxis > 0) techniquesUsed.push('truncateAxis');
    if (state.cherryPickRange > 0) techniquesUsed.push('cherryPickRange');
    if (state.absoluteVsPercent === 'percent') techniquesUsed.push('absoluteVsPercent');
    if (state.missingDenominator) techniquesUsed.push('missingDenominator');
    if (state.smoothing > 0) techniquesUsed.push('smoothing');

    return {
        objectId: scenario.id,
        action: 'manipulator_round_complete',
        result,
        techniquesUsed,
    };
}

// ─── Curated scenarios ───────────────────────────────────────────────────
export const MANIPULATOR_SCENARIOS: ManipulatorScenario[] = [
    {
        id: 'crime-reports-eu',
        sourceChartId: 'eurostat-crime-2024',
        title: 'Reported incidents per 100,000 people, 2010–2024',
        targetClaim: 'Crime is rising fast',
        unit: 'incidents',
        seriesKey: 'value_EU',
        apiData: {
            activeGeos: ['EU'],
            activePeriods: [
                '2010', '2011', '2012', '2013', '2014', '2015', '2016',
                '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024',
            ],
            variableLabels: { value: 'Reported incidents per 100k' },
            series: {
                value_EU: [
                    { value: 412 }, { value: 408 }, { value: 415 }, { value: 401 },
                    { value: 398 }, { value: 405 }, { value: 399 }, { value: 403 },
                    { value: 397 }, { value: 394 }, { value: 376 }, { value: 381 },
                    { value: 392 }, { value: 406 }, { value: 414 },
                ],
            },
        },
        realStory:
            'Across 14 years the rate moved in a narrow band, dipped during 2020, and has only just returned to its 2010 level — there is no long-run upward trend.',
        sourceName: 'Eurostat crime statistics, 2024',
    },
    {
        id: 'vaccine-side-effects',
        sourceChartId: 'health-vaers-2023',
        title: 'Reported adverse events per million doses, 2018–2023',
        targetClaim: 'This treatment is becoming more dangerous',
        unit: 'events',
        seriesKey: 'value_NAT',
        apiData: {
            activeGeos: ['NAT'],
            activePeriods: ['2018', '2019', '2020', '2021', '2022', '2023'],
            variableLabels: { value: 'Adverse events per million doses' },
            series: {
                value_NAT: [
                    { value: 3.1 }, { value: 2.9 }, { value: 3.4 },
                    { value: 5.2 }, { value: 3.8 }, { value: 3.0 },
                ],
            },
        },
        realStory:
            'The 2021 spike coincided with a one-time change in reporting requirements, not a rise in actual events — by 2023 the rate is back to its historical baseline.',
        sourceName: 'National health surveillance registry, 2023',
    },
    {
        id: 'company-emissions',
        sourceChartId: 'climate-corp-emissions-2024',
        title: "A manufacturer's total CO₂ emissions, 2016–2024",
        targetClaim: 'This company has barely reduced emissions',
        unit: 'tonnes CO₂',
        seriesKey: 'value_CORP',
        apiData: {
            activeGeos: ['CORP'],
            activePeriods: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
            variableLabels: { value: 'Total CO₂ emissions (tonnes)' },
            series: {
                value_CORP: [
                    { value: 980000 }, { value: 940000 }, { value: 905000 },
                    { value: 860000 }, { value: 690000 }, { value: 720000 },
                    { value: 640000 }, { value: 590000 }, { value: 540000 },
                ],
            },
        },
        realStory:
            'Total emissions fell by nearly 45% over eight years, even after accounting for the 2020 dip and partial 2021 rebound — a real, sustained reduction.',
        sourceName: 'Corporate sustainability disclosure, 2024',
    },
];

export function getScenarioById(id: string): ManipulatorScenario | undefined {
    return MANIPULATOR_SCENARIOS.find((s) => s.id === id);
}

export function getRandomScenario(excludeId?: string): ManipulatorScenario {
    const pool = excludeId
        ? MANIPULATOR_SCENARIOS.filter((s) => s.id !== excludeId)
        : MANIPULATOR_SCENARIOS;
    return pool[Math.floor(Math.random() * pool.length)];
}



interface TechniqueControlsProps {
    state: ManipulationState;
    onChange: (next: ManipulationState) => void;
}

// ─── Notch stepper (used for the four 0-3 scale techniques) ────────────────
function NotchStepper({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <View className="mb-5">
            <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[13px] font-sf-bold text-dark">{label}</Text>
                <Text className="text-[11px] font-sf-bold text-dark/35">
                    {value === 0 ? 'Off' : `Level ${value}`}
                </Text>
            </View>
            <Text className="text-[11px] font-sf-regular text-dark/45 mb-2.5 leading-snug">
                {hint}
            </Text>
            <View className="flex-row gap-1.5">
                {[0, 1, 2, 3].map((notch) => {
                    const active = notch <= value;
                    const isCurrentMax = notch === value;
                    return (
                        <TouchableOpacity
                            key={notch}
                            activeOpacity={0.8}
                            onPress={() => onChange(notch)}
                            className="flex-1 h-9 rounded-xl items-center justify-center"
                            style={{
                                backgroundColor: notch === 0
                                    ? '#FFFFFF'
                                    : active
                                        ? (isCurrentMax ? '#1A1A18' : '#E9E6DC')
                                        : '#FFFFFF',
                                borderWidth: notch === 0 ? 1 : active ? 0 : 1,
                                borderColor: '#E4DFCF',
                            }}
                        >
                            {notch === 0 && (
                                <Feather name="slash" size={12} color="#A6A398" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Toggle row (used for the two binary techniques) ────────────────────────
function ToggleRow({
    label,
    hint,
    active,
    onToggle,
}: {
    label: string;
    hint: string;
    active: boolean;
    onToggle: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onToggle}
            className="flex-row items-center justify-between mb-5 bg-white border border-dark/10 rounded-2xl px-4 py-3.5"
        >
            <View className="flex-1 pr-3">
                <Text className="text-[13px] font-sf-bold text-dark mb-1">{label}</Text>
                <Text className="text-[11px] font-sf-regular text-dark/45 leading-snug">{hint}</Text>
            </View>
            <View
                className="w-11 h-6 rounded-full justify-center px-0.5"
                style={{ backgroundColor: active ? '#1A1A18' : '#E9E6DC' }}
            >
                <View
                    className="w-5 h-5 rounded-full bg-white"
                    style={{ transform: [{ translateX: active ? 20 : 0 }] }}
                />
            </View>
        </TouchableOpacity>
    );
}

export function TechniqueControls({ state, onChange }: TechniqueControlsProps) {
    return (
        <View>
            <NotchStepper
                label={TECHNIQUES.truncateAxis.label}
                hint={TECHNIQUES.truncateAxis.shortHint}
                value={state.truncateAxis}
                onChange={(v) => onChange({ ...state, truncateAxis: v })}
            />

            <NotchStepper
                label={TECHNIQUES.cherryPickRange.label}
                hint={TECHNIQUES.cherryPickRange.shortHint}
                value={state.cherryPickRange}
                onChange={(v) => onChange({ ...state, cherryPickRange: v })}
            />

            <NotchStepper
                label={TECHNIQUES.smoothing.label}
                hint={TECHNIQUES.smoothing.shortHint}
                value={state.smoothing}
                onChange={(v) => onChange({ ...state, smoothing: v })}
            />

            <ToggleRow
                label={TECHNIQUES.absoluteVsPercent.label}
                hint={TECHNIQUES.absoluteVsPercent.shortHint}
                active={state.absoluteVsPercent === 'percent'}
                onToggle={() =>
                    onChange({
                        ...state,
                        absoluteVsPercent: state.absoluteVsPercent === 'absolute' ? 'percent' : 'absolute',
                    })
                }
            />

            <ToggleRow
                label={TECHNIQUES.missingDenominator.label}
                hint={TECHNIQUES.missingDenominator.shortHint}
                active={state.missingDenominator}
                onToggle={() => onChange({ ...state, missingDenominator: !state.missingDenominator })}
            />
        </View>
    );
}

interface CredibilityMeterProps {
    result: ManipulationResult;
}

function MeterBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[10px] font-sf-bold uppercase tracking-[0.08em] text-dark/40">
                    {label}
                </Text>
                <Text className="text-[12px] font-sf-bold text-dark">{value}</Text>
            </View>
            <View className="h-2 rounded-full bg-dark/5 overflow-hidden">
                <View
                    className="h-full rounded-full"
                    style={{ width: `${value}%`, backgroundColor: color }}
                />
            </View>
        </View>
    );
}

const VERDICT_COPY: Record<ManipulationResult['verdict'], { label: string; tone: string }> = {
    subtle: {
        label: "Convincing — and hard to catch",
        tone: '#8A4F3D',
    },
    'heavy-handed': {
        label: 'Convincing, but it looks rigged',
        tone: '#A6A398',
    },
    unconvincing: {
        label: "Doesn't really support the claim",
        tone: '#A6A398',
    },
};

export function CredibilityMeter({ result }: CredibilityMeterProps) {
    const verdict = VERDICT_COPY[result.verdict];

    return (
        <View className="bg-white border border-dark/10 rounded-2xl p-4 mb-5">
            <View className="flex-row gap-4 mb-3">
                <MeterBar label="Persuasiveness" value={result.persuasiveness} color="#1A1A18" />
                <MeterBar label="Credibility" value={result.credibility} color="#F7CE46" />
            </View>

            <View className="flex-row items-center gap-1.5 pt-3 border-t border-dark/5">
                <Feather
                    name={result.verdict === 'subtle' ? 'alert-triangle' : 'info'}
                    size={12}
                    color={verdict.tone}
                />
                <Text className="text-[11px] font-sf-bold flex-1" style={{ color: verdict.tone }}>
                    {verdict.label}
                </Text>
                {result.activeTechniqueCount >= 3 && (
                    <Text className="text-[10px] font-sf-regular text-dark/35">
                        {result.activeTechniqueCount} tricks stacked
                    </Text>
                )}
            </View>
        </View>
    );
}



interface RevealScreenProps {
    scenario: ManipulatorScenario;
    manipulatedState: ManipulationState;
    result: ManipulationResult;
    onContinue: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 48 - 32; // outer padding + card padding

// Uses the real registry line chart — same component every other chart
// page in the app renders — rather than a standalone implementation.
const LineChart = CHART_REGISTRY.line.component;

export function RevealScreen({
    scenario,
    manipulatedState,
    result,
    onContinue,
}: RevealScreenProps) {
    // Re-derive exactly what the user was looking at, from the real data +
    // their manipulation state — never a separately stored "fake" chart.
    const manipulatedApiData = applyManipulation(scenario, manipulatedState);
    const axisOverride = getAxisOverride(scenario, manipulatedState);

    return (
        <View>
            {/* Header */}
            <View className="flex-row items-center gap-2 mb-1">
                <View className="w-7 h-7 rounded-full items-center justify-center bg-dark">
                    <Feather name="eye" size={13} color="#F7CE46" />
                </View>
                <Text className="text-[11px] font-sf-bold uppercase tracking-[0.1em] text-dark/40">
                    Here's what the full data shows
                </Text>
            </View>
            <Text className="text-xl font-sf-bold italic text-dark mb-5 leading-snug">
                {scenario.realStory}
            </Text>

            {/* Your version */}
            <Text className="text-[11px] font-sf-bold uppercase tracking-[0.1em] text-dark/40 mb-2">
                What you built
            </Text>
            <View className="bg-white border border-dark/10 rounded-2xl p-4 mb-3 items-center">
                <LineChart
                    screenWidth={CHART_WIDTH}
                    height={170}
                    apiData={manipulatedApiData}
                    yDomainOverride={axisOverride}
                />
            </View>
            <View className="flex-row gap-4 mb-6 px-1">
                <Text className="text-[11px] font-sf-bold text-dark/45">
                    Persuasiveness <Text className="text-dark">{result.persuasiveness}</Text>
                </Text>
                <Text className="text-[11px] font-sf-bold text-dark/45">
                    Credibility <Text className="text-dark">{result.credibility}</Text>
                </Text>
            </View>

            {/* The real chart — same component, untouched apiData, no
                axis override */}
            <Text className="text-[11px] font-sf-bold uppercase tracking-[0.1em] text-dark/40 mb-2">
                The real data, untouched
            </Text>
            <View className="relative mb-6">
                <View
                    className="absolute inset-0 bg-dark rounded-2xl"
                    style={{ transform: [{ translateX: 5 }, { translateY: 5 }] }}
                />
                <View className="bg-white border-[1.5px] border-dark rounded-2xl p-4 overflow-hidden items-center">
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute', top: -30, right: -30,
                            width: 100, height: 100, borderRadius: 50,
                            backgroundColor: '#F7CE46', opacity: 0.18,
                        }}
                    />
                    <LineChart
                        screenWidth={CHART_WIDTH}
                        height={170}
                        apiData={scenario.apiData}
                    />
                </View>
            </View>

            {/* Source */}
            <View className="flex-row items-center gap-1.5 mb-7">
                <Feather name="bookmark" size={11} color="#A6A398" />
                <Text className="text-[11px] font-sf-regular text-dark/40">
                    Source: {scenario.sourceName}
                </Text>
            </View>

            {/* Reflection prompt */}
            <View className="bg-[#FCEFC4] rounded-2xl p-4 mb-7">
                <Text className="text-[13px] font-sf-bold text-[#6B5A12] mb-1">
                    Worth remembering
                </Text>
                <Text className="text-[12.5px] font-sf-regular text-[#6B5A12] leading-relaxed">
                    {result.activeTechniqueCount === 0
                        ? "You showed the data straight — that's the version most likely to hold up to scrutiny."
                        : result.verdict === 'subtle'
                            ? "A single well-placed technique was more convincing than stacking several. That's usually how real misleading charts work too."
                            : "The more tricks you stack, the more it starts to look manufactured. Real manipulation is often just one quiet choice, not five."}
                </Text>
            </View>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onContinue}
                className="bg-dark rounded-[24px] py-4 items-center"
            >
                <Text className="text-primary font-sf-bold text-[13px] tracking-[0.03em]">
                    Continue
                </Text>
            </TouchableOpacity>
        </View>
    );
}