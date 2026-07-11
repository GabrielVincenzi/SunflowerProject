import ChartList from "@/components/chartscomp/ChartList";
import SearchBar from "@/components/filters/SearchBar";
import RequestDataPopup from "@/components/popup/RequestDataPopup";
import SunButton from "@/components/SunButton";
import { useTranslations } from "@/services/useTranslation";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const CategoryPage = () => {
    const { cat } = useLocalSearchParams();
    const { data } = useTranslations();
    const category = Array.isArray(cat) ? cat[0] : cat ?? "";

    // Search and sector alignment states
    const [input, setInput] = useState<string>("");
    const [committedQuery, setCommittedQuery] = useState("");
    const [requestVisible, setRequestVisible] = useState(false);
    const inputRef = useRef<TextInput | null>(null);

    if (!data) return null;
    const t: any = data.payload;

    // Triggered when pressing return or tapping search button
    const handleSearch = useCallback(() => {
        setCommittedQuery(input.trim());
        inputRef.current?.blur();
    }, [input]);

    const renderHeader = () => (
        <Animated.View
            entering={FadeInDown.duration(800).delay(100)}
            className="px-8 mt-12 mb-10"
        >
            {/* System Path Tracker */}
            <View className="flex-row items-center gap-3 mb-4">
                <View className="h-[2px] w-10 bg-dark" />
                <Text className="text-[10px] uppercase font-elms-bold tracking-[0.4em] text-dark/40">
                    {t.category?.archiveLabel || "ARCHIVE"} // {category.toUpperCase()}
                </Text>
            </View>

            {/* Editorial Title Heading */}
            <Text className="text-dark text-5xl tracking-tighter font-elms-bold italic capitalize leading-none mb-4">
                {category
                    .split("-")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </Text>

            {/* Editorial Sub-bar Search */}
            <View className="mb-4">
                <SearchBar
                    placeholder={t.search?.placeholder || "Filter records..."}
                    value={input}
                    onChangeText={setInput}
                    onPress={handleSearch}
                    inputRef={inputRef}
                />
            </View>

            {/* Search Query Breadcrumbs */}
            {committedQuery ? (
                <View className="space-y-4">
                    <View className="flex-row items-baseline gap-2">
                        <Text className="text-2xl font-elms-bold text-dark tracking-tighter italic">{t.search.resultsFor}</Text>
                        <Text className="text-2xl font-elms-bold italic text-white">"{committedQuery}"</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setRequestVisible(true)}
                        activeOpacity={0.6}
                        className="py-3 border-b-2 border-dark/5 self-start"
                    >
                        <Text className="text-[10px] font-elms-bold uppercase tracking-[0.3em] text-dark/40">
                            {t.search.requestData.prompt} <Text className="text-dark/60">{t.search.requestData.cta}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}
        </Animated.View>
    );

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-primary">
                    <View className="flex-1">
                        <ChartList
                            searchQuery={committedQuery}
                            searchCategory={category}
                            renderHeader={renderHeader}
                            pageLimit={6}
                        />
                    </View>

                    {/* Fixed Editorial Bottom Return Control */}
                    <View className="absolute bottom-6 left-0 right-0 px-8">
                        <SunButton
                            text={t.common?.goBack || "Return to Hub"}
                            onPress={() => router.back()}
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
            <RequestDataPopup
                visible={requestVisible}
                onClose={() => setRequestVisible(false)}
                prefillQuery={input}
            />
        </>
    );
};

export default CategoryPage;