// src/lib/versioning.ts
import buildInfoRaw from '../build-info.json';

export interface BuildMeta {
    env: 'DEV' | 'UAT' | 'PRODUCTION';
    branch: string;
    globalHash: string;
    coreHash: string;
    buildTime: string;
}

export interface PageVersion {
    hash: string;
    lastModified: string;
}

export interface BuildManifest {
    meta: BuildMeta;
    pages: Record<string, PageVersion>;
}

// Type-cast the raw JSON to our interface
const buildInfo = buildInfoRaw as unknown as BuildManifest;

/**
 * Returns the global build metadata (Env, Git Hash, Time).
 */
export function useBuildInfo(): BuildMeta {
    return buildInfo.meta;
}

/**
 * Returns the version hash for a specific page.
 * Useful for debugging if a specific page code is stale.
 * @param pageName - The filename of the page (e.g., 'Dashboard', 'Login')
 */
export function usePageVersion(pageName: string): string {
    const page = buildInfo.pages[pageName];
    if (!page) return 'unknown';
    // Return a composite of Global-Page hash
    return `${buildInfo.meta.globalHash}-${page.hash}`;
}

/**
 * Returns a color code based on the environment.
 */
export function getEnvColor(env: string): string {
    switch (env) {
        case 'PRODUCTION': return 'bg-red-600'; // High alert
        case 'UAT': return 'bg-orange-500';
        default: return 'bg-blue-600'; // Dev
    }
}