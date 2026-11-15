import type { Store } from './db';
export function databaseMode(env?: NodeJS.ProcessEnv): 'pglite' | 'aurora-data-api' | 'neon';
export function neonUrl(env?: NodeJS.ProcessEnv, direct?: boolean): string;
export function createNeonStore(options?: {env?: NodeJS.ProcessEnv; direct?: boolean}): Store;
