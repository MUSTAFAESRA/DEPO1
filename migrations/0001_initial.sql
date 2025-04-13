-- Migration number: 0001 	 2025-04-13
-- Sosyal Medya Yönetim Yazılımı Veritabanı Şeması

-- Kullanıcılar tablosu
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'editor', 'viewer')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sosyal Medya Hesapları tablosu
DROP TABLE IF EXISTS social_media_accounts;
CREATE TABLE social_media_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'reddit', 'telegram', 'discord', 'bluesky')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry DATETIME,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, account_id)
);

-- İçerikler tablosu
DROP TABLE IF EXISTS contents;
CREATE TABLE contents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  text TEXT,
  media_urls TEXT, -- JSON formatında saklanacak
  tags TEXT, -- JSON formatında saklanacak
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- İçerik Yayınları tablosu
DROP TABLE IF EXISTS content_publications;
CREATE TABLE content_publications (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  scheduled_time DATETIME,
  published_time DATETIME,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'published', 'failed')),
  platform_post_id TEXT,
  performance_metrics TEXT, -- JSON formatında saklanacak
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reklam Kampanyaları tablosu
DROP TABLE IF EXISTS ad_campaigns;
CREATE TABLE ad_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest')),
  account_id TEXT NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  budget REAL NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  target_audience TEXT, -- JSON formatında saklanacak
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reklamlar tablosu
DROP TABLE IF EXISTS ads;
CREATE TABLE ads (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_urls TEXT, -- JSON formatında saklanacak
  call_to_action TEXT,
  landing_page_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  performance_metrics TEXT, -- JSON formatında saklanacak
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Analitikler tablosu
DROP TABLE IF EXISTS analytics;
CREATE TABLE analytics (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  content_id TEXT REFERENCES contents(id) ON DELETE SET NULL,
  ad_id TEXT REFERENCES ads(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  cost_per_click REAL,
  cost_per_mille REAL,
  return_on_investment REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (content_id IS NOT NULL OR ad_id IS NOT NULL)
);

-- Yorumlar tablosu
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES content_publications(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  author_name TEXT,
  author_id TEXT,
  text TEXT NOT NULL,
  posted_at DATETIME,
  is_replied BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Yorum Yanıtları tablosu
DROP TABLE IF EXISTS comment_replies;
CREATE TABLE comment_replies (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  platform_reply_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bildirimler tablosu
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ayarlar tablosu
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL, -- JSON formatında saklanacak
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_key)
);

-- İndeksler
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_social_accounts_user_id ON social_media_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX idx_social_accounts_status ON social_media_accounts(status);
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_publications_content_id ON content_publications(content_id);
CREATE INDEX idx_publications_account_id ON content_publications(account_id);
CREATE INDEX idx_publications_status ON content_publications(status);
CREATE INDEX idx_publications_scheduled_time ON content_publications(scheduled_time);
CREATE INDEX idx_campaigns_user_id ON ad_campaigns(user_id);
CREATE INDEX idx_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX idx_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_campaigns_account_id ON ad_campaigns(account_id);
CREATE INDEX idx_ads_campaign_id ON ads(campaign_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_analytics_account_id ON analytics(account_id);
CREATE INDEX idx_analytics_content_id ON analytics(content_id);
CREATE INDEX idx_analytics_ad_id ON analytics(ad_id);
CREATE INDEX idx_analytics_date ON analytics(date);
CREATE INDEX idx_comments_publication_id ON comments(publication_id);
CREATE INDEX idx_comments_is_replied ON comments(is_replied);
CREATE INDEX idx_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX idx_replies_status ON comment_replies(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_key ON settings(setting_key);

-- Örnek admin kullanıcısı
INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES 
  ('1', 'admin', 'admin@example.com', '$2a$10$JwXdETcLJkKVBzUqpAiUre9xMCudGzb7wP4w8GEoN9D.zlDBjYP4W', 'Admin Kullanıcı', 'admin');
