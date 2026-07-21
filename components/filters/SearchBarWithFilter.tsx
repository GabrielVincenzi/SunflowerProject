import { THEME_COLORS } from '@/constants/utilities';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarWithFilterProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
    onOpenFilters: () => void;
    activeFilterCount: number;
    inputRef?: React.RefObject<TextInput | null>;
    isLoading: boolean;
    disabled: boolean;
}

export default function SearchBarWithFilter({
    value,
    onChangeText,
    onSubmit,
    onOpenFilters,
    activeFilterCount,
    inputRef,
    isLoading,
    disabled,
}: SearchBarWithFilterProps) {
    return (
        <View className="flex-row gap-2.5 mb-5">
            {/* Search input */}
            <View className="flex-1 relative">
                <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                    <Feather name="search" size={16} color={THEME_COLORS.grey} />
                </View>
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    onSubmitEditing={onSubmit}
                    placeholder="Search by topic, country, theme..."
                    placeholderTextColor={THEME_COLORS.grey}
                    returnKeyType="search"
                    className="h-[46px] pl-11 pr-4 rounded-[23px] border border-dark/10 bg-white text-[14px] font-sf-regular text-dark"
                />
            </View>

            {/* Filter trigger — replaces the old header category button */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenFilters}
                className="w-[46px] h-[46px] rounded-[23px] bg-dark items-center justify-center relative"
            >
                <Feather name="sliders" size={17} color={THEME_COLORS.primary} />
                {activeFilterCount > 0 && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary items-center justify-center">
                        <Text className="text-[9px] font-sf-bold text-dark">
                            {activeFilterCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}
