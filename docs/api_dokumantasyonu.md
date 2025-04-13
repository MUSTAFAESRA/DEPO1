# Sosyal Medya Yöneticisi API Dokümantasyonu

Bu dokümantasyon, Sosyal Medya Yöneticisi yazılımının API'lerini ve entegrasyon noktalarını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kimlik Doğrulama](#kimlik-doğrulama)
3. [Kullanıcı API'leri](#kullanıcı-apileri)
4. [Sosyal Medya Hesap API'leri](#sosyal-medya-hesap-apileri)
5. [İçerik API'leri](#içerik-apileri)
6. [Reklam API'leri](#reklam-apileri)
7. [Analitik API'leri](#analitik-apileri)
8. [Hata Kodları](#hata-kodları)
9. [Sınırlamalar](#sınırlamalar)
10. [Örnekler](#örnekler)

## Genel Bakış

Sosyal Medya Yöneticisi API'si, RESTful mimariye dayalı bir HTTP API'sidir. Tüm istekler ve yanıtlar JSON formatındadır. API, aşağıdaki temel URL'yi kullanır:

```
https://api.sosyalmedyayoneticisi.com/v1
```

Yerel geliştirme için:

```
http://localhost:3000/api/v1
```

## Kimlik Doğrulama

API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanır. Kimlik doğrulama için aşağıdaki adımları izleyin:

### 1. Oturum Açma

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "full_name": "User Name",
      "role": "admin"
    }
  }
}
```

### 2. Token Kullanımı

Tüm API isteklerinde, alınan token'ı `Authorization` başlığında kullanın:

```http
GET /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Yenileme

```http
POST /auth/refresh
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Kullanıcı API'leri

### Kullanıcıları Listeleme

```http
GET /users
```

Parametreler:
- `page` (isteğe bağlı): Sayfa numarası (varsayılan: 1)
- `limit` (isteğe bağlı): Sayfa başına öğe sayısı (varsayılan: 20)
- `role` (isteğe bağlı): Rol ile filtreleme (admin, manager, editor, viewer)

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id-1",
        "email": "user1@example.com",
        "full_name": "User One",
        "role": "admin",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "user-id-2",
        "email": "user2@example.com",
        "full_name": "User Two",
        "role": "editor",
        "created_at": "2025-01-02T00:00:00Z",
        "updated_at": "2025-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

### Kullanıcı Detayı

```http
GET /users/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id-1",
      "email": "user1@example.com",
      "full_name": "User One",
      "role": "admin",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

### Kullanıcı Oluşturma

```http
POST /users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure_password",
  "full_name": "New User",
  "role": "editor"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "new-user-id",
      "email": "newuser@example.com",
      "full_name": "New User",
      "role": "editor",
      "created_at": "2025-04-13T20:30:00Z",
      "updated_at": "2025-04-13T20:30:00Z"
    }
  }
}
```

### Kullanıcı Güncelleme

```http
PUT /users/{id}
Content-Type: application/json

{
  "full_name": "Updated User Name",
  "role": "manager"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "full_name": "Updated User Name",
      "role": "manager",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-04-13T20:35:00Z"
    }
  }
}
```

### Kullanıcı Silme

```http
DELETE /users/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Kullanıcı başarıyla silindi"
}
```

## Sosyal Medya Hesap API'leri

### Hesapları Listeleme

```http
GET /accounts
```

Parametreler:
- `page` (isteğe bağlı): Sayfa numarası (varsayılan: 1)
- `limit` (isteğe bağlı): Sayfa başına öğe sayısı (varsayılan: 20)
- `platform` (isteğe bağlı): Platform ile filtreleme (facebook, instagram, twitter, linkedin)
- `status` (isteğe bağlı): Durum ile filtreleme (active, expired, revoked)

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account-id-1",
        "user_id": "user-id",
        "platform": "facebook",
        "account_name": "My Facebook Page",
        "account_id": "fb-page-id",
        "status": "active",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "account-id-2",
        "user_id": "user-id",
        "platform": "instagram",
        "account_name": "My Instagram Account",
        "account_id": "ig-account-id",
        "status": "active",
        "created_at": "2025-01-02T00:00:00Z",
        "updated_at": "2025-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 4,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Hesap Detayı

```http
GET /accounts/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "account": {
      "id": "account-id-1",
      "user_id": "user-id",
      "platform": "facebook",
      "account_name": "My Facebook Page",
      "account_id": "fb-page-id",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

### Hesap Ekleme (OAuth Başlatma)

```http
POST /accounts/oauth/start
Content-Type: application/json

{
  "platform": "facebook"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "auth_url": "https://www.facebook.com/v18.0/dialog/oauth?client_id=..."
  }
}
```

### Hesap Ekleme (OAuth Tamamlama)

```http
POST /accounts/oauth/callback
Content-Type: application/json

{
  "platform": "facebook",
  "code": "oauth_code_from_redirect"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "account": {
      "id": "new-account-id",
      "user_id": "user-id",
      "platform": "facebook",
      "account_name": "New Facebook Page",
      "account_id": "fb-page-id",
      "status": "active",
      "created_at": "2025-04-13T20:40:00Z",
      "updated_at": "2025-04-13T20:40:00Z"
    }
  }
}
```

### Hesap Silme

```http
DELETE /accounts/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Hesap başarıyla silindi"
}
```

## İçerik API'leri

### İçerikleri Listeleme

```http
GET /contents
```

Parametreler:
- `page` (isteğe bağlı): Sayfa numarası (varsayılan: 1)
- `limit` (isteğe bağlı): Sayfa başına öğe sayısı (varsayılan: 20)
- `status` (isteğe bağlı): Durum ile filtreleme (draft, scheduled, published, failed)

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "contents": [
      {
        "id": "content-id-1",
        "user_id": "user-id",
        "title": "Sample Content",
        "text": "This is a sample content",
        "media_urls": ["https://example.com/image1.jpg"],
        "tags": ["sample", "test"],
        "status": "published",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "content-id-2",
        "user_id": "user-id",
        "title": "Scheduled Content",
        "text": "This content is scheduled",
        "media_urls": [],
        "tags": ["scheduled"],
        "status": "scheduled",
        "created_at": "2025-01-02T00:00:00Z",
        "updated_at": "2025-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "pages": 2
    }
  }
}
```

### İçerik Detayı

```http
GET /contents/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "content": {
      "id": "content-id-1",
      "user_id": "user-id",
      "title": "Sample Content",
      "text": "This is a sample content",
      "media_urls": ["https://example.com/image1.jpg"],
      "tags": ["sample", "test"],
      "status": "published",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "publications": [
        {
          "id": "pub-id-1",
          "content_id": "content-id-1",
          "account_id": "account-id-1",
          "platform": "facebook",
          "platform_content_id": "fb-post-id",
          "status": "published",
          "published_time": "2025-01-01T00:05:00Z",
          "created_at": "2025-01-01T00:00:00Z",
          "updated_at": "2025-01-01T00:05:00Z"
        }
      ]
    }
  }
}
```

### İçerik Oluşturma

```http
POST /contents
Content-Type: application/json

{
  "title": "New Content",
  "text": "This is a new content",
  "media_urls": ["https://example.com/image2.jpg"],
  "tags": ["new", "content"]
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "content": {
      "id": "new-content-id",
      "user_id": "user-id",
      "title": "New Content",
      "text": "This is a new content",
      "media_urls": ["https://example.com/image2.jpg"],
      "tags": ["new", "content"],
      "status": "draft",
      "created_at": "2025-04-13T20:45:00Z",
      "updated_at": "2025-04-13T20:45:00Z"
    }
  }
}
```

### İçerik Güncelleme

```http
PUT /contents/{id}
Content-Type: application/json

{
  "title": "Updated Content",
  "text": "This content has been updated",
  "tags": ["updated", "content"]
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "content": {
      "id": "content-id",
      "user_id": "user-id",
      "title": "Updated Content",
      "text": "This content has been updated",
      "media_urls": ["https://example.com/image2.jpg"],
      "tags": ["updated", "content"],
      "status": "draft",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-04-13T20:50:00Z"
    }
  }
}
```

### İçerik Yayınlama

```http
POST /contents/{id}/publish
Content-Type: application/json

{
  "account_ids": ["account-id-1", "account-id-2"],
  "scheduled_time": "2025-04-14T12:00:00Z"  // İsteğe bağlı, belirtilmezse hemen yayınlanır
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "content": {
      "id": "content-id",
      "status": "scheduled",
      "updated_at": "2025-04-13T20:55:00Z"
    },
    "publications": [
      {
        "id": "pub-id-1",
        "content_id": "content-id",
        "account_id": "account-id-1",
        "platform": "facebook",
        "status": "scheduled",
        "scheduled_time": "2025-04-14T12:00:00Z",
        "created_at": "2025-04-13T20:55:00Z",
        "updated_at": "2025-04-13T20:55:00Z"
      },
      {
        "id": "pub-id-2",
        "content_id": "content-id",
        "account_id": "account-id-2",
        "platform": "instagram",
        "status": "scheduled",
        "scheduled_time": "2025-04-14T12:00:00Z",
        "created_at": "2025-04-13T20:55:00Z",
        "updated_at": "2025-04-13T20:55:00Z"
      }
    ]
  }
}
```

### İçerik Silme

```http
DELETE /contents/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "İçerik başarıyla silindi"
}
```

## Reklam API'leri

### Kampanyaları Listeleme

```http
GET /campaigns
```

Parametreler:
- `page` (isteğe bağlı): Sayfa numarası (varsayılan: 1)
- `limit` (isteğe bağlı): Sayfa başına öğe sayısı (varsayılan: 20)
- `platform` (isteğe bağlı): Platform ile filtreleme (facebook, instagram, twitter, linkedin)
- `status` (isteğe bağlı): Durum ile filtreleme (draft, active, paused, completed)

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "campaign-id-1",
        "user_id": "user-id",
        "name": "Summer Sale Campaign",
        "description": "Promoting summer products",
        "platform": "facebook",
        "account_id": "account-id-1",
        "budget": 1000,
        "start_date": "2025-06-01T00:00:00Z",
        "end_date": "2025-06-30T23:59:59Z",
        "status": "draft",
        "target_audience": {
          "age_min": 18,
          "age_max": 65,
          "genders": ["male", "female"],
          "locations": ["US", "CA", "UK"]
        },
        "created_at": "2025-04-01T00:00:00Z",
        "updated_at": "2025-04-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Kampanya Detayı

```http
GET /campaigns/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign-id-1",
      "user_id": "user-id",
      "name": "Summer Sale Campaign",
      "description": "Promoting summer products",
      "platform": "facebook",
      "account_id": "account-id-1",
      "budget": 1000,
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-06-30T23:59:59Z",
      "status": "draft",
      "target_audience": {
        "age_min": 18,
        "age_max": 65,
        "genders": ["male", "female"],
        "locations": ["US", "CA", "UK"]
      },
      "created_at": "2025-04-01T00:00:00Z",
      "updated_at": "2025-04-01T00:00:00Z",
      "ads": [
        {
          "id": "ad-id-1",
          "campaign_id": "campaign-id-1",
          "name": "Summer Sale Ad 1",
          "status": "draft",
          "created_at": "2025-04-01T00:10:00Z",
          "updated_at": "2025-04-01T00:10:00Z"
        }
      ]
    }
  }
}
```

### Kampanya Oluşturma

```http
POST /campaigns
Content-Type: application/json

{
  "name": "New Campaign",
  "description": "New campaign description",
  "platform": "facebook",
  "account_id": "account-id-1",
  "budget": 500,
  "start_date": "2025-05-01T00:00:00Z",
  "end_date": "2025-05-31T23:59:59Z",
  "target_audience": {
    "age_min": 25,
    "age_max": 45,
    "genders": ["female"],
    "locations": ["US"]
  }
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "new-campaign-id",
      "user_id": "user-id",
      "name": "New Campaign",
      "description": "New campaign description",
      "platform": "facebook",
      "account_id": "account-id-1",
      "budget": 500,
      "start_date": "2025-05-01T00:00:00Z",
      "end_date": "2025-05-31T23:59:59Z",
      "status": "draft",
      "target_audience": {
        "age_min": 25,
        "age_max": 45,
        "genders": ["female"],
        "locations": ["US"]
      },
      "created_at": "2025-04-13T21:00:00Z",
      "updated_at": "2025-04-13T21:00:00Z"
    }
  }
}
```

### Kampanya Güncelleme

```http
PUT /campaigns/{id}
Content-Type: application/json

{
  "name": "Updated Campaign",
  "budget": 750,
  "status": "active"
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign-id",
      "user_id": "user-id",
      "name": "Updated Campaign",
      "description": "New campaign description",
      "platform": "facebook",
      "account_id": "account-id-1",
      "budget": 750,
      "start_date": "2025-05-01T00:00:00Z",
      "end_date": "2025-05-31T23:59:59Z",
      "status": "active",
      "target_audience": {
        "age_min": 25,
        "age_max": 45,
        "genders": ["female"],
        "locations": ["US"]
      },
      "created_at": "2025-04-01T00:00:00Z",
      "updated_at": "2025-04-13T21:05:00Z"
    }
  }
}
```

### Kampanya Silme

```http
DELETE /campaigns/{id}
```

Başarılı yanıt:

```json
{
  "success": true,
  "message": "Kampanya başarıyla silindi"
}
```

### Reklam Oluşturma

```http
POST /campaigns/{campaignId}/ads
Content-Type: application/json

{
  "name": "New Ad",
  "format": "image",
  "content": {
    "title": "Special Offer",
    "description": "Limited time offer",
    "image_url": "https://example.com/ad-image.jpg",
    "link": "https://example.com/offer"
  }
}
```

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "ad": {
      "id": "new-ad-id",
      "campaign_id": "campaign-id",
      "name": "New Ad",
      "format": "image",
      "content": {
        "title": "Special Offer",
        "description": "Limited time offer",
        "image_url": "https://example.com/ad-image.jpg",
        "link": "https://example.com/offer"
      },
      "status": "draft",
      "created_at": "2025-04-13T21:10:00Z",
      "updated_at": "2025-04-13T21:10:00Z"
    }
  }
}
```

## Analitik API'leri

### Genel Analitikler

```http
GET /analytics/overview
```

Parametreler:
- `start_date` (isteğe bağlı): Başlangıç tarihi (varsayılan: 30 gün önce)
- `end_date` (isteğe bağlı): Bitiş tarihi (varsayılan: bugün)
- `platforms` (isteğe bağlı): Platformlar (virgülle ayrılmış liste)

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-03-14T00:00:00Z",
      "end_date": "2025-04-13T23:59:59Z"
    },
    "metrics": {
      "followers": {
        "total": 25000,
        "change": 500,
        "change_percentage": 2.04,
        "by_platform": {
          "facebook": 10000,
          "instagram": 8000,
          "twitter": 5000,
          "linkedin": 2000
        }
      },
      "engagement": {
        "total": 15000,
        "change": 1200,
        "change_percentage": 8.7,
        "by_platform": {
          "facebook": 6000,
          "instagram": 5000,
          "twitter": 3000,
          "linkedin": 1000
        }
      },
      "impressions": {
        "total": 100000,
        "change": 5000,
        "change_percentage": 5.26,
        "by_platform": {
          "facebook": 40000,
          "instagram": 30000,
          "twitter": 20000,
          "linkedin": 10000
        }
      }
    },
    "charts": {
      "followers_growth": [
        {"date": "2025-03-14", "value": 24500},
        {"date": "2025-03-21", "value": 24700},
        {"date": "2025-03-28", "value": 24850},
        {"date": "2025-04-04", "value": 24900},
        {"date": "2025-04-11", "value": 25000}
      ],
      "engagement_by_day": [
        {"date": "2025-04-07", "value": 450},
        {"date": "2025-04-08", "value": 500},
        {"date": "2025-04-09", "value": 480},
        {"date": "2025-04-10", "value": 520},
        {"date": "2025-04-11", "value": 550},
        {"date": "2025-04-12", "value": 600},
        {"date": "2025-04-13", "value": 580}
      ]
    }
  }
}
```

