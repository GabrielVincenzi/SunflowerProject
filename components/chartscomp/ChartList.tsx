import { defaultLang } from "@/constants/utilities";
import { fetchAllChartDetails, fetchRandomCharts, fetchRecommendedCharts } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useUser } from "@clerk/clerk-expo";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, View } from "react-native";
import SunCard from "../cards/SunCard";
import AnimatedItemWrapper from "./WrapperEntranceList";

export default function ChartList({
    searchQuery = "",
    searchCategory,
    renderHeader,
    pageLimit = 5,
    recommended = false,
    excludeSeenDays = 2,
    random = false,
}: ChartListProps) {
    const queryclient = useQueryClient();
    const authFetch = useAuthFetch();
    const { user } = useUser();
    const userId = user?.id ?? "";

    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
        isRefetching,
        error,
    } = useInfiniteQuery<ApiAllChartResponseWithCursor>({
        queryKey: recommended
            ? ["charts", "recommended", userId, pageLimit]
            : random
                ? ["charts", "random", pageLimit]
                : ["charts", "all", searchQuery, searchCategory, pageLimit],
        queryFn: ({ pageParam = null, signal }: { pageParam?: any; signal?: AbortSignal | undefined }) => {

            // Type guard for recommended cursor
            const isAfterCursor = (p: any): p is Exclude<AfterCursor, null> => {
                return p !== null && typeof p === "object" && ("lastSimilarity" in p || "lastId" in p);
            };

            // Type guard for random cursor
            const isAfterCursorRandom = (p: any): p is Exclude<AfterCursorRandom, null> => {
                return p !== null && typeof p === "object" && ("seed" in p || "lastSortKey" in p || "lastId" in p);
            };

            // Recommended
            if (recommended) {
                if (!userId) throw new Error("userId is required for recommended charts");

                const afterCursor: AfterCursor = isAfterCursor(pageParam) ? pageParam : null;

                return fetchRecommendedCharts({
                    limit: pageLimit,
                    lang: defaultLang,
                    excludeSeenDays,
                    afterCursor,
                    signal,
                    authFetch,
                });
            }

            // Random
            if (random) {
                const afterCursorRandom: AfterCursorRandom = isAfterCursorRandom(pageParam) ? pageParam : null;

                return fetchRandomCharts({
                    limit: pageLimit,
                    categories: 3,
                    lang: defaultLang,
                    afterCursor: afterCursorRandom,
                    signal,
                    authFetch,
                });
            }

            return fetchAllChartDetails({
                query: searchQuery,
                category: searchCategory,
                lang: defaultLang,
                limit: pageLimit,
                afterCursor: pageParam,
                signal,
                authFetch,
            });
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage: ApiAllChartResponseWithCursor) =>
            lastPage.hasMore ? lastPage.nextCursor : undefined,
        refetchOnWindowFocus: false,
    });

    const charts: CardProps[] = useMemo(() => {
        if (!data?.pages) return [];
        const seen = new Set<string>();
        const out: CardProps[] = [];
        for (const p of data.pages) {
            for (const item of p.data ?? []) {
                const key = String(item.chart_id ?? item.id);
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push(item);
                }
            }
        }
        return out;
    }, [data]);

    const throttle = <T extends (...args: any[]) => void>(fn: T, wait = 800) => {
        let last = 0;
        return (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - last >= wait) {
                last = now;
                // @ts-ignore
                fn(...args);
            }
        };
    };

    const handleLoadMore = useCallback(
        throttle(() => {
            if (!hasNextPage || isFetchingNextPage || isLoading) return;
            fetchNextPage();
        }, 800),
        [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]
    );

    const renderFooter = () =>
        isFetchingNextPage ? (
            <View style={{ padding: 12 }}>
                <ActivityIndicator />
            </View>
        ) : null;

    const renderItem = ({ item, index }: ListRenderItemInfo<any>) => (
        <AnimatedItemWrapper index={index}>
            <View className="px-6">
                <SunCard {...item} />
            </View>
        </AnimatedItemWrapper>
    );

    // resolve header prop either as node or function
    const headerNodeElement: React.ReactElement | null =
        typeof renderHeader === "function"
            ? (renderHeader as () => React.ReactElement)()
            : (renderHeader as React.ReactElement | null);

    // ListEmptyComponent: show loading indicator while initial load, otherwise a friendly empty state
    const EmptyComponent = () => {
        if (isLoading) return <View className="py-20 items-center"><ActivityIndicator color="#FCD34D" /></View>;
        return (
            <View className="mt-20 px-10 items-center">
                <View className="w-12 h-[2px] bg-[#FCD34D] mb-6" />
                <Text className="text-[#343a40] font-elms-bold text-center uppercase tracking-tighter text-2xl leading-tight">
                    {error ? "SYSTEM FAILURE" : `NO SIGNALS DETECTED\nFOR "${searchCategory}"`}
                </Text>
                <Text className="mt-4 text-[#6c757d] font-elms-regular text-center uppercase text-[10px] tracking-[0.3em]">
                    Check connection or refine search
                </Text>
            </View>
        );
    };

    return (
        <FlatList<CardProps>
            data={charts}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => String(item.chart_id ?? item.id)}
            ListHeaderComponent={headerNodeElement ?? undefined}
            ListEmptyComponent={<EmptyComponent />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={isRefetching}
            contentContainerStyle={{ paddingRight: 8, paddingBottom: 120, overflow: 'visible' }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            initialNumToRender={pageLimit}
            maxToRenderPerBatch={pageLimit}
            windowSize={5}
        />
    );
}
