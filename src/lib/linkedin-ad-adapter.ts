import { AdAdapter, ApiRequestManager } from './ad-adapter';
import { SocialMediaAccount } from './social-media-account';

export class LinkedInAdAdapter implements AdAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      // LinkedIn reklam API'si erişimi için token kontrolü
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/adAccountsV2?q=search&search.status.values[0]=ACTIVE`,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
      );
      
      if (response && response.elements && response.elements.length > 0) {
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
      console.error('LinkedIn reklam kimlik doğrulama hatası:', error);
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
      console.error('LinkedIn reklam token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async createCampaign(account: SocialMediaAccount, campaignData: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adCampaignsV2`;
      
      const data = {
        account: `urn:li:sponsoredAccount:${campaignData.accountId}`,
        name: campaignData.name,
        status: campaignData.status || 'PAUSED',
        type: campaignData.type || 'SPONSORED_UPDATES',
        costType: campaignData.costType || 'CPC',
        dailyBudget: {
          amount: campaignData.dailyBudget || '10',
          currencyCode: campaignData.currency || 'USD'
        },
        unitCost: {
          amount: campaignData.unitCost || '2',
          currencyCode: campaignData.currency || 'USD'
        },
        locale: {
          country: campaignData.country || 'US',
          language: campaignData.language || 'en'
        }
      };
      
      if (campaignData.startDate) {
        data.startDate = campaignData.startDate;
      }
      
      if (campaignData.endDate) {
        data.endDate = campaignData.endDate;
      }
      
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
      console.error('LinkedIn kampanya oluşturma hatası:', error);
      throw error;
    }
  }

  async updateCampaign(account: SocialMediaAccount, campaignId: string, campaignData: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adCampaignsV2/${campaignId}`;
      
      const data: any = {};
      
      if (campaignData.name) {
        data.name = campaignData.name;
      }
      
      if (campaignData.status) {
        data.status = campaignData.status;
      }
      
      if (campaignData.dailyBudget) {
        data.dailyBudget = {
          amount: campaignData.dailyBudget,
          currencyCode: campaignData.currency || 'USD'
        };
      }
      
      if (campaignData.unitCost) {
        data.unitCost = {
          amount: campaignData.unitCost,
          currencyCode: campaignData.currency || 'USD'
        };
      }
      
      if (campaignData.startDate) {
        data.startDate = campaignData.startDate;
      }
      
      if (campaignData.endDate) {
        data.endDate = campaignData.endDate;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn kampanya güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adCampaignsV2/${campaignId}`;
      
      const data = {
        status: 'PAUSED'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn kampanya duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adCampaignsV2/${campaignId}`;
      
      const data = {
        status: 'ACTIVE'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn kampanya devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteCampaign(account: SocialMediaAccount, campaignId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/adCampaignsV2/${campaignId}`;
      
      const data = {
        status: 'ARCHIVED'
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return true;
    } catch (error) {
      console.error('LinkedIn kampanya silme hatası:', error);
      return false;
    }
  }

  async createAd(account: SocialMediaAccount, campaignId: string, adData: any): Promise<any> {
    try {
      // 1. Adım: Sponsored content oluştur
      const contentEndpoint = `${this.baseUrl}/adCreativesV2`;
      const contentData = {
        account: `urn:li:sponsoredAccount:${adData.accountId}`,
        type: 'SPONSORED_STATUS_UPDATE',
        status: adData.status || 'PAUSED',
        reference: `urn:li:share:${adData.shareId}`
      };
      
      const contentResponse = await this.apiRequestManager.makeRequest(
        contentEndpoint,
        'POST',
        contentData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      if (!contentResponse || !contentResponse.id) {
        throw new Error('Sponsored content oluşturulamadı');
      }
      
      // 2. Adım: Creative oluştur
      const creativeEndpoint = `${this.baseUrl}/adCreativesV2`;
      const creativeData = {
        account: `urn:li:sponsoredAccount:${adData.accountId}`,
        type: 'SPONSORED_STATUS_UPDATE',
        status: adData.status || 'PAUSED',
        reference: `urn:li:share:${adData.shareId}`
      };
      
      const creativeResponse = await this.apiRequestManager.makeRequest(
        creativeEndpoint,
        'POST',
        creativeData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      if (!creativeResponse || !creativeResponse.id) {
        throw new Error('Creative oluşturulamadı');
      }
      
      // 3. Adım: Ad (reklam) oluştur
      const adEndpoint = `${this.baseUrl}/adDirectSponsoredContentsV2`;
      const adCreateData = {
        account: `urn:li:sponsoredAccount:${adData.accountId}`,
        campaign: `urn:li:sponsoredCampaign:${campaignId}`,
        creative: `urn:li:sponsoredCreative:${creativeResponse.id}`,
        status: adData.status || 'PAUSED',
        name: adData.name,
        locale: {
          country: adData.country || 'US',
          language: adData.language || 'en'
        }
      };
      
      const adResponse = await this.apiRequestManager.makeRequest(
        adEndpoint,
        'POST',
        adCreateData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );
      
      return {
        ad: adResponse,
        creative: creativeResponse
      };
    } catch (error) {
      console.error('LinkedIn reklam oluşturma hatası:', error);
      throw error;
    }
  }

  async updateAd(account: SocialMediaAccount, adId: string, adData: any): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adDirectSponsoredContentsV2/${adId}`;
      
      const data: any = {};
      
      if (adData.name) {
        data.name = adData.name;
      }
      
      if (adData.status) {
        data.status = adData.status;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn reklam güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adDirectSponsoredContentsV2/${adId}`;
      
      const data = {
        status: 'PAUSED'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn reklam duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adDirectSponsoredContentsV2/${adId}`;
      
      const data = {
        status: 'ACTIVE'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return response;
    } catch (error) {
      console.error('LinkedIn reklam devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteAd(account: SocialMediaAccount, adId: string): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/adDirectSponsoredContentsV2/${adId}`;
      
      const data = {
        status: 'ARCHIVED'
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'POST',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'X-Restli-Method': 'PARTIAL_UPDATE'
        }
      );
      
      return true;
    } catch (error) {
      console.error('LinkedIn reklam silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, entityId?: string, entityType?: string): Promise<any> {
    try {
      const endpoint = `${this.baseUrl}/adAnalyticsV2`;
      
      const data: any = {
        dateRange: {
          start: {
            day: 1,
            month: 1,
            year: new Date().getFullYear()
          },
          end: {
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }
        },
        timeGranularity: 'DAILY',
        accounts: [`urn:li:sponsoredAccount:${account.account_id}`],
        metrics: ['impressions', 'clicks', 'costInLocalCurrency', 'likes', 'comments', 'shares', 'follows', 'conversionValueInLocalCurrency']
      };
      
      if (entityId && entityType) {
        if (entityType === 'campaign') {
          data.campaigns = [`urn:li:sponsoredCampaign:${entityId}`];
        } else if (entityType === 'creative') {
          data.creatives = [`urn:li:sponsoredCreative:${entityId}`];
        } else if (entityType === 'ad') {
          data.creativeContents = [`urn:li:sponsoredCreativeContent:${entityId}`];
        }
      }
      
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
      
      return response.elements;
    } catch (error) {
      console.error('LinkedIn reklam analitik alma hatası:', error);
      throw error;
    }
  }
}
