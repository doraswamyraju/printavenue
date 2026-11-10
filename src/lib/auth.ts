import { query } from './db';
import { initDatabase } from './initDb';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  await initDatabase();
  const users = await query<any>(
    `SELECT id, email, name, role, password FROM users WHERE email = ?`,
    [email.trim().toLowerCase()]
  );

  if (users.length === 0) return null;
  const user = users[0];

  // Plain match for pre-seeded accounts
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

