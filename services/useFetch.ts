import { useEffect, useState } from "react";

const useFetch = <T>(
    fetchFunction: () => Promise<T>,
    autoFetch = true,
    deps: any[] = [],
    label = "useFetch"
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`[${label}] fetchData start`, { deps });
            const result = await fetchFunction();
            setData(result);
            console.log(`[${label}] fetchData success`);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err : new Error("An error occured"));
            console.error(`[${label}] fetchData error`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setData(null);
        setLoading(false);
        setError(null);
    };

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!autoFetch) return;
            console.log(`[${label}] effect run`, { autoFetch, deps });
            try {
                setLoading(true);
                const result = await fetchFunction();
                if (!mounted) return;
                setData(result);
            } catch (err) {
                if (!mounted) return;
                setError(err instanceof Error ? err : new Error("An error occured"));
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        run();
        return () => { mounted = false; };
        // include autoFetch so toggling it re-runs; deps control when to re-run
    }, [...deps, autoFetch, label]);

    return { data, loading, error, refetch: fetchData, reset };
};

export default useFetch;


// ID
//const { data: apiData, loading, refetch } = useFetch(() =>
//    fetchChartData({
//        db: chartDb,
//        variables: chartVariables,
//        geos: query.geos,
//        startPeriod: query.startPeriod,
//        endPeriod: query.endPeriod,
//    }), false, [query]
//);
//
//// immediate initial fetch on mount
//useEffect(() => {
//    refetch().catch(err => {
//        console.error('Initial chart fetch failed', err);
//    });
//}, []);