### Platform Analitikleri

```http
GET /analytics/platforms/{platform}
```

Parametreler:
- `start_date` (isteğe bağlı): Başlangıç tarihi (varsayılan: 30 gün önce)
- `end_date` (isteğe bağlı): Bitiş tarihi (varsayılan: bugün)
- `account_id` (isteğe bağlı): Hesap ID'si

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "platform": "facebook",
    "period": {
      "start_date": "2025-03-14T00:00:00Z",
      "end_date": "2025-04-13T23:59:59Z"
    },
    "metrics": {
      "followers": {
        "total": 10000,
        "change": 200,
        "change_percentage": 2.04
      },
      "engagement": {
        "total": 6000,
        "change": 500,
        "change_percentage": 9.09
      },
      "impressions": {
        "total": 40000,
        "change": 2000,
        "change_percentage": 5.26
      },
      "likes": {
        "total": 3500,
        "change": 300,
        "change_percentage": 9.38
      },
      "comments": {
        "total": 1500,
        "change": 100,
        "change_percentage": 7.14
      },
      "shares": {
        "total": 1000,
        "change": 100,
        "change_percentage": 11.11
      }
    },
    "charts": {
      "engagement_by_day": [
        {"date": "2025-04-07", "value": 180},
        {"date": "2025-04-08", "value": 200},
        {"date": "2025-04-09", "value": 190},
        {"date": "2025-04-10", "value": 210},
        {"date": "2025-04-11", "value": 220},
        {"date": "2025-04-12", "value": 240},
        {"date": "2025-04-13", "value": 230}
      ],
      "engagement_by_type": {
        "likes": 3500,
        "comments": 1500,
        "shares": 1000
      }
    },
    "top_posts": [
      {
        "id": "content-id-1",
        "text": "This is our most engaging post",
        "published_at": "2025-04-10T12:00:00Z",
        "engagement": 350,
        "likes": 250,
        "comments": 70,
        "shares": 30
      },
      {
        "id": "content-id-2",
        "text": "Another popular post",
        "published_at": "2025-04-05T15:30:00Z",
        "engagement": 300,
        "likes": 220,
        "comments": 50,
        "shares": 30
      }
    ]
  }
}
```

### Reklam Analitikleri

```http
GET /analytics/ads
```

Parametreler:
- `start_date` (isteğe bağlı): Başlangıç tarihi (varsayılan: 30 gün önce)
- `end_date` (isteğe bağlı): Bitiş tarihi (varsayılan: bugün)
- `campaign_id` (isteğe bağlı): Kampanya ID'si
- `platform` (isteğe bağlı): Platform

Başarılı yanıt:

```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-03-14T00:00:00Z",
      "end_date": "2025-04-13T23:59:59Z"
    },
    "metrics": {
      "spend": {
        "total": 5000,
        "by_platform": {
          "facebook": 2500,
          "instagram": 1500,
          "twitter": 700,
          "linkedin": 300
        }
      },
      "impressions": {
        "total": 500000,
        "by_platform": {
          "facebook": 250000,
          "instagram": 150000,
          "twitter": 70000,
          "linkedin": 30000
        }
      },
      "clicks": {
        "total": 10000,
        "by_platform": {
          "facebook": 5000,
          "instagram": 3000,
          "twitter": 1400,
          "linkedin": 600
        }
      },
      "ctr": {
        "average": 2.0,
        "by_platform": {
          "facebook": 2.0,
          "instagram": 2.0,
          "twitter": 2.0,
          "linkedin": 2.0
        }
      },
      "cpc": {
        "average": 0.5,
        "by_platform": {
          "facebook": 0.5,
          "instagram": 0.5,
          "twitter": 0.5,
          "linkedin": 0.5
        }
      }
    },
    "charts": {
      "spend_by_day": [
        {"date": "2025-04-07", "value": 160},
        {"date": "2025-04-08", "value": 170},
        {"date": "2025-04-09", "value": 165},
        {"date": "2025-04-10", "value": 175},
        {"date": "2025-04-11", "value": 180},
        {"date": "2025-04-12", "value": 185},
        {"date": "2025-04-13", "value": 175}
      ],
      "ctr_by_day": [
        {"date": "2025-04-07", "value": 1.9},
        {"date": "2025-04-08", "value": 2.0},
        {"date": "2025-04-09", "value": 1.95},
        {"date": "2025-04-10", "value": 2.05},
        {"date": "2025-04-11", "value": 2.1},
        {"date": "2025-04-12", "value": 2.15},
        {"date": "2025-04-13", "value": 2.05}
      ]
    },
    "top_campaigns": [
      {
        "id": "campaign-id-1",
        "name": "Summer Sale Campaign",
        "platform": "facebook",
        "spend": 1500,
        "impressions": 150000,
        "clicks": 3000,
        "ctr": 2.0,
        "cpc": 0.5
      },
      {
        "id": "campaign-id-2",
        "name": "Product Launch Campaign",
        "platform": "instagram",
        "spend": 1000,
        "impressions": 100000,
        "clicks": 2000,
        "ctr": 2.0,
        "cpc": 0.5
      }
    ]
  }
}
```

## Hata Kodları

API, aşağıdaki hata kodlarını kullanır:

| Kod | Açıklama |
|-----|----------|
| 400 | Bad Request - İstek parametreleri geçersiz |
| 401 | Unauthorized - Kimlik doğrulama başarısız |
| 403 | Forbidden - Yetkilendirme başarısız |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Kaynak zaten mevcut |
| 422 | Unprocessable Entity - Doğrulama hatası |
| 429 | Too Many Requests - İstek limiti aşıldı |
| 500 | Internal Server Error - Sunucu hatası |

Hata yanıtı örneği:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Geçersiz istek parametreleri",
    "details": {
      "email": "Geçerli bir e-posta adresi girilmelidir",
      "password": "Şifre en az 8 karakter olmalıdır"
    }
  }
}
```

