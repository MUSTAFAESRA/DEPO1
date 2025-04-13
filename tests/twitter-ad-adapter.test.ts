import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwitterAdAdapter } from '../src/lib/twitter-ad-adapter';
import { SocialMediaAccount } from '../src/lib/social-media-account';
import { ApiRequestManager } from '../src/lib/social-media-adapter';

// ApiRequestManager'ı mock'la
vi.mock('../src/lib/social-media-adapter', () => {
  return {
    ApiRequestManager: vi.fn().mockImplementation(() => {
      return {
        makeRequest: vi.fn(),
        handleRateLimiting: vi.fn(),
        handleErrors: vi.fn(),
        retryFailedRequests: vi.fn()
      };
    })
  };
});

describe('TwitterAdAdapter', () => {
  let twitterAdAdapter: TwitterAdAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    twitterAdAdapter = new TwitterAdAdapter();
    mockApiRequestManager = (ApiRequestManager as any).mock.results[0].value;
    
    mockAccount = {
      id: 'test-id',
      user_id: 'user-id',
      platform: 'twitter',
      account_name: 'testaccount',
      account_id: '123456789',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_expiry: new Date(Date.now() + 86400000).toISOString(), // 1 gün sonra
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  describe('authenticate', () => {
    it('should return active status when authentication is successful', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        data: [
          { id: 'account-123456', name: 'Test Ad Account' }
        ]
      });

      const result = await twitterAdAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://ads-api.twitter.com/11/accounts',
        'GET',
        null,
        {
          'Authorization': 'Bearer test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await twitterAdAdapter.authenticate(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        data: {
          id: 'campaign-id-123'
        }
      });

      const campaignData = {
        accountId: '123456',
        name: 'Test Twitter Campaign',
        funding_instrument_id: 'funding-123',
        daily_budget: 100,
        status: 'PAUSED',
        start_time: '2025-04-14T00:00:00Z',
        end_time: '2025-04-21T00:00:00Z'
      };

      const result = await twitterAdAdapter.createCampaign(mockAccount, campaignData);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://ads-api.twitter.com/11/accounts/123456/campaigns',
        'POST',
        {
          name: 'Test Twitter Campaign',
          funding_instrument_id: 'funding-123',
          daily_budget_amount_local_micro: 100000000, // 100 * 1000000 (micro olarak)
          total_budget_amount_local_micro: undefined,
          entity_status: 'PAUSED',
          start_time: '2025-04-14T00:00:00Z',
          end_time: '2025-04-21T00:00:00Z'
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('campaign-id-123');
    });
  });

  describe('createAd', () => {
    it('should create ad successfully', async () => {
      // Mock API yanıtlarını ayarla - line item ve promoted tweet oluşturma
      mockApiRequestManager.makeRequest
        .mockResolvedValueOnce({
          data: {
            id: 'line-item-id-123'
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 'tweet-id-123'
          }
        })
        .mockResolvedValueOnce({
          data: {
            id: 'promoted-tweet-id-123'
          }
        });

      const campaignId = 'campaign-id-123';
      const adData = {
        accountId: '123456',
        name: 'Test Twitter Ad',
        line_item_name: 'Test Twitter Line Item',
        bid_amount: 5,
        objective: 'TWEET_ENGAGEMENTS',
        text: 'Test tweet content',
        status: 'PAUSED'
      };

      const result = await twitterAdAdapter.createAd(mockAccount, campaignId, adData);

      // Line item oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://ads-api.twitter.com/11/accounts/123456/line_items',
        'POST',
        {
          campaign_id: 'campaign-id-123',
          name: 'Test Twitter Line Item',
          bid_amount_local_micro: 5000000, // 5 * 1000000 (micro olarak)
          product_type: 'PROMOTED_TWEETS',
          objective: 'TWEET_ENGAGEMENTS',
          placements: ['ALL_ON_TWITTER'],
          entity_status: 'PAUSED'
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json'
        }
      );

      // Tweet oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://api.twitter.com/2/tweets',
        'POST',
        {
          text: 'Test tweet content'
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json'
        }
      );

      // Promoted tweet oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        3,
        'https://ads-api.twitter.com/11/accounts/123456/promoted_tweets',
        'POST',
        {
          line_item_id: 'line-item-id-123',
          tweet_ids: ['tweet-id-123']
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.line_item.id).toBe('line-item-id-123');
      expect(result.promoted_tweet.id).toBe('promoted-tweet-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
