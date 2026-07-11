import CategoryGrid from '@/components/CategoryGrid';
import ChartList from '@/components/chartscomp/ChartList2';
import ModeSwitch, { FeedMode } from '@/components/filters/ModeSwitch';
import SearchBarWithFilter from '@/components/filters/SearchBarWithFilter';
import FilterSheet, { ChartFilters, countActiveFilters, EMPTY_FILTERS } from '@/components/popup/FilterSheet';
import RequestDataPopup from '@/components/popup/RequestDataPopup';
import SearchSkeleton from '@/components/skeletons/SearchSkeleton';
import { THEME_COLORS } from '@/constants/utilities';
import { encodeQuery } from '@/services/embeddingService';
import { useModelStatus } from '@/services/useModelStatus';
import { useTranslations } from '@/services/useTranslation';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function SearchScreen() {
    const { data: translated } = useTranslations();
    const { isReady, isDownloading, isWarming, progress } = useModelStatus();

    const [input, setInput] = useState('');
    const [committedQuery, setCommittedQuery] = useState('');
    const [committedVector, setCommittedVector] = useState<number[] | null>(null); // ← new
    const [isEncoding, setIsEncoding] = useState(false);
    const [mode, setMode] = useState<FeedMode>('recommended');
    const [filters, setFilters] = useState<ChartFilters>(EMPTY_FILTERS);
    const [filterSheetVisible, setFilterSheetVisible] = useState(false);
    const [requestVisible, setRequestVisible] = useState(false);

    const inputRef = useRef<TextInput | null>(null);

    const handleSearch = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed) {
            setCommittedQuery('');
            setCommittedVector(null);
            return;
        }
        setIsEncoding(true);
        try {
            const vector = await encodeQuery(trimmed);
            setCommittedQuery(trimmed);
            setCommittedVector(vector);
        } catch (e) {
            console.error('Encoding failed', e);
        } finally {
            setIsEncoding(false);
            inputRef.current?.blur();
        }
    }, [input]);

    const handleApplyFilters = useCallback((next: ChartFilters) => {
        setFilters(next);
        setFilterSheetVisible(false);
    }, []);

    const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
    const isSearching = committedQuery.length > 0;
    const searchCategory = filters.topics[0];

    const renderHeader = () => (
        <View className="px-6 pt-14 pb-2">
            {/* Top label + title */}
            <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40">
                    Explore signals
                </Text>
            </View>
            <Text className="text-[22px] font-elms-bold italic text-dark mb-4">
                Find your next chart
            </Text>

            {/* Mode switch — hidden once a search is active */}
            {!isSearching && <ModeSwitch mode={mode} onChange={setMode} />}

            {/* Search bar + filter trigger */}
            <SearchBarWithFilter
                value={input}
                onChangeText={setInput}
                onSubmit={handleSearch}
                onOpenFilters={() => setFilterSheetVisible(true)}
                activeFilterCount={activeFilterCount}
                inputRef={inputRef}
                isLoading={isEncoding}
                disabled={!isReady}
            />

            {/* Non-blocking model status indicator */}
            {isDownloading && (
                <View className="flex-row items-center gap-2 mt-2">
                    <View className="flex-1 h-[2px] bg-dark/10 rounded-full">
                        <View
                            className="h-[2px] bg-primary rounded-full"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                    </View>
                    <Text className="text-[11px] font-elms-regular text-dark/35">
                        {Math.round(progress * 100)}%
                    </Text>
                </View>
            )}

            {isWarming && (
                <View className="flex-row items-center gap-2 mt-2">
                    <ActivityIndicator size="small" color={THEME_COLORS.primary} />
                    <Text className="text-[11px] font-elms-regular text-dark/35">
                        Preparing search...
                    </Text>
                </View>
            )}

            {/* Search results label */}
            {isSearching && (
                <View className="mb-3">
                    <View className="flex-row items-baseline gap-2 mb-2">
                        <Text className="text-base font-elms-bold text-dark">Results for</Text>
                        <Text className="text-base font-elms-bold italic text-dark">"{committedQuery}"</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setRequestVisible(true)}
                        activeOpacity={0.7}
                        className="self-start"
                    >
                        <Text className="text-[11px] font-elms-bold uppercase tracking-[0.1em] text-dark/35">
                            Can't find what you need? <Text className="text-dark/60">Request it</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isSearching && (
                <Text className="text-[11px] font-elms-bold uppercase tracking-[0.12em] text-dark/40 mb-1">
                    {mode === 'recommended' ? 'Recommended for you' : 'Picked at random'}
                </Text>
            )}
        </View>
    );

    if (!translated) return <SearchSkeleton />;

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-background">
                    <ChartList
                        key={isSearching ? `search-${committedQuery}-${searchCategory}` : mode}
                        searchQuery={isSearching ? committedQuery : ''}
                        searchVector={isSearching ? committedVector : null}
                        searchCategory={isSearching ? searchCategory : undefined}
                        renderHeader={renderHeader}
                        pageLimit={5}
                        recommended={!isSearching && mode === 'recommended'}
                        random={!isSearching && mode === 'random'}
                        // The category browsing block only makes sense in the
                        // passive browse modes, not mid-search-results.
                        interruptComponent={
                            !isSearching ? (
                                <CategoryGrid
                                    onSelectTopic={(topicKey) => {
                                        setFilters((f) => ({ ...f, topics: [topicKey] }));
                                        setCommittedQuery(''); // stay in browse mode, just filtered
                                    }}
                                    onSeeAllTopics={() => setFilterSheetVisible(true)}
                                />
                            ) : undefined
                        }
                        interruptAfterIndex={3}
                    />
                </View>
            </TouchableWithoutFeedback>

            <FilterSheet
                visible={filterSheetVisible}
                initialFilters={filters}
                onClose={() => setFilterSheetVisible(false)}
                onApply={handleApplyFilters}
            />

            <RequestDataPopup
                visible={requestVisible}
                onClose={() => setRequestVisible(false)}
                prefillQuery={input}
            />
        </>
    );
}