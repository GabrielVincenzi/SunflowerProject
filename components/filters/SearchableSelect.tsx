// ─── SearchableSelect ──────────────────────────────────────────────────────────

import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

interface SelectOption { value: string; label: string; }

export const SearchableSelect = ({
    options,
    selected,
    onToggle,
    placeholder = "Search...",
    chipThreshold = 5,
}: {
    options: SelectOption[];
    selected: string[];
    onToggle: (value: string) => void;
    placeholder?: string;
    chipThreshold?: number;
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    // ── Inline chips mode ────────────────────────────────────────────────────
    if (options.length < chipThreshold) {
        return (
            <View className="flex-row flex-wrap gap-3">
                {options.map(opt => {
                    const active = selected.includes(opt.value);
                    return (
                        <View key={opt.value} className="relative">
                            <View className="absolute inset-0 bg-dark rounded-[24px] translate-x-1 translate-y-1" />
                            <TouchableOpacity
                                onPress={() => onToggle(opt.value)}
                                className={`px-6 py-4 rounded-[24px] border-2 border-dark ${active ? "bg-primary" : "bg-white"}`}
                            >
                                <Text className="font-sf-bold italic text-dark text-lg">{opt.label}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        );
    }

    const filtered = useMemo(
        () => options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
        [options, query],
    );

    return (
        <View>
            {/* Selected chips */}
            {selected.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-3">
                    {selected.map(v => {
                        const label = options.find(o => o.value === v)?.label ?? v;
                        return (
                            <TouchableOpacity
                                key={v}
                                onPress={() => onToggle(v)}
                                className="flex-row items-center gap-2 bg-primary border-2 border-dark px-4 py-2 rounded-full"
                            >
                                <Text className="font-sf-bold italic text-dark text-sm">{label}</Text>
                                <Feather name="x" size={12} color="#141414" />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Trigger */}
            <View className="relative">
                <View className="absolute inset-0 bg-dark rounded-[20px] translate-x-1 translate-y-1" />
                <TouchableOpacity
                    onPress={() => setOpen(o => !o)}
                    className="flex-row items-center justify-between px-5 py-4 rounded-[20px] border-2 border-dark bg-white"
                >
                    <Text className="font-sf-bold italic text-dark/40 text-base">
                        {placeholder}
                    </Text>
                    <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color="#141414" />
                </TouchableOpacity>
            </View>

            {/* Dropdown */}
            {open && (
                <View className="border-2 border-dark rounded-[20px] mt-2 bg-white overflow-hidden">
                    {/* Search input */}
                    <View className="flex-row items-center gap-3 px-5 py-3 border-b-2 border-dark/10">
                        <Feather name="search" size={14} color="#14141460" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Type to filter..."
                            placeholderTextColor="#14141440"
                            className="flex-1 font-sf-regular italic text-dark text-base"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery("")}>
                                <Feather name="x" size={14} color="#14141460" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Options list */}
                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {filtered.length === 0 ? (
                            <Text className="px-5 py-4 font-sf-regular italic text-dark/30 text-sm">
                                No results
                            </Text>
                        ) : (
                            filtered.map(opt => {
                                const active = selected.includes(opt.value);
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => onToggle(opt.value)}
                                        className={`flex-row items-center justify-between px-5 py-4 border-b border-dark/5 ${active ? "bg-primary/20" : ""}`}
                                    >
                                        <Text className="font-sf-bold italic text-dark text-base flex-1 mr-4">{opt.label}</Text>
                                        {active && <Feather name="check" size={16} color="#141414" />}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};