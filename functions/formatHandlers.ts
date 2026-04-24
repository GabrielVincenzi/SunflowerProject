export function detectScale(maxAbsValue: number) {
    if (maxAbsValue >= 1_000_000) return { factor: 1_000_000, label: "Millions" };
    if (maxAbsValue >= 1_000) return { factor: 1_000, label: "Thousands" };
    return { factor: 1, label: "" };
}