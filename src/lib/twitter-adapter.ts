import { SocialMediaAdapter, ApiRequestManager } from './social-media-adapter';
import { SocialMediaAccount } from './social-media-account';

export class TwitterAdapter implements SocialMediaAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/users/me`,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      if (response && response.data && response.data.id) {
        return {
          ...account,
          status: 'active',
          account_id: response.data.id,
          account_name: response.data.username || account.account_name
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('Twitter kimlik doğrulama hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      if (!account.refresh_token) {
        throw new Error('Refresh token bulunamadı');
      }
      
      const response = await this.apiRequestManager.makeRequest(
        'https://api.twitter.com/oauth2/token',
        'POST',
        {
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: process.env.TWITTER_CLIENT_ID || ''
        }
      );
      
      if (response && response.access_token) {
        const expiresIn = response.expires_in || 7200; // Default 2 saat
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
        
        return {
          ...account,
          access_token: response.access_token,
          refresh_token: response.refresh_token || account.refresh_token,
          token_expiry: expiryDate.toISOString(),
          status: 'active'
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('Twitter token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async publishContent(account: SocialMediaAccount, content: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/tweets`;
      const data: any = {
        text: content.text
      };
      
      // Eğer medya varsa, önce medyayı yükle
      if (content.media_urls && content.media_urls.length > 0) {
        // Twitter API v2 için medya yükleme
        const mediaIds = await this.uploadMedia(account, content.media_urls);
        if (mediaIds.length > 0) {
          data.media = { media_ids: mediaIds };
        }
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter içerik yayınlama hatası:', error);
      throw error;
    }
  }

  private async uploadMedia(account: SocialMediaAccount, mediaUrls: string[]): Promise<string[]> {
    // Twitter API v2 için medya yükleme
    // Not: Bu bir örnek implementasyondur, gerçek uygulamada daha karmaşık olabilir
    try {
      const mediaIds: string[] = [];
      
      for (const mediaUrl of mediaUrls) {
        const response = await this.apiRequestManager.makeRequest(
          'https://upload.twitter.com/1.1/media/upload.json',
          'POST',
          {
            media_data: mediaUrl, // Base64 encoded olmalı
          },
          {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        );
        
        if (response && response.media_id_string) {
          mediaIds.push(response.media_id_string);
        }
      }
      
      return mediaIds;
    } catch (error) {
      console.error('Twitter medya yükleme hatası:', error);
      return [];
    }
  }

  async scheduleContent(account: SocialMediaAccount, content: any, scheduledTime: string): Promise<any> {
    try {
      // Twitter API v2 doğrudan içerik planlama desteği sunmaz
      // Bu nedenle, planlama işlemi uygulama tarafında yapılmalıdır
      // Burada sadece bir simülasyon yapıyoruz
      
      return {
        id: `scheduled_${Date.now()}`,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        message: 'İçerik planlandı, belirtilen zamanda yayınlanacak'
      };
    } catch (error) {
      console.error('Twitter içerik planlama hatası:', error);
      throw error;
    }
  }

  async deleteContent(account: SocialMediaAccount, contentId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/tweets/${contentId}`;
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'DELETE',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      return true;
    } catch (error) {
      console.error('Twitter içerik silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, contentId?: string): Promise<any> {
    try {
      let endpoint;
      
      if (contentId) {
        // Belirli bir tweet için analitik
        endpoint = `${this.baseUrl}/tweets/${contentId}?tweet.fields=public_metrics,non_public_metrics`;
      } else {
        // Kullanıcı için genel analitik
        endpoint = `${this.baseUrl}/users/${account.account_id}?user.fields=public_metrics`;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter analitik alma hatası:', error);
      throw error;
    }
  }

  async getComments(account: SocialMediaAccount, contentId: string): Promise<any[]> {
    try {
      const endpoint = `${this.baseUrl}/tweets/search/recent?query=conversation_id:${contentId}`;
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Twitter yorum alma hatası:', error);
      return [];
    }
  }

  async replyToComment(account: SocialMediaAccount, commentId: string, reply: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/tweets`;
      const data = {
        text: reply,
        reply: {
          in_reply_to_tweet_id: commentId
        }
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter yorum yanıtlama hatası:', error);
      throw error;
    }
  }
}
