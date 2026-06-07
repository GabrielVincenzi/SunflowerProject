import dayjs from "dayjs";

export function normalizePeriod(period: string | null): string | null {
    if (!period) return null;
    const s = period.trim();

    // Year: "2022"
    const yearMatch = /^(\d{4})$/.exec(s);
    if (yearMatch) {
        const year = Number(yearMatch[1]);
        return new Date(Date.UTC(year, 0, 1)).toISOString(); // start of year
    }

    // Quarter: "2022Q3"
    const qMatch = /^(\d{4})Q([1-4])$/i.exec(s);
    if (qMatch) {
        const year = Number(qMatch[1]);
        const quarter = Number(qMatch[2]);
        const month = (quarter - 1) * 3;
        return new Date(Date.UTC(year, month, 1)).toISOString(); // start of quarter
    }

    // Already full date?
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();

    return null;
}

export function buildPeriodOptions(periodRange?: string): PeriodOption[] {
    if (!periodRange) return [];

    const isQuarterString = (s: string) => !!s && /^\d{4}-?Q[1-4]$/i.test(s);
    const normalizeQuarter = (s: string) => s.replace("-", "").toUpperCase(); // "2023-Q1" -> "2023Q1"

    const parts = periodRange.split("+").map(s => s.trim()).filter(Boolean);

    // If more than 2 pieces, treat as a list of specific periods
    if (parts.length !== 2) {
        return parts.map(p => ({ label: p, value: p }));
    }

    const [rawStart, rawEnd] = parts;

    // If either side is quarter-like, produce quarters
    if (isQuarterString(rawStart) || isQuarterString(rawEnd)) {
        const startNorm = normalizeQuarter(rawStart);
        const endNorm = normalizeQuarter(rawEnd);

        const parseQuarter = (qstr: string) => {
            const year = parseInt(qstr.slice(0, 4), 10);
            const q = parseInt(qstr.slice(5), 10); // e.g. "2023Q1" -> '1'
            return { year, q };
        };

        const start = parseQuarter(startNorm);
        const end = parseQuarter(endNorm);

        const periods = [];
        let curYear = start.year;
        let curQ = start.q;

        while (curYear < end.year || (curYear === end.year && curQ <= end.q)) {
            const value = `${curYear}Q${curQ}`;
            periods.push({ label: value, value });
            // advance quarter
            curQ += 1;
            if (curQ > 4) {
                curQ = 1;
                curYear += 1;
            }
        }

        return periods;
    }

    // Otherwise produce yearly periods. Accept YYYY or full date strings.
    const getYear = (s: string) => {
        if (/^\d{4}$/.test(s)) return parseInt(s, 10);
        const d = dayjs(s);
        if (!d.isValid()) return NaN;
        return d.year();
    };

    const startYear = getYear(rawStart);
    const endYear = getYear(rawEnd);
    if (Number.isNaN(startYear) || Number.isNaN(endYear) || startYear > endYear) return [];

    const years = [];
    for (let y = startYear; y <= endYear; y++) {
        const str = `${y}`;
        years.push({ label: str, value: str });
    }
    return years;
}

// Date helpers for quarterly and monthly data
export function detectGranularity(periods: Date[]): "year" | "quarter" | "month" {
    if (!periods.length) return "year";
    const months = periods.map(d => d.getFullYear() * 12 + d.getMonth());
    if (new Set(months).size === periods.length && periods.length > 1) {
        const years = periods.map(d => d.getFullYear());
        // if all same year or months increment by 1 → monthly
        const diffs = months.slice(1).map((m, i) => m - months[i]);
        if (diffs.every(d => d === 1)) return "month";
        return new Set(years).size < periods.length ? "quarter" : "year";
    }
    const years = periods.map(d => d.getFullYear());
    return new Set(years).size < periods.length ? "quarter" : "year";
}

export function formatPeriod(date: Date, granularity: "year" | "quarter" | "month"): string {
    if (granularity === "year") return date.getFullYear().toString();
    if (granularity === "month") {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        return `${y}M${m}`;
    }
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `${year}Q${quarter}`;
}

export function parsePeriod(s: string): Date {
    const datePart = s.split("T")[0]; // strip time component
    const [year, month = "1", day = "1"] = datePart.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
}