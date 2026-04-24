export const buildDataRows = (apiData: ApiResponse) => {
    const { activeGeos, activePeriods, series } = apiData;

    const variables = Array.from(
        new Set(Object.keys(series).map((k) => k.split("_").slice(0, -1).join("_")))
    );

    const rows: Record<string, any>[] = [];

    activePeriods.forEach((period, i) => {
        activeGeos.forEach((geo) => {
            const row: Record<string, any> = {
                geo,
                time_period: period,
            };

            variables.forEach((variable) => {
                const key = `${variable}_${geo}`;
                row[variable] = series[key]?.[i]?.value ?? null;
            });

            rows.push(row);
        });
    });

    return rows;
};

export const buildMetadataRows = (apiData: ApiResponse) => {
    const { series, variableLabels } = apiData;

    const variables = Array.from(
        new Set(
            Object.keys(series).map((k) => k.split("_").slice(0, -1).join("_"))
        ));

    return variables.map((variable) => ({
        variable_code: variable,
        variable_label: variableLabels?.[variable] ?? variable,
    }));
};

export const convertToCsv = (rows: Record<string, any>[]) => {
    if (!rows.length) return "";

    const headers = Object.keys(rows[0]);

    return [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
        ),
    ].join("\n");
};