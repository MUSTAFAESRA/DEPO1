import { SocialMediaAdapter, ApiRequestManager } from './social-media-adapter';
import { SocialMediaAccount } from './social-media-account';

export class FacebookAdapter implements SocialMediaAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    // Facebook OAuth işlemi normalde client tarafında yapılır ve access token alınır
    // Burada sadece token'ın geçerli olup olmadığını kontrol ediyoruz
    try {
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/me?access_token=${account.access_token}`,
        'GET'
      );
      
      if (response && response.id) {
        return {
          ...account,
          status: 'active',
          account_id: response.id,
          account_name: response.name || account.account_name
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('Facebook kimlik doğrulama hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    // Facebook refresh token işlemi
    // Normalde client_id, client_secret ve refresh_token ile yeni bir access token alınır
    try {
      if (!account.refresh_token) {
        throw new Error('Refresh token bulunamadı');
      }
      
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/oauth/access_token`,
        'GET',
        null,
        {
          'client_id': process.env.FACEBOOK_CLIENT_ID || '',
          'client_secret': process.env.FACEBOOK_CLIENT_SECRET || '',
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
      console.error('Facebook token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async publishContent(account: SocialMediaAccount, content: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${account.account_id}/feed`;
      const data: any = {
        message: content.text,
        access_token: account.access_token
      };
      
      // Eğer medya varsa, önce medyayı yükle
      if (content.media_urls && content.media_urls.length > 0) {
        const mediaUrl = content.media_urls[0];
        
        // Resim veya video yükleme
        if (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov')) {
          // Video yükleme
          const videoData = {
            file_url: mediaUrl,
            description: content.text,
            access_token: account.access_token
          };
          
          const videoResponse = await this.apiRequestManager.makeRequest(
            `${this.baseUrl}/${account.account_id}/videos`,
            'POST',
            videoData
          );
          
          return videoResponse;
        } else {
          // Resim yükleme
          data.url = mediaUrl;
          
          const photoResponse = await this.apiRequestManager.makeRequest(
            `${this.baseUrl}/${account.account_id}/photos`,
            'POST',
            data
          );
          
          return photoResponse;
        }
      }
      
      // Sadece metin içeriği
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook içerik yayınlama hatası:', error);
      throw error;
    }
  }

  async scheduleContent(account: SocialMediaAccount, content: any, scheduledTime: string): Promise<any> {
    try {
      const scheduledTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
      
      const endpoint = `${this.baseUrl}/${account.account_id}/feed`;
      const data: any = {
        message: content.text,
        published: false,
        scheduled_publish_time: scheduledTimestamp,
        access_token: account.access_token
      };
      
      // Eğer medya varsa, önce medyayı yükle
      if (content.media_urls && content.media_urls.length > 0) {
        const mediaUrl = content.media_urls[0];
        
        // Resim veya video yükleme
        if (mediaUrl.includes('.mp4') || mediaUrl.includes('.mov')) {
          // Video yükleme
          const videoData = {
            file_url: mediaUrl,
            description: content.text,
            published: false,
            scheduled_publish_time: scheduledTimestamp,
            access_token: account.access_token
          };
          
          const videoResponse = await this.apiRequestManager.makeRequest(
            `${this.baseUrl}/${account.account_id}/videos`,
            'POST',
            videoData
          );
          
          return videoResponse;
        } else {
          // Resim yükleme
          data.url = mediaUrl;
          
          const photoResponse = await this.apiRequestManager.makeRequest(
            `${this.baseUrl}/${account.account_id}/photos`,
            'POST',
            data
          );
          
          return photoResponse;
        }
      }
      
      // Sadece metin içeriği
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook içerik planlama hatası:', error);
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
      console.error('Facebook içerik silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, contentId?: string): Promise<any> {
    try {
      let endpoint;
      
      if (contentId) {
        // Belirli bir içerik için analitik
        endpoint = `${this.baseUrl}/${contentId}/insights?metric=post_impressions,post_engagements,post_reactions_by_type_total&access_token=${account.access_token}`;
      } else {
        // Sayfa için genel analitik
        endpoint = `${this.baseUrl}/${account.account_id}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day&access_token=${account.access_token}`;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET'
      );
      
      return response.data;
    } catch (error) {
      console.error('Facebook analitik alma hatası:', error);
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
      console.error('Facebook yorum alma hatası:', error);
      return [];
    }
  }

  async replyToComment(account: SocialMediaAccount, commentId: string, reply: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${commentId}/comments`;
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
      console.error('Facebook yorum yanıtlama hatası:', error);
      throw error;
    }
  }
}
