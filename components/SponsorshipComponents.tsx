import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SunButton from "./SunButton";

// ─── Step progress dots ───────────────────────────────────────────────────────
export const StepDots = ({
    total,
    current,
}: {
    total: number;
    current: number;
}) => (
    <View className="flex-row gap-1.5 mb-6">
        {Array.from({ length: total }).map((_, i) => (
            <View
                key={i}
                className={`h-[3px] rounded-full transition-all ${i < current
                    ? "bg-primary"
                    : i === current
                        ? "bg-dark"
                        : "bg-dark/10"
                    }`}
                style={{ width: i === current ? 24 : 12 }}
            />
        ))}
    </View>
);

// ─── Screen header with back button and path badge ───────────────────────────
export const FlowHeader = ({
    onBack,
    pathLabel,
}: {
    onBack: () => void;
    pathLabel: string;
}) => (
    <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 rounded-full bg-dark/5 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Text className="text-dark font-sf-bold text-base">←</Text>
        </TouchableOpacity>
        <View className="px-4 py-1.5 bg-dark rounded-full">
            <Text className="text-[9px] font-sf-bold uppercase tracking-[0.3em] text-primary">
                {pathLabel}
            </Text>
        </View>
    </View>
);

// ─── Section label + big title + subtitle ────────────────────────────────────
export const StepTitle = ({
    label,
    title,
    subtitle,
}: {
    label: string;
    title: string;
    subtitle?: string;
}) => (
    <View className="mb-8">
        <View className="flex-row items-center gap-2 mb-2">
            <View className="h-[1px] w-8 bg-primary" />
            <Text className="text-[10px] uppercase font-sf-bold tracking-[0.4em] text-grey/60">
                {label}
            </Text>
        </View>
        <Text className="text-4xl font-sf-bold text-dark tracking-tighter leading-tight mb-2">
            {title}
        </Text>
        {subtitle ? (
            <Text className="text-sm font-sf-regular text-grey leading-relaxed">
                {subtitle}
            </Text>
        ) : null}
    </View>
);

// ─── Field label ─────────────────────────────────────────────────────────────
export const FieldLabel = ({ children }: { children: string }) => (
    <Text className="text-[10px] font-sf-bold uppercase tracking-widest text-grey/40 mb-2">
        {children}
    </Text>
);

// ─── Budget/option chips row ─────────────────────────────────────────────────
export const ChipRow = ({
    options,
    selected,
    onSelect,
}: {
    options: { label: string; sub?: string }[];
    selected: number;
    onSelect: (i: number) => void;
}) => (
    <View className="flex-row gap-2 mb-6">
        {options.map((o, i) => (
            <TouchableOpacity
                key={o.label}
                onPress={() => onSelect(i)}
                className={`flex-1 py-4 rounded-2xl border items-center ${selected === i ? "bg-dark border-dark" : "bg-transparent border-dark/10"
                    }`}
            >
                <Text
                    className={`text-sm font-sf-bold ${selected === i ? "text-light" : "text-dark"
                        }`}
                >
                    {o.label}
                </Text>
                {o.sub ? (
                    <Text
                        className={`text-[9px] font-sf-bold uppercase tracking-widest mt-0.5 ${selected === i ? "text-light/40" : "text-grey/40"
                            }`}
                    >
                        {o.sub}
                    </Text>
                ) : null}
            </TouchableOpacity>
        ))}
    </View>
);

// ─── Tag cloud ────────────────────────────────────────────────────────────────
export const TagCloud = ({
    tags,
    selected,
    onToggle,
}: {
    tags: string[];
    selected: string[];
    onToggle: (t: string) => void;
}) => (
    <View className="flex-row flex-wrap gap-2 mb-6">
        {tags.map((t) => (
            <TouchableOpacity
                key={t}
                onPress={() => onToggle(t)}
                className={`px-4 py-2 rounded-2xl border ${selected.includes(t)
                    ? "bg-dark border-dark"
                    : "bg-transparent border-dark/10"
                    }`}
            >
                <Text
                    className={`text-xs font-sf-bold ${selected.includes(t) ? "text-primary" : "text-dark"
                        }`}
                >
                    {t}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

// ─── Review row ──────────────────────────────────────────────────────────────
export const ReviewRow = ({
    label,
    value,
    last,
}: {
    label: string;
    value: string;
    last?: boolean;
}) => (
    <View
        className={`flex-row justify-between items-center py-4 ${!last ? "border-b border-dark/5" : ""
            }`}
    >
        <Text className="text-[10px] font-sf-bold uppercase tracking-widest text-grey/40">
            {label}
        </Text>
        <Text
            className="text-xs font-sf-bold text-dark text-right flex-1 ml-4"
            numberOfLines={1}
        >
            {value}
        </Text>
    </View>
);

// ─── Success screen ───────────────────────────────────────────────────────────
export const SuccessScreen = ({
    onReturn,
    reference = "#SPR-20241012",
}: {
    onReturn: () => void;
    reference?: string;
}) => (
    <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="items-center w-full">
            {/* Placeholder success icon */}
            <View className="w-16 h-16 rounded-full bg-primary mb-6" />

            <View className="flex-row items-center gap-3 mb-4">
                <View className="h-[1px] w-8 bg-dark/15" />
                <Text className="text-[10px] font-sf-bold uppercase tracking-[0.4em] text-grey/50">
                    Signal Sent
                </Text>
                <View className="h-[1px] w-8 bg-dark/15" />
            </View>

            <Text className="text-4xl font-sf-bold text-dark tracking-tighter text-center leading-tight mb-3">
                {"Your sponsorship\nis live."}
            </Text>
            <Text className="text-sm font-sf-regular text-grey text-center leading-relaxed mb-10 max-w-[260px]">
                Our team will review within 24 hours. You'll be notified when it goes live in the feed.
            </Text>

            <View className="w-full bg-light/50 rounded-3xl border border-dark/5 px-6 py-2 mb-10">
                <ReviewRow label="Status" value="Under review" />
                <ReviewRow label="Reference" value={reference} last />
            </View>

            <SunButton text="Return to Feed" onPress={onReturn} />
        </View>
    </View>
);
