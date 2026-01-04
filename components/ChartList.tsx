import { defaultLang } from "@/constants/utilities";
import { fetchAllChartDetails } from "@/services/api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, ListRenderItemInfo, Text, View } from "react-native";
import AnimatedItemWrapper from "./WrapperEntranceList";
import SunCard from "./cards/SunCard";

export default function InfiniteChartList({
    searchQuery = "",
    searchCategory,
    renderHeader,
    pageLimit = 5,
    fetcher = fetchAllChartDetails as Fetcher,
}: ChartListProps) {
    const queryclient = useQueryClient();

    const {
        data,
        isLoading,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        refetch,
        isRefetching,
        error,
    } = useInfiniteQuery({
        queryKey: ["charts", searchQuery, searchCategory, pageLimit],
        queryFn: ({ pageParam = undefined, signal }: { pageParam?: number | undefined; signal?: AbortSignal | undefined; }) => {
            return fetcher({
                query: searchQuery,
                category: searchCategory,
                lang: defaultLang,
                limit: pageLimit,
                afterId: pageParam ?? undefined,
                signal,
            });
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: ApiAllChartResponse, pages) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
    });

    const charts: CardProps[] = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((p) => p.data ?? []);
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

    const onRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

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
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={headerNodeElement ?? undefined}
            ListEmptyComponent={<EmptyComponent />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshing={isRefetching}
            onRefresh={onRefresh}
            contentContainerStyle={{ paddingBottom: 120 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            initialNumToRender={pageLimit}
            maxToRenderPerBatch={pageLimit}
            windowSize={5}
        />
    );
}