## Sınırlamalar

- API istekleri, dakikada 100 istek ile sınırlıdır
- Dosya yüklemeleri, dosya başına 10MB ile sınırlıdır
- Toplu işlemler, tek bir istekte en fazla 100 öğe ile sınırlıdır
- Sayfalandırma, sayfa başına en fazla 100 öğe ile sınırlıdır

## Örnekler

### Node.js Örneği

```javascript
const axios = require('axios');

const API_URL = 'https://api.sosyalmedyayoneticisi.com/v1';
const API_TOKEN = 'your_jwt_token';

async function getAccounts() {
  try {
    const response = await axios.get(`${API_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error.response?.data || error.message);
    throw error;
  }
}

async function createContent(content) {
  try {
    const response = await axios.post(`${API_URL}/contents`, content, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating content:', error.response?.data || error.message);
    throw error;
  }
}

// Kullanım örneği
(async () => {
  try {
    const accounts = await getAccounts();
    console.log('Accounts:', accounts);
    
    const newContent = await createContent({
      title: 'API Test Content',
      text: 'This content was created via API',
      tags: ['api', 'test']
    });
    console.log('New content:', newContent);
  } catch (error) {
    console.error('Operation failed:', error);
  }
})();
```

### Python Örneği

```python
import requests

API_URL = 'https://api.sosyalmedyayoneticisi.com/v1'
API_TOKEN = 'your_jwt_token'

def get_accounts():
    headers = {
        'Authorization': f'Bearer {API_TOKEN}'
    }
    
    response = requests.get(f'{API_URL}/accounts', headers=headers)
    response.raise_for_status()
    
    return response.json()

def create_content(content):
    headers = {
        'Authorization': f'Bearer {API_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(f'{API_URL}/contents', json=content, headers=headers)
    response.raise_for_status()
    
    return response.json()

# Kullanım örneği
try:
    accounts = get_accounts()
    print('Accounts:', accounts)
    
    new_content = create_content({
        'title': 'API Test Content',
        'text': 'This content was created via Python API client',
        'tags': ['api', 'python', 'test']
    })
    print('New content:', new_content)
except requests.exceptions.RequestException as e:
    print('Operation failed:', e)
```

---

© 2025 Sosyal Medya Yöneticisi. Tüm hakları saklıdır.
