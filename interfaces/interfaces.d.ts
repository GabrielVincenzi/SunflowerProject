// Input props
interface InputProps {
  label: string,
  placeholder: string,
  icon: ImageSourcePropType,
  secureTextEntry?: boolean,
  classname?: string,
  value: string,
  onChangeText: (text: string) => void,
}

interface PeriodOption {
  label: string;
  value: string;
}

interface GeoOption {
  label: string;
  value: string;
}

interface variableOption {
  label: string;
  value: string;
}

type Translations = {
  payload: Record<string, string>
}


// Styling props
interface ButtonProps {
  onPress?: () => void;
  title: string,
  IconLeft?: React.ComponentType<{ size?: number; color?: string }>,
  IconRight?: React.ComponentType<{ size?: number; color?: string }>,
  classname?: string,
  textClassname?: string,
}

interface CardProps {
  id: number;
  chart_id: string;
  title: string;
  description: string;
  db_name: string;
  vars: string;
  variableLabels: Record<string, string>;
  chart_type: string;
  category?: string;
  source?: string | null;
  featured?: boolean;
}

interface SavedCardProps {
  savedAt: string;
  data: CardProps;
}

interface QuestionProps {
  title: string;
  description?: string;
  image?: string | null;
  popupInfo?: any;
  popupContent?: React.ReactNode;
};

interface QuestionPopupProps<T = any> {
  visible: boolean; // parent controls mounting
  info?: T; // arbitrary info object passed from parent
  onClose: () => void; // called after exit animation completes
  title?: string;
  popupContent?: React.ReactNode; // optional custom content; if present, used instead of info rendering
};

interface PopupChoice {
  id: number;
  text: string;
}

type PopupQuestion = {
  questionId: number;
  objectId: string;
  title: string;
  body: string;
  explanation?: string | null;
  difficulty?: number | null;
  sponsor?: string | null;
  consecutiveCorrect: number;
  choices: PopupChoice[];
};

type GenericCardProps = {
  title: string;
  description?: string;
  path: RelativePathString;
  onPress?: () => void;
  backgroundColor?: string;
  borderColor?: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  icon?: React.ReactNode;
}

type SavedCardProps = {
  savedAt: string;
  data: CardProps;
};

type ChartProps = {
  screenWidth: number;
  screenHeight?: number;
  apiData: ApiResponse;
  xTickCount?: number;
  yTickCount?: number;
  height?: number;
  yDomainOverride?: {
    yMin?: number;
    yMax?: number;
  };
};

type HighlightProps = {
  value: number;
  description: string;
};

type AnimatedBarProps = {
  x: number;
  width: number;
  color: string;
  value: number;
  yScale: (v: number) => number;
  chartHeight: number;
};

interface SearchBarProps {
  placeholder: string;
  onPress?: () => void;
  value: string;
  editable?: boolean;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
  buttonLabel?: string;
}

type ChartListProps = {
  searchQuery?: string;
  searchCategory?: string;
  renderHeader?: React.ReactElement | (() => React.ReactElement) | null;
  pageLimit?: number;
  fetcher?: Fetcher;
  recommended?: boolean;
  excludeSeenDays?: number;
  random?: boolean;
  userId?: string;
};

type LegendItem = {
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendItem[];
  yUnitLabel?: string;
}

type HomeHeaderProps = {
  userName?: string;
  logo: ImageSourcePropType;
  onLogoPress?: () => void;
  onNotifPress?: () => void;
};

// API props
type AfterCursor = {
  lastSimilarity?: number | null;
  lastId?: number | null
} | null;

type AfterCursorRandom = {
  seed?: string | null;
  lastSortKey?: string | null;
  lastId?: number | null;
} | null;

type ApiAllChartResponseWithCursor = ApiAllChartResponse & {
  nextCursor?: number | AfterCursor | AfterCursorRandom | null;
};

type FetchChartParams = {
  db: string;
  variables: string;
  geos: string;
  startPeriod: string | null,
  endPeriod?: string | null,
  authFetch: AuthFetch;
}

type ApiAllChartResponse = {
  data: CardProps[];
  nextCursor: number | null;
  hasMore: boolean;
  limit: number;
};

type ApiRecommChartParams = {
  userId: string;
  limit?: number;
  lang?: string;
  excludeSeenDays: number;
  signal?: AbortSignal;
  afterCursor?: AfterCursor;
  authFetch: AuthFetch;
}

type ApiRandomChartParams = {
  limit: number;
  categories?: number;
  lang?: string;
  afterCursor?: AfterCursorRandom | null;
  signal?: AbortSignal | null;
  authFetch: AuthFetch;
}

