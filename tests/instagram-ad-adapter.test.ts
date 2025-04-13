import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstagramAdAdapter } from '../src/lib/instagram-ad-adapter';
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

describe('InstagramAdAdapter', () => {
  let instagramAdAdapter: InstagramAdAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    instagramAdAdapter = new InstagramAdAdapter();
    mockApiRequestManager = (ApiRequestManager as any).mock.results[0].value;
    
    mockAccount = {
      id: 'test-id',
      user_id: 'user-id',
      platform: 'instagram',
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
          { id: 'act_123456', name: 'Test Ad Account' }
        ]
      });

      const result = await instagramAdAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/me/adaccounts?access_token=test-access-token',
        'GET'
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await instagramAdAdapter.authenticate(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        id: 'campaign-id-123'
      });

      const campaignData = {
        adAccountId: '123456',
        name: 'Test Instagram Campaign',
        objective: 'REACH',
        status: 'PAUSED',
        daily_budget: 100,
        instagram_account_id: '987654321'
      };

      const result = await instagramAdAdapter.createCampaign(mockAccount, campaignData);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/act_123456/campaigns',
        'POST',
        expect.objectContaining({
          name: 'Test Instagram Campaign',
          objective: 'REACH',
          status: 'PAUSED',
          special_ad_categories: [],
          daily_budget: 10000, // 100 * 100 (cent olarak)
          access_token: 'test-access-token',
          promoted_object: {
            application_id: '987654321'
          }
        })
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('campaign-id-123');
    });
  });

  describe('createAd', () => {
    it('should create ad successfully', async () => {
      // Mock API yanıtlarını ayarla - adset, creative ve ad oluşturma
      mockApiRequestManager.makeRequest
        .mockResolvedValueOnce({
          id: 'adset-id-123'
        })
        .mockResolvedValueOnce({
          id: 'creative-id-123'
        })
        .mockResolvedValueOnce({
          id: 'ad-id-123'
        });

      const campaignId = 'campaign-id-123';
      const adData = {
        adAccountId: '123456',
        name: 'Test Instagram Ad',
        adset_name: 'Test Instagram Ad Set',
        creative_name: 'Test Instagram Creative',
        instagram_account_id: '987654321',
        message: 'Test ad message',
        link: 'https://example.com',
        caption: 'Test caption',
        description: 'Test description',
        image_url: 'https://example.com/image.jpg',
        status: 'PAUSED'
      };

      const result = await instagramAdAdapter.createAd(mockAccount, campaignId, adData);

      // Adset oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://graph.facebook.com/v18.0/act_123456/adsets',
        'POST',
        expect.objectContaining({
          name: 'Test Instagram Ad Set',
          campaign_id: 'campaign-id-123',
          status: 'PAUSED',
          access_token: 'test-access-token',
          instagram_actor_id: '987654321'
        })
      );

      // Creative oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://graph.facebook.com/v18.0/act_123456/adcreatives',
        'POST',
        expect.objectContaining({
          name: 'Test Instagram Creative',
          object_story_spec: expect.objectContaining({
            instagram_actor_id: '987654321',
            link_data: expect.objectContaining({
              message: 'Test ad message',
              link: 'https://example.com',
              image_url: 'https://example.com/image.jpg'
            })
          }),
          access_token: 'test-access-token'
        })
      );

      // Ad oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        3,
        'https://graph.facebook.com/v18.0/act_123456/ads',
        'POST',
        {
          name: 'Test Instagram Ad',
          adset_id: 'adset-id-123',
          creative: { creative_id: 'creative-id-123' },
          status: 'PAUSED',
          access_token: 'test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.ad.id).toBe('ad-id-123');
      expect(result.adset.id).toBe('adset-id-123');
      expect(result.creative.id).toBe('creative-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
