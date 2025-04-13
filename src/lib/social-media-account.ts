import { executeQuery, executeRun, executeFirst } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform: string;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
}

export interface SocialMediaAccountCreateInput {
  user_id: string;
  platform: string;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token?: string;
  token_expiry?: string;
}

export interface SocialMediaAccountUpdateInput {
  account_name?: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  status?: 'active' | 'expired' | 'revoked';
}

export async function getAllSocialMediaAccounts(userId: string): Promise<SocialMediaAccount[]> {
  const result = await executeQuery<{ results: SocialMediaAccount[] }>(
    'SELECT * FROM social_media_accounts WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  if (!result.success || !result.data) {
    return [];
  }
  
  return result.data.results;
}

export async function getSocialMediaAccountById(id: string): Promise<SocialMediaAccount | null> {
  const result = await executeFirst<SocialMediaAccount>(
    'SELECT * FROM social_media_accounts WHERE id = ?',
    [id]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function getSocialMediaAccountByPlatform(userId: string, platform: string): Promise<SocialMediaAccount | null> {
  const result = await executeFirst<SocialMediaAccount>(
    'SELECT * FROM social_media_accounts WHERE user_id = ? AND platform = ?',
    [userId, platform]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function createSocialMediaAccount(input: SocialMediaAccountCreateInput): Promise<SocialMediaAccount | null> {
  const { user_id, platform, account_name, account_id, access_token, refresh_token, token_expiry } = input;
  
  // Kullanıcının bu platformda zaten bir hesabı olup olmadığını kontrol et
  const existingAccount = await getSocialMediaAccountByPlatform(user_id, platform);
  if (existingAccount) {
    throw new Error('Bu platformda zaten bir hesabınız var');
  }
  
  // Yeni sosyal medya hesabı oluştur
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = 'active';
  
  const result = await executeRun(
    `INSERT INTO social_media_accounts (id, user_id, platform, account_name, account_id, access_token, refresh_token, token_expiry, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, user_id, platform, account_name, account_id, access_token, refresh_token || null, token_expiry || null, status, now, now]
  );
  
  if (!result.success) {
    return null;
  }
  
  return getSocialMediaAccountById(id);
}

export async function updateSocialMediaAccount(id: string, input: SocialMediaAccountUpdateInput): Promise<SocialMediaAccount | null> {
  const account = await getSocialMediaAccountById(id);
  if (!account) {
    return null;
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.account_name) {
    updates.push('account_name = ?');
    values.push(input.account_name);
  }
  
  if (input.access_token) {
    updates.push('access_token = ?');
    values.push(input.access_token);
  }
  
  if (input.refresh_token) {
    updates.push('refresh_token = ?');
    values.push(input.refresh_token);
  }
  
  if (input.token_expiry) {
    updates.push('token_expiry = ?');
    values.push(input.token_expiry);
  }
  
  if (input.status) {
    updates.push('status = ?');
    values.push(input.status);
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // ID'yi values dizisinin sonuna ekle
  values.push(id);
  
  const result = await executeRun(
    `UPDATE social_media_accounts SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  if (!result.success) {
    return null;
  }
  
  return getSocialMediaAccountById(id);
}

export async function deleteSocialMediaAccount(id: string): Promise<boolean> {
  const result = await executeRun(
    'DELETE FROM social_media_accounts WHERE id = ?',
    [id]
  );
  
  return result.success && result.data?.changes === 1;
}

export async function refreshTokenIfNeeded(id: string): Promise<SocialMediaAccount | null> {
  const account = await getSocialMediaAccountById(id);
  if (!account) {
    return null;
  }
  
  // Token süresi dolmuşsa yenile
  if (account.token_expiry && new Date(account.token_expiry) <= new Date()) {
    // Burada platform API'sine göre token yenileme işlemi yapılacak
    // Şimdilik sadece durumu 'expired' olarak işaretliyoruz
    return updateSocialMediaAccount(id, { status: 'expired' });
  }
  
  return account;
}
