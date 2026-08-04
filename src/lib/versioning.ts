// src/lib/versioning.ts
import buildInfoRaw from '../build-info.json';

export interface BuildMeta { env: 'DEV' | 'UAT' | 'PRODUCTION'; branch: string; globalHash: string; coreHash: string; buildTime: string; appVersion: string; }

interface PageVersion { hash: string; lastModified: string; }

interface BuildManifest { meta: BuildMeta; pages: Record<string, PageVersion>; }

// Type-cast the raw JSON to our interface
const buildInfo = buildInfoRaw as unknown as BuildManifest;

/**
 * Returns the global build metadata (Env, Git Hash, Time).
 */
export function useBuildInfo(): BuildMeta {
    return buildInfo.meta;
}