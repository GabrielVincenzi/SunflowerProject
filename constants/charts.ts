import SunBarChart from "@/components/charts/SunBarChart";
import SunHeatStripe from "@/components/charts/SunHeatStripe";
import SunHorizontalBarChart from "@/components/charts/SunHorizontalBarChart";
import SunHorizontalRangeChart from "@/components/charts/SunHorizontalRangeChart";
import SunLineChart from "@/components/charts/SunLineChart";
import SunMultiVerticalChart from "@/components/charts/SunMultiVerticalChart";
import SunPackedCircleChart from "@/components/charts/SunPackedCircleChart";
import SunPieChart from "@/components/charts/SunPieChart";
import SunPopulationPyramidChart from "@/components/charts/SunPopulationPyramidChart";
import SunProportionalAreaChart from "@/components/charts/SunProportionalAreaChart";
import SunRadarChart from "@/components/charts/SunRadarChart";
import SunSortedStreamChart from "@/components/charts/SunSortedStreamChart";
import SunStackedAreaChart from "@/components/charts/SunStackedAreaChart";
import SunStackedBarChart from "@/components/charts/SunStackedBarChart";
import SunTreemapChart from "@/components/charts/SunTreemapChart";
import SunVerticalRangeChart from "@/components/charts/SunVerticalRangeChart";

// ── COLOR ACCESSIBILITY PALETTES ─────────────────────────────────────────────
export const CHART_PALETTES = {
    default: { name: "Sunburst", colors: ["#EE9B00", "#CA6702", "#0A9396", "#BB3E03", "#005F73", "#001219", "#AE2012"], colorblindSafe: false },
    nordic: { name: "Nordic", colors: ["#5B8DB8", "#E07B54", "#6BAA75", "#B5838D", "#7B9E87", "#C9A96E", "#8B7FB8"], colorblindSafe: false },
    ink: { name: "Ink & Dust", colors: ["#141414", "#3D3D3D", "#6B6B6B", "#9E9E9E", "#C5C5C5", "#E0E0E0", "#F7CE46"], colorblindSafe: false },
    terracotta: { name: "Terracotta", colors: ["#C0392B", "#E67E22", "#F39C12", "#D4AC0D", "#7D6608", "#A04000", "#641E16"], colorblindSafe: false },
    ocean: { name: "Deep Ocean", colors: ["#1A237E", "#1565C0", "#0288D1", "#00838F", "#00695C", "#2E7D32", "#558B2F"], colorblindSafe: false },
    tableau10: { name: "Tableau 10", colors: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1"], colorblindSafe: false },
    wong: { name: "Wong 8", colors: ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00"], colorblindSafe: true },
    ibm: { name: "IBM Carbon", colors: ["#648FFF", "#785EF0", "#DC267F", "#FE6100", "#FFB000", "#001141", "#0043CE"], colorblindSafe: true },
    okabe: { name: "Okabe-Ito", colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"], colorblindSafe: true },
} as const;

export const CHART_REGISTRY = {
    line: { component: SunLineChart, label: "Line", icon: "activity", group: "time_series" },
    areaStacked: { component: SunStackedAreaChart, label: "Stacked Area", icon: "layers", group: "time_series" },
    areaProp: { component: SunProportionalAreaChart, label: "Proportional", icon: "bar-chart-2", group: "time_series" },
    heatstripe: { component: SunHeatStripe, label: "Heat Stripe", icon: "grid", group: "time_series" },
    sortedStream: { component: SunSortedStreamChart, label: "Stream", icon: "wind", group: "time_series" },
    horizRange: { component: SunHorizontalRangeChart, label: "Horizontal Range", icon: "arrow-right", group: "time_series" },
    vertRange: { component: SunVerticalRangeChart, label: "Vertical Range", icon: "arrow-down", group: "time_series" },
    hist: { component: SunBarChart, label: "Histogram", icon: "bar-chart", group: "distribution" },
    barStacked: { component: SunStackedBarChart, label: "Stacked Bar", icon: "bar-chart-2", group: "distribution" },
    barHoriz: { component: SunHorizontalBarChart, label: "Horizontal Bar", icon: "bar-chart", group: "distribution" },
    circles: { component: SunPackedCircleChart, label: "Bubbles", icon: "circle", group: "distribution" },
    pyramid: { component: SunPopulationPyramidChart, label: "Pyramid", icon: "triangle", group: "distribution" },
    multiVertRange: { component: SunMultiVerticalChart, label: "Multi Vertical Range", icon: "chevrons-up", group: "distribution" },
    pie: { component: SunPieChart, label: "Pie", icon: "pie-chart", group: "comparison" },
    tree: { component: SunTreemapChart, label: "Treemap", icon: "layout", group: "comparison" },
    radar: { component: SunRadarChart, label: "Radar", icon: "target", group: "comparison" },
} as const;