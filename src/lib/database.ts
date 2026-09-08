import { env } from 'cloudflare:workers';
import { databaseClient } from './database-core';
export const contentDb = databaseClient(env.DB);
export function createAdminDb() { return databaseClient(env.DB, true); }
