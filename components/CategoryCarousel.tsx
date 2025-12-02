import { categories } from "@/constants/utilities";
import { FlatList, View } from "react-native";
import CategoryCard from "./cards/CategoryCard";

const CategoryCarousel = () => {
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

