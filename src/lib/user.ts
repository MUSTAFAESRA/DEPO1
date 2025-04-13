import { executeQuery, executeRun, executeFirst } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer';
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'editor' | 'viewer';
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export async function getAllUsers(): Promise<User[]> {
  const result = await executeQuery<{ results: User[] }>(
    'SELECT * FROM users ORDER BY created_at DESC'
  );
  
  if (!result.success || !result.data) {
    return [];
  }
  
  return result.data.results;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await executeFirst<User>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await executeFirst<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function createUser(input: UserCreateInput): Promise<User | null> {
  const { username, email, password, full_name, role } = input;
  
  // E-posta adresinin benzersiz olduğunu kontrol et
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Bu e-posta adresi zaten kullanılıyor');
  }
  
  // Şifreyi hashle
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  // Yeni kullanıcı oluştur
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const result = await executeRun(
    `INSERT INTO users (id, username, email, password_hash, full_name, role, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, username, email, password_hash, full_name, role, now, now]
  );
  
  if (!result.success) {
    return null;
  }
  
  return getUserById(id);
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<User | null> {
  const user = await getUserById(id);
  if (!user) {
    return null;
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.username) {
    updates.push('username = ?');
    values.push(input.username);
  }
  
  if (input.email) {
    updates.push('email = ?');
    values.push(input.email);
  }
  
  if (input.password) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(input.password, salt);
    updates.push('password_hash = ?');
    values.push(password_hash);
  }
  
  if (input.full_name) {
    updates.push('full_name = ?');
    values.push(input.full_name);
  }
  
  if (input.role) {
    updates.push('role = ?');
    values.push(input.role);
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // ID'yi values dizisinin sonuna ekle
  values.push(id);
  
  const result = await executeRun(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  if (!result.success) {
    return null;
  }
  
  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await executeRun(
    'DELETE FROM users WHERE id = ?',
    [id]
  );
  
  return result.success && result.data?.changes === 1;
}

export async function verifyUserCredentials(input: UserLoginInput): Promise<User | null> {
  const { email, password } = input;
  
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return null;
  }
  
  return user;
}