type ApiResponse = {
  activeGeos: string[];
  activePeriods: string[];
  variableLabels?: Record<string, string>;
  series: Record<string, { value: number }[]>;
  palette?: dict;
}

type ApiDbResponse = {
  db: string;
  availableGeos: string,
  availablePeriods: string,
  dbSource: string,
}

type ApiEventRequest = {
  userId: string;
  objectId: string;
  action: string;
  time: string;
}

type ApiSavedEventsResponse = {
  data: SavedCardProps[];
};

type ApiUserQuestionsResponse = {
  userId: number;
  count: number;
  questions: ApiQuestionResponse[];
}

type ApiQuestionResponse = {
  questionId: number;
  objectId: number | null;
  title: string;
  body: string;
  explanation: string | null;
  difficulty: number;
  sponsor: string | null;
  sponsorBody: string | null;
  sponsorLink: string | null;
  consecutiveCorrect: number;
  choices: ApiChoiceResponse[];
}

type ApiChoiceResponse = {
  choiceId: number;
  content: string;
  isCorrect: boolean;
}

interface RequestDataPopupProps {
  visible: boolean;
  onClose: () => void;
  prefillQuery?: string;
}

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;


type Fetcher = (opts: {
  query?: string;
  category?: string;
  limit?: number;
  lang?: string;
  afterCursor?: number | null | undefined;
  signal?: AbortSignal;
  authFetch: AuthFetch;
}) => Promise<PaginatedResponse>;

interface SunButtonProps {
  text: string;
  onPress: () => void;
  className?: string;
  disabled?: boolean;
}

// Export Charts
type ExportChartProps = {
  chartRef: React.RefObject<ViewShot | null>;
  title: string;
  description: string;
  chartType: string;
  dataSource: string;
  activeGeos: string[];
  apiData: ApiResponse | undefined; // 👈 ADD THIS
};

interface ExportSheetProps {
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  exportError: string | null;
  title: string;
  windowWidth: number;
}

type ExportFormat = "png" | "csv";

interface ExportOption {
  format: ExportFormat;
  label: string;
  sublabel: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}

type ChartType =
  | 'bar'
  | 'line'
  | 'treemap'
  | 'sortedStream'
  | 'populationPyramid'
  | 'pie'
  | 'radar';

type SlideTheme = 'primary' | 'dark' | 'white';


interface ChartApiData {
  activeGeos: string[];
  activePeriods: string[];
  series: Record<string, { value: number }[]>;
}

// ─── StatCard config ──────────────────────────────────────────────────────────
interface StatCardConfig {
  id: string;
  category: string;
  emoji: string;
  chartType: ChartType;
  data: ChartApiData;
  headline: string;
  headlineUnit?: string;
  interpretiveLine: string;
  source: string;
  year: string;
  bgTheme: SlideTheme;
  tooltipText: string;
  expandRows?: Array<{ label: string; value: string }>;
}

// ─── Slider ───────────────────────────────────────────────────────────────────
interface MunicipalitySliderProps {
  municipalityName: string;
  provinceCode: string;
  population: number;
  year: string;
  cards: StatCardConfig[];
  onBack?: () => void;
  viewMode?: 'absolute' | 'perCapita';
  onViewModeChange?: (v: 'absolute' | 'perCapita') => void;
  onShareStat?: (card: StatCardConfig) => void;
}

// ─── Education Tools ───────────────────────────────────────────────────────────────────
type ManipulationTechniqueId =
  | 'truncateAxis'
  | 'cherryPickRange'
  | 'absoluteVsPercent'
  | 'missingDenominator'
  | 'smoothing';

interface TechniqueDef {
  id: ManipulationTechniqueId;
  label: string;
  shortHint: string;
  credibilityCostPerNotch: number;
}


// ─── Real chart data contract (matches fetchChartData / ApiResponse) ───────
interface ChartApiData {
  activeGeos: string[];
  activePeriods: string[];
  variableLabels?: Record<string, string>;
  series: Record<string, { value: number }[]>; // keyed e.g. "value_IT"
  palette?: string[];
}

interface ManipulatorScenario {
  id: string;
  sourceChartId?: string | number;
  title: string;
  targetClaim: string;
  unit: string;
  apiData: ChartApiData;
  seriesKey: string;
  realStory: string;
  sourceName: string;
  sourceUrl?: string;
}

// ─── Manipulation state ─────────────────────────────────────────────────────
interface ManipulationState {
  truncateAxis: number;
  cherryPickRange: number;
  absoluteVsPercent: 'absolute' | 'percent';
  missingDenominator: boolean;
  smoothing: number;
}