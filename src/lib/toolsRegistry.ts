/**
 * src/lib/toolsRegistry.ts
 * PROJ-50 §5: Tools Hub Redesign
 * Single source of truth for every Tools Hub card — shared by ToolsHub.tsx (the
 * directory) and ToolHistory.tsx (which needs each tool's label/icon for its
 * header), so tool metadata is defined once rather than duplicated per page.
 */
import type { ComponentType, SVGProps } from 'react';
import {
    ScaleIcon, ShieldExclamationIcon, ArrowPathIcon, BoltIcon, UserCircleIcon,
    ChartPieIcon, FireIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, FlagIcon,
} from '@heroicons/react/24/outline';
import type { SmartToolType } from './types/smart';

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** Which recovery moment a tool belongs to — drives the Tools Hub's grouped sections (PROJ-71). */
export type ToolPhase = 'right-now' | 'before' | 'after' | 'big-picture';

export interface ToolRegistryEntry {
    id: string;
    title: string;
    /** "When to use" — a one-line description of the moment this tool is for. */
    description: string;
    /** Subtle persona/context indicator, e.g. "Anytime", "Before a decision". */
    bestFor?: string;
    timeEstimate?: string;
    path: string;
    icon: IconType;
    color: string;
    bg: string;
    border: string;
    status: 'active' | 'coming_soon';
    /** The SmartToolType this card's journal entries are tagged with — undefined for tools that don't persist to journals as a SMART Tool (Urge Surfer, Resentment Burner). */
    toolType?: SmartToolType;
    /** True only for the GuidedWorkflowEngine-backed tools, which have a step-locked session that can be resumed mid-flow. */
    hasGuidedFlow?: boolean;
    /** Which Tools Hub section (PROJ-71) this tool is grouped under. */
    phase: ToolPhase;
}

/** Section metadata for the Tools Hub's grouped accordion layout (PROJ-71), keyed by ToolPhase and rendered in this fixed order. */
export const PHASE_META: Record<ToolPhase, { label: string; subtitle: string; icon: IconType }> = {
    'right-now': {
        label: 'Right Now',
        subtitle: 'In the moment — for cravings and crisis',
        icon: ShieldExclamationIcon,
    },
    before: {
        label: 'Before It Happens',
        subtitle: 'Plan ahead of a risky moment',
        icon: BoltIcon,
    },
    after: {
        label: 'After a Hard Moment',
        subtitle: 'Process what just happened',
        icon: ArrowPathIcon,
    },
    'big-picture': {
        label: 'Big Picture',
        subtitle: 'Step back and plan',
        icon: FlagIcon,
    },
};

export const TOOLS: ToolRegistryEntry[] = [
    {
        id: 'urge-surfer',
        title: 'Urge Surfer',
        description: 'A 5-minute somatic grounding technique to ride out intense cravings.',
        path: '/tools/urge-surfer',
        icon: ShieldExclamationIcon,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-l-indigo-500',
        status: 'active',
        phase: 'right-now',
    },
    {
        id: 'resentment-burner',
        title: 'The Resentment Burner',
        description: 'An ephemeral, secure space to vent toxic thoughts and literally watch them burn away. No data is ever saved.',
        path: '/tools/resentment-burner',
        icon: FireIcon,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-l-red-500',
        status: 'active',
        phase: 'right-now',
    },
    {
        id: 'cba',
        title: 'Cost Benefit Analysis',
        description: "When you're weighing whether to change a behaviour",
        bestFor: 'Before a decision',
        timeEstimate: '~8 minutes',
        path: '/tools/cba',
        icon: ScaleIcon,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-l-emerald-500',
        status: 'active',
        toolType: 'CBA',
        hasGuidedFlow: true,
        phase: 'before',
    },
    {
        id: 'abc',
        title: 'ABC Coping',
        description: 'When a belief is making you feel worse than the situation warrants',
        bestFor: 'Anytime',
        timeEstimate: '~7 minutes',
        path: '/tools/abc',
        icon: ArrowPathIcon,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-l-blue-500',
        status: 'active',
        toolType: 'ABC',
        hasGuidedFlow: true,
        phase: 'after',
    },
    {
        id: 'dents',
        title: 'D.E.N.T.S. Strategy',
        description: 'When you know a challenging situation is coming',
        bestFor: 'Before a risky situation',
        timeEstimate: '~6 minutes',
        path: '/tools/dents',
        icon: BoltIcon,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-l-amber-500',
        status: 'active',
        toolType: 'DENTS',
        hasGuidedFlow: true,
        phase: 'before',
    },
    {
        id: 'personify',
        title: 'Personify & Disarm',
        description: 'When you want to separate your true identity from the addictive voice in your head',
        bestFor: 'Reflection',
        timeEstimate: '~5 minutes',
        path: '/tools/personify',
        icon: UserCircleIcon,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-l-purple-500',
        status: 'active',
        toolType: 'PERSONIFY',
        phase: 'after',
    },
    {
        id: 'lifestyle-balance',
        title: 'Lifestyle Balance',
        description: 'When you want to see how balanced your life feels right now',
        bestFor: 'Monthly review',
        timeEstimate: '~5 minutes',
        path: '/tools/lifestyle-balance',
        icon: ChartPieIcon,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        border: 'border-l-cyan-500',
        status: 'active',
        toolType: 'LIFESTYLE_BALANCE',
        phase: 'big-picture',
    },
    {
        id: 'thought-record',
        title: 'Thought Record',
        description: 'When you want to understand and reframe a difficult moment',
        bestFor: 'After distress',
        timeEstimate: '~10 minutes',
        path: '/tools/thought-record',
        icon: ClipboardDocumentListIcon,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-l-violet-500',
        status: 'active',
        toolType: 'THOUGHT_RECORD',
        hasGuidedFlow: true,
        phase: 'after',
    },
    {
        id: 'five-questions',
        title: 'Five Questions',
        description: 'When a recurring thought is keeping you stuck',
        bestFor: 'Deep reflection',
        timeEstimate: '~8 minutes',
        path: '/tools/five-questions',
        icon: ChatBubbleLeftRightIcon,
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        border: 'border-l-teal-500',
        status: 'active',
        toolType: 'FIVE_QUESTIONS',
        hasGuidedFlow: true,
        phase: 'after',
    },
    {
        id: 'smart-goal',
        title: 'SMART Goal',
        description: 'When you want to turn an intention into a concrete plan',
        bestFor: 'Planning',
        path: '/tools/smart-goal',
        icon: FlagIcon,
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-l-slate-400',
        status: 'coming_soon',
        toolType: 'SMART_GOAL',
        phase: 'big-picture',
    },
];
