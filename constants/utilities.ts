// Theme Colors
export const THEME_COLORS = {
    primary: '#FCD34D',
    secondary: '#D99201',
    accent: '#3B82F6',
    marked: '#84CC16',
    background: '#FDFCF6',
    dark: '#343a40',
    grey: '#495057',
    light: '#f8f9fa',
} as const;
//  new colors: #FCD34D yellow, #3B82F6 blue, #84CC16 green
//  old colors: #F2BB16 yellow, #118C8C blue, #7C8C2E green


// Chart colors
export const CHART_COLORS = [
    "#EE9B00", "#CA6702", "#0A9396", "#BB3E03", "#005F73", "#001219", "#AE2012", "#94D2BD", "#E9D8A6", "#9B2226"
]


// Chart selection config (e.g. which charts allow multi-geo or multi-period selection
export const chartSelectionConfig: Record<
    string,
    { allowMultiGeo?: boolean; allowMultiPeriod?: boolean }
> = {
    radar: { allowMultiGeo: false, allowMultiPeriod: false },
    tree: { allowMultiGeo: false, allowMultiPeriod: false },
    pie: { allowMultiGeo: false, allowMultiPeriod: false },
    hist: { allowMultiPeriod: false },
    pyramid: { allowMultiPeriod: false },
    circles: { allowMultiPeriod: false },
};


// Chart dimensions and styling
export const FILTER_BUTTON_SIZE = 48;
export const HEIGHT = 280;
export const animationDuration = 1500;
export const margin = { top: 20, right: 20, bottom: 40, left: 40 };

// Chart exports
export const EXPORT_OPTIONS: ExportOption[] = [
    {
        format: "png",
        label: "PNG Image",
        sublabel: "High-resolution bitmap - shareable anywhere",
        icon: "image",
    },
    {
        format: "csv",
        label: "CSV table",
        sublabel: "Simple dataset - download from the source",
        icon: "image",
    },
];

// Text
export const CHART_TEXT_FONT = 14;
export const CHART_AXIS_FONT = 12;
export const SOURCE_FONT = 10;
export const LEGEND_FONT = 12;


// User-defined variables
export const defaultGeo = "IT"
export const defaultLang = "en"

export const LANGUAGE_TITLES = [
    'Choose your language',
    'Scegli la tua lingua',
    'Choisissez votre langue',
    'Sprache auswählen',
    'Elige tu idioma',
    'Kies je taal',
];