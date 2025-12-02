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

    const [rawStart, rawEnd] = periodRange.split("+").map(s => s?.trim());
    if (!rawStart || !rawEnd) return [];

    const isQuarterString = (s: string) => !!s && /^\d{4}[-]?Q[1-4]$/i.test(s);
    const normalizeQuarter = (s: string) => s.replace("-", "").toUpperCase(); // "2023-Q1" -> "2023Q1"

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