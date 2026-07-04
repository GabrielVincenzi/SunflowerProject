// services/useModelStatus.ts
import { useEffect, useState } from 'react';
import {
    getDownloadProgress,
    getModelStatus,
    ModelStatus,
    subscribeToModel,
} from './embeddingService';

export function useModelStatus() {
    const [status, setStatus] = useState<ModelStatus>(getModelStatus);
    const [progress, setProgress] = useState(getDownloadProgress);

    useEffect(() => {
        return subscribeToModel(() => {
            setStatus(getModelStatus());
            setProgress(getDownloadProgress());
        });
    }, []);

    const isReady = status === 'ready';
    const isDownloading = status === 'downloading';
    const isWarming = status === 'warming';
    const hasError = status === 'error';

    return { status, progress, isReady, isDownloading, isWarming, hasError };
}