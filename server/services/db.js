import { DatabaseService } from './database.js';

// Shared database instance for the entire server lifecycle
const db = new DatabaseService();

let initPromise = null;

export async function ensureDbInitialized() {
  if (db.isInitialized) return db;
  if (!initPromise) {
    initPromise = db
      .initialize()
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}

export function getDb() {
  return db;
}

export { db };
