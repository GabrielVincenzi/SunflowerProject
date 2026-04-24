import { fetchCategories } from "@/services/api";
import { useAuthFetch } from "@/services/useAuthFetch";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, View } from "react-native";
import CategoryCard from "./cards/CategoryCard";

const CategoryCarousel = () => {
    const authFetch = useAuthFetch();
    const { data: categories, isLoading } = useQuery({
        queryKey: ['dbs', "categories"],
        queryFn: () => fetchCategories(authFetch),
    });

    if (isLoading) {
        return <ActivityIndicator color="#FCD34D" className="my-10" />;
    }

    return (
        <View className="w-full px-2">
            <FlatList
                className="overflow-visible"
                data={categories}
                scrollEnabled={false} // Handled by parent ScrollView
                renderItem={({ item, index }) => (
                    <CategoryCard category={item} index={index} />
                )}
                keyExtractor={(item) => item.toString()}
                contentContainerStyle={{ paddingRight: 8, paddingBottom: 120, overflow: 'visible' }}
            />
        </View>
    );
};

export default CategoryCarousel;