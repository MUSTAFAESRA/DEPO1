import { executeQuery, executeRun, executeFirst } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface AdCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string;
  platform: string;
  account_id: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface AdCampaignCreateInput {
  user_id: string;
  name: string;
  description: string;
  platform: string;
  account_id: string;
  budget: number;
  start_date: string;
  end_date: string;
  target_audience?: Record<string, any>; // Will be converted to JSON string
}

export interface AdCampaignUpdateInput {
  name?: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  target_audience?: Record<string, any>; // Will be converted to JSON string
}

export async function getAllAdCampaigns(userId: string): Promise<AdCampaign[]> {
  const result = await executeQuery<{ results: AdCampaign[] }>(
    'SELECT * FROM ad_campaigns WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  
  if (!result.success || !result.data) {
    return [];
  }
  
  return result.data.results;
}

export async function getAdCampaignById(id: string): Promise<AdCampaign | null> {
  const result = await executeFirst<AdCampaign>(
    'SELECT * FROM ad_campaigns WHERE id = ?',
    [id]
  );
  
  if (!result.success || !result.data) {
    return null;
  }
  
  return result.data;
}

export async function createAdCampaign(input: AdCampaignCreateInput): Promise<AdCampaign | null> {
  const { 
    user_id, 
    name, 
    description, 
    platform, 
    account_id, 
    budget, 
    start_date, 
    end_date, 
    target_audience 
  } = input;
  
  // Yeni reklam kampanyası oluştur
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = 'draft';
  
  const targetAudienceJson = target_audience ? JSON.stringify(target_audience) : '{}';
  
  const result = await executeRun(
    `INSERT INTO ad_campaigns (
      id, user_id, name, description, platform, account_id, budget, 
      start_date, end_date, status, target_audience, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, user_id, name, description, platform, account_id, budget, 
      start_date, end_date, status, targetAudienceJson, now, now
    ]
  );
  
  if (!result.success) {
    return null;
  }
  
  return getAdCampaignById(id);
}

export async function updateAdCampaign(id: string, input: AdCampaignUpdateInput): Promise<AdCampaign | null> {
  const campaign = await getAdCampaignById(id);
  if (!campaign) {
    return null;
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.name) {
    updates.push('name = ?');
    values.push(input.name);
  }
  
  if (input.description) {
    updates.push('description = ?');
    values.push(input.description);
  }
  
  if (input.budget) {
    updates.push('budget = ?');
    values.push(input.budget);
  }
  
  if (input.start_date) {
    updates.push('start_date = ?');
    values.push(input.start_date);
  }
  
  if (input.end_date) {
    updates.push('end_date = ?');
    values.push(input.end_date);
  }
  
  if (input.status) {
    updates.push('status = ?');
    values.push(input.status);
  }
  
  if (input.target_audience) {
    updates.push('target_audience = ?');
    values.push(JSON.stringify(input.target_audience));
  }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  // ID'yi values dizisinin sonuna ekle
  values.push(id);
  
  const result = await executeRun(
    `UPDATE ad_campaigns SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  if (!result.success) {
    return null;
  }
  
  return getAdCampaignById(id);
}

export async function deleteAdCampaign(id: string): Promise<boolean> {
  const result = await executeRun(
    'DELETE FROM ad_campaigns WHERE id = ?',
    [id]
  );
  
  return result.success && result.data?.changes === 1;
}
