import { SocialMediaAdapter, ApiRequestManager } from './social-media-adapter';
import { SocialMediaAccount } from './social-media-account';

export class LinkedInAdapter implements SocialMediaAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/me`,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      if (response && response.id) {
        return {
          ...account,
          status: 'active',
          account_id: response.id,
          account_name: `${response.localizedFirstName} ${response.localizedLastName}` || account.account_name
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('LinkedIn kimlik doğrulama hatası:', error);
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
        'https://www.linkedin.com/oauth/v2/accessToken',
        'POST',
        {
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
          client_id: process.env.LINKEDIN_CLIENT_ID || '',
          client_secret: process.env.LINKEDIN_CLIENT_SECRET || ''
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      );
      
      if (response && response.access_token) {
        const expiresIn = response.expires_in || 5184000; // Default 60 gün
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
      console.error('LinkedIn token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async publishContent(account: SocialMediaAccount, content: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/ugcPosts`;
      
      // LinkedIn paylaşım formatı
      const postData: any = {
        author: `urn:li:person:${account.account_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
      
      // Eğer medya varsa, medya ekle
      if (content.media_urls && content.media_urls.length > 0) {
        const mediaAssets = await this.uploadMedia(account, content.media_urls);
        
        if (mediaAssets.length > 0) {
          postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
          postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets;
        }
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        postData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn içerik yayınlama hatası:', error);
      throw error;
    }
  }

  private async uploadMedia(account: SocialMediaAccount, mediaUrls: string[]): Promise<any[]> {
    try {
      const mediaAssets = [];
      
      for (const mediaUrl of mediaUrls) {
        // 1. Adım: Register upload
        const registerResponse = await this.apiRequestManager.makeRequest(
          `${this.baseUrl}/assets?action=registerUpload`,
          'POST',
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: `urn:li:person:${account.account_id}`,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          },
          {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        );
        
        if (!registerResponse || !registerResponse.value || !registerResponse.value.uploadMechanism) {
          continue;
        }
        
        // 2. Adım: Upload binary
        const uploadUrl = registerResponse.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = registerResponse.value.asset;
        
        // Burada gerçek bir dosya yükleme işlemi yapılmalı
        // Bu örnek implementasyonda sadece simüle ediyoruz
        
        mediaAssets.push({
          status: 'READY',
          description: {
            text: 'Media upload'
          },
          media: asset
        });
      }
      
      return mediaAssets;
    } catch (error) {
      console.error('LinkedIn medya yükleme hatası:', error);
      return [];
    }
  }

  async scheduleContent(account: SocialMediaAccount, content: any, scheduledTime: string): Promise<any> {
    try {
      // LinkedIn API doğrudan içerik planlama desteği sunmaz
      // Bu nedenle, planlama işlemi uygulama tarafında yapılmalıdır
      // Burada sadece bir simülasyon yapıyoruz
      
      return {
        id: `scheduled_${Date.now()}`,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        message: 'İçerik planlandı, belirtilen zamanda yayınlanacak'
      };
    } catch (error) {
      console.error('LinkedIn içerik planlama hatası:', error);
      throw error;
    }
  }

  async deleteContent(account: SocialMediaAccount, contentId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/ugcPosts/${contentId}`;
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'DELETE',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return true;
    } catch (error) {
      console.error('LinkedIn içerik silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, contentId?: string): Promise<any> {
    try {
      let endpoint;
      
      if (contentId) {
        // Belirli bir paylaşım için analitik
        endpoint = `${this.baseUrl}/socialActions/${contentId}`;
      } else {
        // Profil için genel analitik
        endpoint = `${this.baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:person:${account.account_id}`;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn analitik alma hatası:', error);
      throw error;
    }
  }

  async getComments(account: SocialMediaAccount, contentId: string): Promise<any[]> {
    try {
      const endpoint = `${this.baseUrl}/socialActions/${contentId}/comments`;
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return response.elements || [];
    } catch (error) {
      console.error('LinkedIn yorum alma hatası:', error);
      return [];
    }
  }

  async replyToComment(account: SocialMediaAccount, commentId: string, reply: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/socialActions/${commentId}/comments`;
      const data = {
        actor: `urn:li:person:${account.account_id}`,
        message: {
          text: reply
        }
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn yorum yanıtlama hatası:', error);
      throw error;
    }
  }
}
