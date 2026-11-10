import { readTable } from './db';
import { initDatabase } from './initDb';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  await initDatabase();
  const users = readTable<any>('users');
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) return null;

  if (user.password === password) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  return null;
}
