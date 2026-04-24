import { useCallback, useState } from "react";

import { buildDataRows, buildMetadataRows, convertToCsv } from "@/functions/fileHandlers";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

export function useExportChart({
    chartRef,
    title,
    apiData
}: ExportChartProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // Capture the chart view as a base64 PNG string.
    const captureChart = useCallback(async () => {
        if (!chartRef.current) throw new Error("Chart view not ready.");
        const uri = await captureRef(chartRef, {
            format: "png",
            quality: 1,
            result: "tmpfile",
        });

        await Sharing.shareAsync(uri);
    }, [chartRef]);


    const exportCsvFiles = useCallback(async (apiData: ApiResponse) => {
        if (!apiData) throw new Error("No data available");

        const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

        try {
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (!isSharingAvailable) throw new Error("Sharing unavailable");

            // --- DATA CSV ---
            const dataRows = buildDataRows(apiData);
            const dataCsv = convertToCsv(dataRows);
            const dataUri = FileSystemLegacy.documentDirectory + `${safeTitle}_data.csv`;

            await FileSystemLegacy.writeAsStringAsync(dataUri, dataCsv, {
                encoding: FileSystemLegacy.EncodingType.UTF8,
            });

            await Sharing.shareAsync(dataUri, {
                dialogTitle: `Share ${safeTitle}_data.csv`,
                mimeType: "text/csv",
            });

            // --- METADATA CSV (after first share) ---
            const metadataRows = buildMetadataRows(apiData);
            const metadataCsv = convertToCsv(metadataRows);
            const metadataUri = FileSystemLegacy.documentDirectory + `${safeTitle}_metadata.csv`;

            await FileSystemLegacy.writeAsStringAsync(metadataUri, metadataCsv, {
                encoding: FileSystemLegacy.EncodingType.UTF8,
            });

            await Sharing.shareAsync(metadataUri, {
                dialogTitle: `Share ${safeTitle}_metadata.csv`,
                mimeType: "text/csv",
            });
        } catch (error) {
            console.error("Export error:", error);
        }
    }, [apiData]);

    const exportAs = useCallback(
        async (format: ExportFormat, apiData?: ApiResponse) => {
            setIsExporting(true);
            setExportError(null);
            try {
                if (format === "png") {
                    await captureChart();
                }
                if (format === "csv") {
                    if (!apiData) throw new Error("Missing data at export time");
                    await exportCsvFiles(apiData);
                }
            } catch (err: any) {
                console.error("[ExportChart]", err);
                setExportError(err?.message ?? "Export failed. Please try again.");
            } finally {
                setIsExporting(false);
            }
        },
        [captureChart, exportCsvFiles]
    );

    return { exportAs, isExporting, exportError };
}