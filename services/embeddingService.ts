import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_ID = 'Xenova/multilingual-e5-small';
const MODEL_CACHED_KEY = 'model_cached_v1';

export type ModelStatus = 'idle' | 'downloading' | 'warming' | 'ready' | 'error';

// ─── Singleton state ────────────────────────────────────────────────────────
let extractor: FeatureExtractionPipeline | null = null;
let currentStatus: ModelStatus = 'idle';
let downloadProgress: number = 0;
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach(fn => fn());
}

function setStatus(s: ModelStatus) {
    currentStatus = s;
    notify();
}

// ─── Public readable state ──────────────────────────────────────────────────
export function getModelStatus(): ModelStatus { return currentStatus; }
export function getDownloadProgress(): number { return downloadProgress; }
export function subscribeToModel(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

// ─── Boot — call once from HomeIndex ───────────────────────────────────────
export async function initModel(): Promise<void> {
    if (extractor || currentStatus === 'downloading' || currentStatus === 'warming') return;

    try {
        const isCached = await AsyncStorage.getItem(MODEL_CACHED_KEY);

        // Distinguish download vs warm-up for UX purposes
        setStatus(isCached ? 'warming' : 'downloading');

        extractor = await pipeline('feature-extraction', MODEL_ID, {
            dtype: 'q8',
            device: 'cpu',
            progress_callback: (p: any) => {
                if (p?.progress != null && currentStatus === 'downloading') {
                    downloadProgress = p.progress / 100;
                    notify();
                }
            },
        });

        // Mark as cached for all future launches
        if (!isCached) {
            await AsyncStorage.setItem(MODEL_CACHED_KEY, '1');
        }

        setStatus('ready');
    } catch (e) {
        console.error('Model init failed', e);
        setStatus('error');
    }
}

// ─── Encode — waits for model if still loading ─────────────────────────────
export async function encodeQuery(query: string): Promise<number[]> {
    // If init was never called or failed, try again
    if (!extractor) await initModel();
    if (!extractor) throw new Error('Model unavailable');

    const output = await extractor(`query: ${query.trim()}`, {
        pooling: 'mean',
        normalize: true,
    });
    return Array.from(output.data as Float32Array);
}