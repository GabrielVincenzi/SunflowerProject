import { Feather } from '@expo/vector-icons';
import ManipulatorsStudio from './eductools/ManipulationStudio';
import TimeMachine from './eductools/PredictionDraw';
import { BloomIcon } from './icons/BloomIcon';
import { SeedIcon } from './icons/SeedIcon';
import { SproutIcon } from './icons/SproutIcon';

// ─── Growth stage ───────────────────────────────────────────────────────────
// Three states only, per spec: seed (not started) → sprout (in progress)
// → bloom (completed). Mapped from raw progress data, not stored directly,
// so the underlying definition of "completed" can evolve without a schema
// migration.

export type GrowthStage = 'seed' | 'sprout' | 'bloom';

export interface ToolProgress {
    /** Number of rounds/sessions completed for this tool */
    completions: number;
    /** Whether the user has ever opened this tool at all */
    hasStarted: boolean;
    /** Whether this tool is considered "mastered" — tool-specific threshold,
     * e.g. 3+ completions. Drives the bloom stage. */
    isMastered: boolean;
}

export function getGrowthStage(progress: ToolProgress | undefined): GrowthStage {
    if (!progress || !progress.hasStarted) return 'seed';
    if (progress.isMastered) return 'bloom';
    return 'sprout';
}

// ─── Stage visual tokens ─────────────────────────────────────────────────────
// Single source of truth for stage → icon/color, so every tile and the
// journey card stay visually consistent without duplicating this mapping.

export const STAGE_VISUALS: Record<
    GrowthStage,
    { svg: React.ComponentType<any>; bg: string; tint: string; label: string }
> = {
    seed: {
        svg: SeedIcon,
        bg: '#F0ECE0',
        tint: '#A6A398',
        label: 'Not started',
    },
    sprout: {
        svg: SproutIcon,
        bg: '#E3EFE6',
        tint: '#3D6B4A',
        label: 'In progress',
    },
    bloom: {
        svg: BloomIcon,
        bg: '#FCEFC4',
        tint: '#B8941F',
        label: 'Completed',
    },
};

// ─── Tool registry ────────────────────────────────────────────────────────
// The 9 tools from the catalogue, plus metadata needed for tile rendering.
// `routeKey` is used by the parent screen to navigate/open the right
// component — wire to your actual router/modal-opening logic.

export interface ToolDef {
    id: string;
    routeKey: string;
    title: string;
    subtitle: string;
    icon: keyof typeof Feather.glyphMap;
    component: React.ComponentType<any>;
}

export const GREENHOUSE_TOOLS: ToolDef[] = [
    {
        id: 'manipulators-studio',
        routeKey: 'manipulators-studio',
        title: "Manipulator's Studio",
        subtitle: 'Bend a chart to fit a claim',
        icon: 'edit-3',
        component: ManipulatorsStudio,
    },
    {
        id: 'time-machine',
        routeKey: 'time-machine',
        title: 'The Time Machine',
        subtitle: 'Predict, then watch it unfold',
        icon: 'clock',
        component: TimeMachine,
    },
    {
        id: 'sample-thief',
        routeKey: 'sample-thief',
        title: 'The Sample Thief',
        subtitle: 'Pick a slice that proves your point',
        icon: 'crop',
        component: ManipulatorsStudio,
    },
    {
        id: 'headline-factory',
        routeKey: 'headline-factory',
        title: 'The Headline Factory',
        subtitle: 'Correlation vs. causation, live',
        icon: 'file-text',
        component: ManipulatorsStudio,
    },
    {
        id: 'forecaster',
        routeKey: 'forecaster',
        title: 'The Forecaster',
        subtitle: 'Calibrate your own confidence',
        icon: 'target',
        component: ManipulatorsStudio,
    },
    {
        id: 'translator',
        routeKey: 'translator',
        title: 'The Translator',
        subtitle: 'Turn big numbers into real ones',
        icon: 'repeat',
        component: ManipulatorsStudio,
    },
    {
        id: 'devils-advocate',
        routeKey: 'devils-advocate',
        title: "Devil's Advocate",
        subtitle: 'Argue against your own belief',
        icon: 'message-square',
        component: ManipulatorsStudio,
    },
    {
        id: 'consensus-map',
        routeKey: 'consensus-map',
        title: 'The Consensus Map',
        subtitle: 'Where does the evidence actually sit?',
        icon: 'compass',
        component: ManipulatorsStudio,
    },
    {
        id: 'replication-game',
        routeKey: 'replication-game',
        title: 'The Replication Game',
        subtitle: 'Which findings actually held up?',
        icon: 'refresh-cw',
        component: ManipulatorsStudio,
    },
];

export const JOURNEY_TOOL: ToolDef = {
    id: 'the-journey',
    routeKey: 'the-journey',
    title: 'The Journey',
    subtitle: 'All nine tools, one guided path',
    icon: 'map',
    component: ManipulatorsStudio,
};

// ─── Stats banner ───────────────────────────────────────────────────────────
// Shape for the Duolingo-style top banner: streak, accuracy ratio, tool
// completions. Numbers are computed server-side or client-aggregated
// elsewhere — this just defines the contract the banner component expects.

export interface GreenhouseStats {
    /** Consecutive days with at least one tool/question interaction */
    dayStreak: number;
    /** Total questions/rounds answered across all tools */
    totalAnswers: number;
    /** Correct/well-calibrated answers — definition varies per tool but
     * aggregates into one ratio for the banner */
    correctAnswers: number;
    /** Number of distinct tools with at least one completion (bloom or sprout) */
    toolsStarted: number;
    /** Number of distinct tools fully mastered (bloom) */
    toolsCompleted: number;
}

export function accuracyRatio(stats: GreenhouseStats): number {
    if (stats.totalAnswers === 0) return 0;
    return Math.round((stats.correctAnswers / stats.totalAnswers) * 100);
}

// ─── Tile ordering ───────────────────────────────────────────────────────
// Per spec: sprout (in progress) first, then seed (not started), then
// bloom (completed) last — surfaces what the user is mid-way through
// before what's available before what's already done.

const STAGE_SORT_ORDER: Record<GrowthStage, number> = {
    sprout: 0,
    seed: 1,
    bloom: 2,
};

export function sortToolsByStage(
    tools: ToolDef[],
    progressMap: Record<string, ToolProgress>
): { tool: ToolDef; stage: GrowthStage }[] {
    return tools
        .map((tool) => ({ tool, stage: getGrowthStage(progressMap[tool.id]) }))
        .sort((a, b) => STAGE_SORT_ORDER[a.stage] - STAGE_SORT_ORDER[b.stage]);
}