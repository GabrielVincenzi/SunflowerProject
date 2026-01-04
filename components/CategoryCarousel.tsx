import { fetchCategories } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, View } from "react-native";
import CategoryCard from "./cards/CategoryCard";

const CategoryCarousel = () => {
    // Fetch saved graphs
    const queryClient = useQueryClient();
    const { data: categories, isPending: isPendingDbAvailable, error: errorDb } = useQuery({
        queryKey: ['dbs', "categories"],
        queryFn: () => fetchCategories(),
    });

    return (
        <FlatList
            data={categories}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <CategoryCard category={item} />}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            contentContainerStyle={{ paddingHorizontal: 16 }}
        />
    )
}

export default CategoryCarousel

