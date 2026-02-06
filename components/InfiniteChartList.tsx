import { defaultLang } from "@/constants/utilities";
import { fetchAllChartDetails, fetchRandomCharts, fetchRecommendedCharts } from "@/services/api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, View } from "react-native";
import AnimatedItemWrapper from "./WrapperEntranceList";
import SunCard from "./cards/SunCard";

export default function InfiniteChartList({
    searchQuery = "",
    searchCategory,
    renderHeader,
    pageLimit = 5,
    fetcher = fetchAllChartDetails as Fetcher,
    recommended = false,
    excludeSeenDays = 2,
    random = false,
    userId,
}: ChartListProps) {
    const queryclient = useQueryClient();

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
                    userId,
                    limit: pageLimit,
                    lang: defaultLang,
                    excludeSeenDays,
                    afterCursor, // correctly typed: AfterCursor | undefined (we pass null which is allowed)
                    signal,
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
                }) as Promise<ApiAllChartResponseWithCursor>;
            }

            const numericAfterId =
                typeof pageParam === "number"
                    ? pageParam
                    : isAfterCursor(pageParam)
                        ? pageParam!.lastId
                        : undefined;

            return fetcher({
                query: searchQuery,
                category: searchCategory,
                lang: defaultLang,
                limit: pageLimit,
                afterId: pageParam,
                signal,
            }) as Promise<ApiAllChartResponseWithCursor>;
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage: ApiAllChartResponse & { hasMore?: boolean }) =>
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

    const renderItem = ({ item, index }: ListRenderItemInfo<CardProps>) => (
        <AnimatedItemWrapper index={index}>
            <SunCard {...item} />
        </AnimatedItemWrapper>
    );

    // resolve header prop either as node or function
    const headerNodeElement: React.ReactElement | null =
        typeof renderHeader === "function"
            ? (renderHeader as () => React.ReactElement)()
            : (renderHeader as React.ReactElement | null);

    // ListEmptyComponent: show loading indicator while initial load, otherwise a friendly empty state
    const EmptyComponent = () => {
        if (isLoading) {
            // initial loading: show only a loader where the data would be (header still visible)
            return (
                <View style={{ padding: 20, alignItems: "center" }}>
                    <ActivityIndicator />
                </View>
            );
        }

        // not loading & no data: show a helpful message
        return (
            <View style={{ marginTop: 16, paddingHorizontal: 12 }}>
                {error ? (
                    <Text style={{ color: "#ff4d4f" }}>Error: {(error as any).message ?? "Unknown"}</Text>
                ) : (
                    <Text style={{ color: "#7f8c8d", textAlign: "center" }}>
                        No plots found{searchQuery ? ` for "${searchQuery}"` : ""}
                    </Text>
                )}
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
            contentContainerStyle={{ paddingBottom: 120 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            initialNumToRender={pageLimit}
            maxToRenderPerBatch={pageLimit}
            windowSize={5}
        />
    );
}
