import { categories } from "@/constants/utilities";
import { FlatList, View } from "react-native";
import QuestionCard from "./cards/QuestionCard";

const QuestionCarousel = () => {
    return (
        <FlatList
            data={categories}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <QuestionCard title={item} />}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            contentContainerStyle={{ paddingHorizontal: 16 }}
        />
    )
}

export default QuestionCarousel