import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'printavenue.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: sqlite3.Database | null = null;

export function getDatabase(): sqlite3.Database {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH);
  }
  return dbInstance;
}

export function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
}

export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

