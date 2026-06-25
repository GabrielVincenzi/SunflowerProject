import ChartList from "@/components/chartscomp/ChartList";
import RequestDataPopup from "@/components/popup/RequestDataPopup";
import SearchBar from "@/components/SearchBar";
import { images } from "@/constants/images";
import { useTranslations } from "@/services/useTranslation";
import React, { useCallback, useRef, useState } from "react";
import { Image, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const SearchPage = () => {
    const [input, setInput] = useState<string>("");
    const [committedQuery, setCommittedQuery] = useState<string>("");
    const [requestVisible, setRequestVisible] = useState(false);
    const inputRef = useRef<TextInput | null>(null);
    const { data: translated } = useTranslations();

    const handleSearch = useCallback(() => {
        setCommittedQuery(input.trim());
        inputRef.current?.blur();
    }, [input]);

    if (!translated) return null;
    const t: any = translated.payload;

    const renderHeader = () => (
        <View className="pt-16 pb-8 px-8">
            <Animated.View entering={FadeInDown.duration(800).delay(100)} className="items-center mb-12">
                {/* Branding Block */}
                <View className="w-20 h-20 bg-white rounded-[24px] items-center justify-center">
                    <Image source={images.logoMain} className="w-14 h-14" resizeMode="contain" />
                </View>
                <Text className="text-[10px] uppercase font-elms-bold tracking-[0.5em] text-dark/30 mt-6 text-center">
                    {t.search.engineLabel}
                </Text>
            </Animated.View>

            <View className="mb-10">
                <SearchBar
                    placeholder={t.search.placeholder}
                    value={input}
                    onChangeText={setInput}
                    onPress={handleSearch}
                    inputRef={inputRef}
                    autoFocus={true}
                />
            </View>

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
        </View>
    );

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-primary">
                    {!committedQuery ? (
                        <View className="flex-1">
                            {renderHeader()}
                            <View className="flex-1 justify-center items-center pb-32 px-10">
                                <View className="w-2 h-2 rounded-full bg-primary mb-6 animate-pulse" />
                                <Text className="text-center text-dark/40 font-elms-bold italic text-2xl tracking-tighter leading-tight">
                                    {t.search.emptyState.tagline}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setRequestVisible(true)}
                                    activeOpacity={0.8}
                                    className="mt-12 flex-row items-center gap-3 px-8 py-4 rounded-full border-2 border-dark bg-white"
                                >
                                    <Text className="text-[10px] font-elms-bold uppercase tracking-[0.4em] text-dark">
                                        {t.search.emptyState.button}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <ChartList
                            searchQuery={committedQuery}
                            searchCategory={""}
                            renderHeader={renderHeader}
                            pageLimit={5}
                        />
                    )}
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

export default SearchPage;