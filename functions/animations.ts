import { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

export const popupEntering = SlideInDown
    .springify()
    .stiffness(500)
    .damping(0);

export const popupExiting = SlideOutDown
    .springify()
    .stiffness(200)
    .damping(0);

export const scrimEntering = FadeIn
    .duration(200);

export const scrimExiting = FadeOut
    .duration(300);