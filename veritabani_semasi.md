# Sosyal Medya Yönetim Yazılımı - Veritabanı Şeması

## 1. Veritabanı Yapısı

Sosyal medya yönetim yazılımımız için PostgreSQL veritabanı kullanılacaktır. Veritabanı şeması, aşağıdaki tablolardan oluşacaktır:

## 2. Tablolar ve İlişkiler

### 2.1. Users (Kullanıcılar)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 2.2. SocialMediaAccounts (Sosyal Medya Hesapları)

```sql
CREATE TABLE social_media_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'reddit', 'telegram', 'discord', 'bluesky')),
  account_name VARCHAR(100) NOT NULL,
  account_id VARCHAR(100) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, account_id)
);

CREATE INDEX idx_social_accounts_user_id ON social_media_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX idx_social_accounts_status ON social_media_accounts(status);
```

### 2.3. Contents (İçerikler)

```sql
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  text TEXT,
  media_urls JSONB,
  tags JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at);
```

### 2.4. ContentPublications (İçerik Yayınları)

```sql
CREATE TABLE content_publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  published_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'published', 'failed')),
  platform_post_id VARCHAR(255),
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publications_content_id ON content_publications(content_id);
CREATE INDEX idx_publications_account_id ON content_publications(account_id);
CREATE INDEX idx_publications_status ON content_publications(status);
CREATE INDEX idx_publications_scheduled_time ON content_publications(scheduled_time);
```

### 2.5. AdCampaigns (Reklam Kampanyaları)

```sql
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  platform VARCHAR(30) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest')),
  account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  budget DECIMAL(12, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  target_audience JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_user_id ON ad_campaigns(user_id);
CREATE INDEX idx_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX idx_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_campaigns_account_id ON ad_campaigns(account_id);
```

### 2.6. Ads (Reklamlar)

```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  media_urls JSONB,
  call_to_action VARCHAR(50),
  landing_page_url TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ads_campaign_id ON ads(campaign_id);
CREATE INDEX idx_ads_status ON ads(status);
```

### 2.7. Analytics (Analitikler)

```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  content_id UUID REFERENCES contents(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  cost_per_click DECIMAL(10, 4),
  cost_per_mille DECIMAL(10, 4),
  return_on_investment DECIMAL(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (content_id IS NOT NULL OR ad_id IS NOT NULL)
);

CREATE INDEX idx_analytics_account_id ON analytics(account_id);
CREATE INDEX idx_analytics_content_id ON analytics(content_id);
CREATE INDEX idx_analytics_ad_id ON analytics(ad_id);
CREATE INDEX idx_analytics_date ON analytics(date);
```

### 2.8. Comments (Yorumlar)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id UUID NOT NULL REFERENCES content_publications(id) ON DELETE CASCADE,
  platform_comment_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(100),
  author_id VARCHAR(100),
  text TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  is_replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_publication_id ON comments(publication_id);
CREATE INDEX idx_comments_is_replied ON comments(is_replied);
```

### 2.9. CommentReplies (Yorum Yanıtları)

```sql
CREATE TABLE comment_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  platform_reply_id VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX idx_replies_status ON comment_replies(status);
```

### 2.10. Notifications (Bildirimler)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 2.11. Settings (Ayarlar)

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, setting_key)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_key ON settings(setting_key);
```

## 3. Veritabanı Diyagramı

Veritabanı şeması, aşağıdaki ilişkileri içermektedir:

- Bir kullanıcı (User) birden çok sosyal medya hesabına (SocialMediaAccount) sahip olabilir.
- Bir kullanıcı (User) birden çok içerik (Content) oluşturabilir.
- Bir içerik (Content) birden çok sosyal medya hesabında yayınlanabilir (ContentPublication).
- Bir kullanıcı (User) birden çok reklam kampanyası (AdCampaign) oluşturabilir.
- Bir reklam kampanyası (AdCampaign) birden çok reklam (Ad) içerebilir.
- Analitikler (Analytics), sosyal medya hesapları (SocialMediaAccount), içerikler (Content) ve reklamlar (Ad) ile ilişkilidir.
- Bir içerik yayını (ContentPublication) birden çok yorum (Comment) alabilir.
- Bir yorum (Comment) birden çok yanıt (CommentReply) alabilir.
- Bir kullanıcı (User) birden çok bildirim (Notification) alabilir.
- Bir kullanıcı (User) birden çok ayar (Setting) yapılandırabilir.

## 4. Veritabanı İndeksleri

Performans optimizasyonu için, sık sorgulanan sütunlar üzerinde indeksler oluşturulmuştur. Bu indeksler, sorgu performansını artıracak ve veritabanı yükünü azaltacaktır.

## 5. Veri Bütünlüğü

Veri bütünlüğünü sağlamak için, tablolar arasında referans bütünlüğü kısıtlamaları (foreign key constraints) tanımlanmıştır. Ayrıca, belirli sütunlar için CHECK kısıtlamaları kullanılarak, geçerli değerlerin girilmesi sağlanmıştır.

## 6. Veri Tipleri

Veritabanı şemasında, uygun veri tipleri kullanılmıştır:

- UUID: Benzersiz tanımlayıcılar için
- VARCHAR: Sınırlı uzunluktaki metinler için
- TEXT: Uzun metinler için
- JSONB: JSON formatındaki veriler için (PostgreSQL'in JSONB tipi, JSON verilerini daha verimli bir şekilde saklar ve sorgular)
- TIMESTAMP WITH TIME ZONE: Tarih ve saat bilgileri için
- DECIMAL: Hassas sayısal değerler için
- INTEGER: Tam sayılar için
- BOOLEAN: Doğru/yanlış değerleri için

## 7. Zaman Damgaları

Tüm tablolarda, kayıtların oluşturulma ve güncellenme zamanlarını takip etmek için `created_at` ve `updated_at` sütunları bulunmaktadır. Bu sütunlar, veri analizi ve denetim için önemlidir.
