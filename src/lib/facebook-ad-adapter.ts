import { AdAdapter, ApiRequestManager } from './ad-adapter';
import { SocialMediaAccount } from './social-media-account';

export class FacebookAdAdapter implements AdAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      // Facebook Marketing API erişimi için token kontrolü
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/me/adaccounts?access_token=${account.access_token}`,
        'GET'
      );
      
      if (response && response.data && response.data.length > 0) {
        return {
          ...account,
          status: 'active'
        };
      } else {
        return {
          ...account,
          status: 'expired'
        };
      }
    } catch (error) {
      console.error('Facebook reklam kimlik doğrulama hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    // Facebook token yenileme işlemi
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
      console.error('Facebook reklam token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async createCampaign(account: SocialMediaAccount, campaignData: any): Promise<any> {
    try {
      const adAccountId = campaignData.adAccountId;
      const endpoint = `${this.baseUrl}/act_${adAccountId}/campaigns`;
      
      const data = {
        name: campaignData.name,
        objective: campaignData.objective || 'REACH',
        status: campaignData.status || 'PAUSED',
        special_ad_categories: campaignData.special_ad_categories || [],
        access_token: account.access_token
      };
      
      if (campaignData.daily_budget) {
        data.daily_budget = campaignData.daily_budget * 100; // Facebook bütçeyi cent olarak alır
      }
      
      if (campaignData.lifetime_budget) {
        data.lifetime_budget = campaignData.lifetime_budget * 100;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook kampanya oluşturma hatası:', error);
      throw error;
    }
  }

  async updateCampaign(account: SocialMediaAccount, campaignId: string, campaignData: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${campaignId}`;
      
      const data: any = {
        access_token: account.access_token
      };
      
      if (campaignData.name) {
        data.name = campaignData.name;
      }
      
      if (campaignData.status) {
        data.status = campaignData.status;
      }
      
      if (campaignData.daily_budget) {
        data.daily_budget = campaignData.daily_budget * 100;
      }
      
      if (campaignData.lifetime_budget) {
        data.lifetime_budget = campaignData.lifetime_budget * 100;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook kampanya güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${campaignId}`;
      
      const data = {
        status: 'PAUSED',
        access_token: account.access_token
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook kampanya duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${campaignId}`;
      
      const data = {
        status: 'ACTIVE',
        access_token: account.access_token
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook kampanya devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteCampaign(account: SocialMediaAccount, campaignId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/${campaignId}`;
      
      const data = {
        status: 'DELETED',
        access_token: account.access_token
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return true;
    } catch (error) {
      console.error('Facebook kampanya silme hatası:', error);
      return false;
    }
  }

  async createAd(account: SocialMediaAccount, campaignId: string, adData: any): Promise<any> {
    try {
      const adAccountId = adData.adAccountId;
      
      // 1. Adım: Reklam seti oluştur
      const adsetEndpoint = `${this.baseUrl}/act_${adAccountId}/adsets`;
      const adsetData: any = {
        name: adData.adset_name || `${adData.name} Ad Set`,
        campaign_id: campaignId,
        optimization_goal: adData.optimization_goal || 'REACH',
        billing_event: adData.billing_event || 'IMPRESSIONS',
        bid_amount: adData.bid_amount || 2,
        status: adData.status || 'PAUSED',
        access_token: account.access_token
      };
      
      if (adData.daily_budget) {
        adsetData.daily_budget = adData.daily_budget * 100;
      }
      
      if (adData.targeting) {
        adsetData.targeting = adData.targeting;
      }
      
      if (adData.start_time) {
        adsetData.start_time = adData.start_time;
      }
      
      if (adData.end_time) {
        adsetData.end_time = adData.end_time;
      }
      
      const adsetResponse = await this.apiRequestManager.makeRequest(
        adsetEndpoint,
        'POST',
        adsetData
      );
      
      if (!adsetResponse || !adsetResponse.id) {
        throw new Error('Reklam seti oluşturulamadı');
      }
      
      // 2. Adım: Yaratıcı içerik oluştur
      const creativeEndpoint = `${this.baseUrl}/act_${adAccountId}/adcreatives`;
      const creativeData: any = {
        name: adData.creative_name || `${adData.name} Creative`,
        object_story_spec: {
          page_id: adData.page_id,
          link_data: {
            message: adData.message,
            link: adData.link,
            caption: adData.caption,
            description: adData.description
          }
        },
        access_token: account.access_token
      };
      
      if (adData.image_url) {
        creativeData.object_story_spec.link_data.image_url = adData.image_url;
      }
      
      const creativeResponse = await this.apiRequestManager.makeRequest(
        creativeEndpoint,
        'POST',
        creativeData
      );
      
      if (!creativeResponse || !creativeResponse.id) {
        throw new Error('Reklam yaratıcı içeriği oluşturulamadı');
      }
      
      // 3. Adım: Reklam oluştur
      const adEndpoint = `${this.baseUrl}/act_${adAccountId}/ads`;
      const adCreateData = {
        name: adData.name,
        adset_id: adsetResponse.id,
        creative: { creative_id: creativeResponse.id },
        status: adData.status || 'PAUSED',
        access_token: account.access_token
      };
      
      const adResponse = await this.apiRequestManager.makeRequest(
        adEndpoint,
        'POST',
        adCreateData
      );
      
      return {
        ad: adResponse,
        adset: adsetResponse,
        creative: creativeResponse
      };
    } catch (error) {
      console.error('Facebook reklam oluşturma hatası:', error);
      throw error;
    }
  }

  async updateAd(account: SocialMediaAccount, adId: string, adData: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${adId}`;
      
      const data: any = {
        access_token: account.access_token
      };
      
      if (adData.name) {
        data.name = adData.name;
      }
      
      if (adData.status) {
        data.status = adData.status;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook reklam güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${adId}`;
      
      const data = {
        status: 'PAUSED',
        access_token: account.access_token
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook reklam duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/${adId}`;
      
      const data = {
        status: 'ACTIVE',
        access_token: account.access_token
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return response;
    } catch (error) {
      console.error('Facebook reklam devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteAd(account: SocialMediaAccount, adId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/${adId}`;
      
      const data = {
        status: 'DELETED',
        access_token: account.access_token
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data
      );
      
      return true;
    } catch (error) {
      console.error('Facebook reklam silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, entityId?: string, entityType?: string): Promise<any> {
    try {
      let endpoint;
      
      if (entityId && entityType) {
        // Belirli bir reklam, reklam seti veya kampanya için analitik
        endpoint = `${this.baseUrl}/${entityId}/insights?fields=impressions,clicks,spend,cpc,ctr,reach&access_token=${account.access_token}`;
      } else {
        // Hesap için genel analitik
        const adAccountId = account.account_id;
        endpoint = `${this.baseUrl}/act_${adAccountId}/insights?fields=impressions,clicks,spend,cpc,ctr,reach&access_token=${account.access_token}`;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'GET'
      );
      
      return response.data;
    } catch (error) {
      console.error('Facebook reklam analitik alma hatası:', error);
      throw error;
    }
  }
}
