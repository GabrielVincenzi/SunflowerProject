import SunSavedCard from '@/components/cards/SunSavedCard';
import AnimatedItemWrapper from '@/components/WrapperEntranceList';
import { defaultLang } from '@/constants/utilities';
import { fetchSavedEvents } from '@/services/api';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FlatList, ListRenderItemInfo, ScrollView, Text, View } from 'react-native';

const Saved = () => {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const userId = user?.id ?? "";
    const queryclient = useQueryClient();
    const lang = defaultLang;

    // Fetch saved graphs
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['charts', 'saved', userId],
        queryFn: () => fetchSavedEvents(userId, lang),
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        enabled: !!userId,
    });

    if (!data || isLoading)
        return <Text className="text-neutral-600 text-center mt-10">No data available</Text>;

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
            className="flex-1 bg-background">
            {isSignedIn &&
                <View className="px-10 mt-8">
                    <Text className="text-dark mb-4 text-4xl tracking-tight font-elms-bold">Saved Charts</Text>
                    <FlatList<SavedCardProps>
                        data={data}
                        renderItem={({ item, index }: ListRenderItemInfo<SavedCardProps>) => (
                            <AnimatedItemWrapper index={index}>
                                <SunSavedCard {...item} />
                            </AnimatedItemWrapper>
                        )}
                        keyExtractor={(item) => item.data.id.toString()} // fine if id is string/non-numeric
                        numColumns={1}
                        className="mt-2 pb-32"
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />} // 16px vertical space
                    />
                </View>
            }
            {!isSignedIn && <Text>NOT Signed in </Text>}
        </ScrollView>
    )
}

export default Saved