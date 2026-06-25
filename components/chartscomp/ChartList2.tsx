import { defaultLang } from "@/constants/utilities";
import { fetchAllChartDetails, fetchRandomCharts, fetchRecommendedCharts } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useUser } from "@clerk/clerk-expo";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, View } from "react-native";
import SunCard from "../cards/SunCard";
import AnimatedItemWrapper from "./WrapperEntranceList";

// ─── Display item union ─────────────────────────────────────────────────────
// `charts` (below) stays a pure CardProps[] array — this is what pagination,
// deduplication, and getNextPageParam all operate on, completely unchanged
// from the original implementation. `displayItems` is a SEPARATE derived
// array built only for rendering, where a single typed "interrupt" entry
// can be spliced in at a fixed position. Because displayItems is derived
// from `charts` via useMemo and never feeds back into the query state,
// onEndReached/hasNextPage math is untouched.

type ChartDisplayItem =
    | { kind: 'chart'; data: CardProps }
    | { kind: 'interrupt'; key: string };

interface ChartListProps {
    searchQuery?: string;
    searchCategory?: string;
    renderHeader?: React.ReactElement | (() => React.ReactElement) | null;
    pageLimit?: number;
    recommended?: boolean;
    excludeSeenDays?: number;
    random?: boolean;
    /**
     * If provided, renders this element as its own row after the Nth chart
     * card (1-indexed position counted among chart cards only — the
     * interrupt itself doesn't count toward the position). Pass `null`/
     * omit to disable. Re-renders fresh each time charts changes length
     * across the threshold, but only mounts once since key is stable.
     */
    interruptComponent?: React.ReactElement;
    interruptAfterIndex?: number; // default 3
}

export default function ChartList({
    searchQuery = "",
    searchCategory,
    renderHeader,
    pageLimit = 5,
    recommended = false,
    excludeSeenDays = 2,
    random = false,
    interruptComponent,
    interruptAfterIndex = 3,
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

            const isAfterCursor = (p: any): p is Exclude<AfterCursor, null> => {
                return p !== null && typeof p === "object" && ("lastSimilarity" in p || "lastId" in p);
            };

            const isAfterCursorRandom = (p: any): p is Exclude<AfterCursorRandom, null> => {
                return p !== null && typeof p === "object" && ("seed" in p || "lastSortKey" in p || "lastId" in p);
            };

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

    // Pure, unmodified pagination data — exactly as before.
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

    // Derived render list — splices in the interrupt at a fixed position
    // among chart cards. This array is ONLY used for rendering; pagination
    // (onEndReached, hasNextPage, fetchNextPage) all reference `charts`
    // and the underlying query state directly, never this derived list.
    const displayItems: ChartDisplayItem[] = useMemo(() => {
        if (!interruptComponent) {
            return charts.map((c) => ({ kind: 'chart', data: c }));
        }

        const out: ChartDisplayItem[] = [];
        charts.forEach((chart, idx) => {
            out.push({ kind: 'chart', data: chart });
            // Insert immediately after the Nth chart card (1-indexed).
            // Only insert once — guarded by checking we haven't already
            // added an interrupt and the list is long enough to reach it.
            if (idx + 1 === interruptAfterIndex) {
                out.push({ kind: 'interrupt', key: '__category_interrupt__' });
            }
        });
        return out;
    }, [charts, interruptComponent, interruptAfterIndex]);

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

    const renderItem = ({ item, index }: ListRenderItemInfo<ChartDisplayItem>) => {
        if (item.kind === 'interrupt') {
            // Not wrapped in AnimatedItemWrapper's index-based stagger since
            // it's a one-off block, not a list card.
            return <View className="px-6">{interruptComponent}</View>;
        }

        return (
            <AnimatedItemWrapper index={index}>
                <View className="px-6">
                    <SunCard {...item.data} />
                </View>
            </AnimatedItemWrapper>
        );
    };

    const headerNodeElement: React.ReactElement | null =
        typeof renderHeader === "function"
            ? (renderHeader as () => React.ReactElement)()
            : (renderHeader as React.ReactElement | null);

    const EmptyComponent = () => {
        if (isLoading) return <View className="py-20 items-center"><ActivityIndicator color="#F7CE46" /></View>;
        return (
            <View className="mt-20 px-10 items-center">
                <View className="w-12 h-[2px] bg-primary mb-6" />
                <Text className="text-dark font-elms-bold text-center text-xl leading-snug">
                    {error ? "Something went wrong" : `No charts found for "${searchCategory}"`}
                </Text>
                <Text className="mt-3 text-dark/40 font-elms-regular text-center text-[13px]">
                    Check your connection or try a different search.
                </Text>
            </View>
        );
    };

    return (
        <FlatList<ChartDisplayItem>
            data={displayItems}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) =>
                item.kind === 'interrupt' ? item.key : String(item.data.chart_id ?? item.data.id)
            }
            ListHeaderComponent={headerNodeElement ?? undefined}
            ListEmptyComponent={<EmptyComponent />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={isRefetching}
            contentContainerStyle={{ paddingRight: 8, paddingBottom: 120, overflow: 'visible' }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            initialNumToRender={pageLimit + 1} // +1 to account for the interrupt row
            maxToRenderPerBatch={pageLimit}
            windowSize={5}
        />
    );
}