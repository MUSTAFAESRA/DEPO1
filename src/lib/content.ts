import { executeQuery, executeRun, executeFirst } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Content {
  id: string;
  user_id: string;
  title: string;
  text: string;
  media_urls: string; // JSON string
  tags: string; // JSON string
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ContentCreateInput {
  user_id: string;
  title: string;
  text: string;
  media_urls?: string[]; // Will be converted to JSON string
  tags?: string[]; // Will be converted to JSON string
}

export interface ContentUpdateInput {
  title?: string;
  text?: string;
  media_urls?: string[]; // Will be converted to JSON string
  tags?: string[]; // Will be converted to JSON string
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
}

export async function getAllContents(userId: string): Promise<Content[]> {
  const result = await executeQuery<{ results: Content[] }>(
    'SELECT * FROM contents WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  if (!result.success || !result.data) {
    return [];
  }
  
  return result.data.results;
}

export async function getContentById(id: string): Promise<Content | null> {
  const result = await executeFirst<Content>(
    'SELECT * FROM contents WHERE id = ?',
    [id]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function createContent(input: ContentCreateInput): Promise<Content | null> {
  const { user_id, title, text, media_urls, tags } = input;
  
  // Yeni içerik oluştur
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = 'draft';
  
  const mediaUrlsJson = media_urls ? JSON.stringify(media_urls) : '[]';
  const tagsJson = tags ? JSON.stringify(tags) : '[]';
  
  const result = await executeRun(
    `INSERT INTO contents (id, user_id, title, text, media_urls, tags, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, user_id, title, text, mediaUrlsJson, tagsJson, status, now, now]
  );
  
  if (!result.success) {
    return null;
  }
  
  return getContentById(id);
}

export async function updateContent(id: string, input: ContentUpdateInput): Promise<Content | null> {
  const content = await getContentById(id);
  if (!content) {
    return null;
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.title) {
    updates.push('title = ?');
    values.push(input.title);
  }
  
  if (input.text) {
    updates.push('text = ?');
    values.push(input.text);
  }
  
  if (input.media_urls) {
    updates.push('media_urls = ?');
    values.push(JSON.stringify(input.media_urls));
  }
  
  if (input.tags) {
    updates.push('tags = ?');
    values.push(JSON.stringify(input.tags));
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
    `UPDATE contents SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  if (!result.success) {
    return null;
  }
  
  return getContentById(id);
}

export async function deleteContent(id: string): Promise<boolean> {
  const result = await executeRun(
    'DELETE FROM contents WHERE id = ?',
    [id]
  );
  
  return result.success && result.data?.changes === 1;
}

export async function publishContent(contentId: string, accountId: string, scheduledTime?: string): Promise<boolean> {
  const content = await getContentById(contentId);
  if (!content) {
    return false;
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = scheduledTime ? 'scheduled' : 'published';
  
  const result = await executeRun(
    `INSERT INTO content_publications (id, content_id, account_id, scheduled_time, published_time, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, contentId, accountId, scheduledTime || null, scheduledTime ? null : now, status, now, now]
  );
  
  if (!result.success) {
    return false;
  }
  
  // İçerik durumunu güncelle
  await updateContent(contentId, { status });
  
  return true;
}
