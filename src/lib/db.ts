import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'database');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export function readTable<T = any>(tableName: string): T[] {
  const filePath = path.join(DB_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeTable<T = any>(tableName: string, records: T[]): void {
  const filePath = path.join(DB_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
}
