import { AdAdapter, ApiRequestManager } from './ad-adapter';
import { SocialMediaAccount } from './social-media-account';

export class TwitterAdAdapter implements AdAdapter {
  private apiRequestManager: ApiRequestManager;
  private baseUrl = 'https://ads-api.twitter.com/11';
  private baseAuthUrl = 'https://api.twitter.com/2';

  constructor() {
    this.apiRequestManager = new ApiRequestManager();
  }

  async authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount> {
    try {
      // Twitter reklam API'si erişimi için token kontrolü
      const response = await this.apiRequestManager.makeRequest(
        `${this.baseUrl}/accounts`,
        'GET',
        null,
        {
          'Authorization': `Bearer ${account.access_token}`
        }
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
      console.error('Twitter reklam kimlik doğrulama hatası:', error);
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
      console.error('Twitter reklam token yenileme hatası:', error);
      return {
        ...account,
        status: 'expired'
      };
    }
  }

  async createCampaign(account: SocialMediaAccount, campaignData: any): Promise<any> {
    try {
      const accountId = campaignData.accountId;
      const endpoint = `${this.baseUrl}/accounts/${accountId}/campaigns`;
      
      const data = {
        name: campaignData.name,
        funding_instrument_id: campaignData.funding_instrument_id,
        daily_budget_amount_local_micro: campaignData.daily_budget ? campaignData.daily_budget * 1000000 : undefined,
        total_budget_amount_local_micro: campaignData.total_budget ? campaignData.total_budget * 1000000 : undefined,
        entity_status: campaignData.status || 'PAUSED',
        start_time: campaignData.start_time,
        end_time: campaignData.end_time
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
      console.error('Twitter kampanya oluşturma hatası:', error);
      throw error;
    }
  }

  async updateCampaign(account: SocialMediaAccount, campaignId: string, campaignData: any): Promise<any> {
    try {
      const accountId = campaignData.accountId;
      const endpoint = `${this.baseUrl}/accounts/${accountId}/campaigns/${campaignId}`;
      
      const data: any = {};
      
      if (campaignData.name) {
        data.name = campaignData.name;
      }
      
      if (campaignData.entity_status) {
        data.entity_status = campaignData.entity_status;
      }
      
      if (campaignData.daily_budget) {
        data.daily_budget_amount_local_micro = campaignData.daily_budget * 1000000;
      }
      
      if (campaignData.total_budget) {
        data.total_budget_amount_local_micro = campaignData.total_budget * 1000000;
      }
      
      if (campaignData.start_time) {
        data.start_time = campaignData.start_time;
      }
      
      if (campaignData.end_time) {
        data.end_time = campaignData.end_time;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter kampanya güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const accountId = account.account_id;
      const endpoint = `${this.baseUrl}/accounts/${accountId}/campaigns/${campaignId}`;
      
      const data = {
        entity_status: 'PAUSED'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter kampanya duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeCampaign(account: SocialMediaAccount, campaignId: string): Promise<any> {
    try {
      const accountId = account.account_id;
      const endpoint = `${this.baseUrl}/accounts/${accountId}/campaigns/${campaignId}`;
      
      const data = {
        entity_status: 'ACTIVE'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter kampanya devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteCampaign(account: SocialMediaAccount, campaignId: string): Promise<boolean> {
    try {
      const accountId = account.account_id;
      const endpoint = `${this.baseUrl}/accounts/${accountId}/campaigns/${campaignId}`;
      
      const data = {
        entity_status: 'DELETED'
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return true;
    } catch (error) {
      console.error('Twitter kampanya silme hatası:', error);
      return false;
    }
  }

  async createAd(account: SocialMediaAccount, campaignId: string, adData: any): Promise<any> {
    try {
      const accountId = adData.accountId;
      
      // 1. Adım: Line item (reklam grubu) oluştur
      const lineItemEndpoint = `${this.baseUrl}/accounts/${accountId}/line_items`;
      const lineItemData = {
        campaign_id: campaignId,
        name: adData.line_item_name || `${adData.name} Line Item`,
        bid_amount_local_micro: adData.bid_amount ? adData.bid_amount * 1000000 : 10000000,
        product_type: 'PROMOTED_TWEETS',
        objective: adData.objective || 'TWEET_ENGAGEMENTS',
        placements: adData.placements || ['ALL_ON_TWITTER'],
        entity_status: adData.status || 'PAUSED'
      };
      
      const lineItemResponse = await this.apiRequestManager.makeRequest(
        lineItemEndpoint,
        'POST',
        lineItemData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      if (!lineItemResponse || !lineItemResponse.data || !lineItemResponse.data.id) {
        throw new Error('Line item oluşturulamadı');
      }
      
      const lineItemId = lineItemResponse.data.id;
      
      // 2. Adım: Tweet oluştur veya var olan tweet'i kullan
      let tweetId = adData.tweet_id;
      
      if (!tweetId) {
        // Tweet oluştur
        const tweetEndpoint = `${this.baseAuthUrl}/tweets`;
        const tweetData = {
          text: adData.text
        };
        
        const tweetResponse = await this.apiRequestManager.makeRequest(
          tweetEndpoint,
          'POST',
          tweetData,
          {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
          }
        );
        
        if (!tweetResponse || !tweetResponse.data || !tweetResponse.data.id) {
          throw new Error('Tweet oluşturulamadı');
        }
        
        tweetId = tweetResponse.data.id;
      }
      
      // 3. Adım: Promoted tweet (reklam) oluştur
      const promotedTweetEndpoint = `${this.baseUrl}/accounts/${accountId}/promoted_tweets`;
      const promotedTweetData = {
        line_item_id: lineItemId,
        tweet_ids: [tweetId]
      };
      
      const promotedTweetResponse = await this.apiRequestManager.makeRequest(
        promotedTweetEndpoint,
        'POST',
        promotedTweetData,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return {
        line_item: lineItemResponse.data,
        promoted_tweet: promotedTweetResponse.data
      };
    } catch (error) {
      console.error('Twitter reklam oluşturma hatası:', error);
      throw error;
    }
  }

  async updateAd(account: SocialMediaAccount, adId: string, adData: any): Promise<any> {
    try {
      // Twitter'da promoted tweet'ler doğrudan güncellenemez
      // Bunun yerine, line item (reklam grubu) güncellenir
      const accountId = adData.accountId;
      const lineItemId = adData.line_item_id;
      
      if (!lineItemId) {
        throw new Error('Line item ID bulunamadı');
      }
      
      const endpoint = `${this.baseUrl}/accounts/${accountId}/line_items/${lineItemId}`;
      
      const data: any = {};
      
      if (adData.name) {
        data.name = adData.name;
      }
      
      if (adData.status) {
        data.entity_status = adData.status;
      }
      
      if (adData.bid_amount) {
        data.bid_amount_local_micro = adData.bid_amount * 1000000;
      }
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter reklam güncelleme hatası:', error);
      throw error;
    }
  }

  async pauseAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      // Twitter'da promoted tweet'ler doğrudan duraklatılamaz
      // Bunun yerine, line item (reklam grubu) duraklatılır
      const accountId = account.account_id;
      const lineItemId = adId; // adId aslında line_item_id olmalı
      
      const endpoint = `${this.baseUrl}/accounts/${accountId}/line_items/${lineItemId}`;
      
      const data = {
        entity_status: 'PAUSED'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter reklam duraklatma hatası:', error);
      throw error;
    }
  }

  async resumeAd(account: SocialMediaAccount, adId: string): Promise<any> {
    try {
      // Twitter'da promoted tweet'ler doğrudan devam ettirilemez
      // Bunun yerine, line item (reklam grubu) devam ettirilir
      const accountId = account.account_id;
      const lineItemId = adId; // adId aslında line_item_id olmalı
      
      const endpoint = `${this.baseUrl}/accounts/${accountId}/line_items/${lineItemId}`;
      
      const data = {
        entity_status: 'ACTIVE'
      };
      
      const response = await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Twitter reklam devam ettirme hatası:', error);
      throw error;
    }
  }

  async deleteAd(account: SocialMediaAccount, adId: string): Promise<boolean> {
    try {
      // Twitter'da promoted tweet'ler doğrudan silinemez
      // Bunun yerine, line item (reklam grubu) silinir
      const accountId = account.account_id;
      const lineItemId = adId; // adId aslında line_item_id olmalı
      
      const endpoint = `${this.baseUrl}/accounts/${accountId}/line_items/${lineItemId}`;
      
      const data = {
        entity_status: 'DELETED'
      };
      
      await this.apiRequestManager.makeRequest(
        endpoint,
        'PUT',
        data,
        {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      );
      
      return true;
    } catch (error) {
      console.error('Twitter reklam silme hatası:', error);
      return false;
    }
  }

  async getAnalytics(account: SocialMediaAccount, entityId?: string, entityType?: string): Promise<any> {
    try {
      const accountId = account.account_id;
      let endpoint;
      
      if (entityId && entityType) {
        // Belirli bir reklam, reklam grubu veya kampanya için analitik
        endpoint = `${this.baseUrl}/stats/accounts/${accountId}?entity=${entityType}&entity_ids=${entityId}&metric_groups=ENGAGEMENT,BILLING`;
      } else {
        // Hesap için genel analitik
        endpoint = `${this.baseUrl}/stats/accounts/${accountId}?metric_groups=ENGAGEMENT,BILLING`;
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
      console.error('Twitter reklam analitik alma hatası:', error);
      throw error;
    }
  }
}
