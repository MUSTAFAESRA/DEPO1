import { SocialMediaAdapter, ApiRequestManager } from './social-media-adapter';
import { SocialMediaAccount } from './social-media-account';

export class InstagramAdapter implements SocialMediaAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    // Instagram API, Facebook Graph API üzerinden çalışır
    try {
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/${account.account_id}?fields=id,username&access_token=${account.access_token}`,
        'GET'
      );
      
      if (response && response.id) {
        return {
          ...account,
          status: 'active',
          account_name: response.username || account.account_name
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('Instagram kimlik doğrulama hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    // Instagram token yenileme işlemi Facebook ile aynıdır
    try {
      if (!account.refresh_token) {
        throw new Error('Refresh token bulunamadı');
      }
      
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/oauth/access_token`,
        'GET',
        null,
        {
          'client_id': process.env.INSTAGRAM_CLIENT_ID || '',
          'client_secret': process.env.INSTAGRAM_CLIENT_SECRET || '',
          'grant_type': 'fb_exchange_token',
          'fb_exchange_token': account.refresh_token
        }
      );
      
      if (response && response.access_token) {
        const expiresIn = response.expires_in || 5184000; // Default 60 gün
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
        
        return {
          ...account,
          access_token: response.access_token,
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
      console.error('Instagram token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async publishContent(account: SocialMediaAccount, content: any): Promise<any> {
    try {
      // Instagram'da sadece metin içeriği paylaşılamaz, mutlaka bir medya olmalı
      if (!content.media_urls || content.media_urls.length === 0) {
        throw new Error('Instagram paylaşımları için en az bir medya gereklidir');
      }
      
      const mediaUrl = content.media_urls[0];
      const caption = content.text || '';
      
      // 1. Adım: Medya Container oluştur
      const containerResponse = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/${account.account_id}/media`,
        'POST',
        {
          image_url: mediaUrl,
          caption: caption,
          access_token: account.access_token
        }
      );
      
      if (!containerResponse || !containerResponse.id) {
        throw new Error('Instagram medya container oluşturulamadı');
      }
      
      // 2. Adım: Medyayı yayınla
      const publishResponse = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/${account.account_id}/media_publish`,
        'POST',
        {
          creation_id: containerResponse.id,
          access_token: account.access_token
        }
      );
      
      return publishResponse;
    } catch (error) {
      console.error('Instagram içerik yayınlama hatası:', error);
      throw error;
    }
  }

  async scheduleContent(account: SocialMediaAccount, content: any, scheduledTime: string): Promise<any> {
    try {
      // Instagram Graph API doğrudan içerik planlama desteği sunmaz
      // Bu nedenle, planlama işlemi uygulama tarafında yapılmalıdır
      // Burada sadece bir simülasyon yapıyoruz
      
      return {
        id: `scheduled_${Date.now()}`,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        message: 'İçerik planlandı, belirtilen zamanda yayınlanacak'
      };
    } catch (error) {
      console.error('Instagram içerik planlama hatası:', error);
      throw error;
    }
  }

  async deleteContent(account: SocialMediaAccount, contentId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/${contentId}`;
      const data = {
        access_token: account.access_token
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'DELETE',
        data
      );
      
      return true;
    } catch (error) {
      console.error('Instagram içerik silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, contentId?: string): Promise<any> {
    try {
      let endpoint;
      
      if (contentId) {
        // Belirli bir medya için analitik
        endpoint = `${this.baseUrl}/${contentId}/insights?metric=engagement,impressions,reach&access_token=${account.access_token}`;
      } else {
        // Hesap için genel analitik
        endpoint = `${this.baseUrl}/${account.account_id}/insights?metric=impressions,reach,profile_views&period=day&access_token=${account.access_token}`;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET'
      );
      
      return response.data;
    } catch (error) {
      console.error('Instagram analitik alma hatası:', error);
      throw error;
    }
  }

  async getComments(account: SocialMediaAccount, contentId: string): Promise<any[]> {
    try {
      const endpoint = `${this.baseUrl}/${contentId}/comments?access_token=${account.access_token}`;
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET'
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Instagram yorum alma hatası:', error);
      return [];
    }
  }

  async replyToComment(account: SocialMediaAccount, commentId: string, reply: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${commentId}/replies`;
      const data = {
        message: reply,
        access_token: account.access_token
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Instagram yorum yanıtlama hatası:', error);
      throw error;
    }
  }
}
