import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkedInAdAdapter } from '../src/lib/linkedin-ad-adapter';
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

describe('LinkedInAdAdapter', () => {
  let linkedinAdAdapter: LinkedInAdAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    linkedinAdAdapter = new LinkedInAdAdapter();
    mockApiRequestManager = (ApiRequestManager as any).mock.results[0].value;
    
    mockAccount = {
      id: 'test-id',
      user_id: 'user-id',
      platform: 'linkedin',
      account_name: 'Test User',
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
        elements: [
          { id: 'urn:li:sponsoredAccount:123456', name: 'Test Ad Account' }
        ]
      });

      const result = await linkedinAdAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/adAccountsV2?q=search&search.status.values[0]=ACTIVE',
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

      const result = await linkedinAdAdapter.authenticate(mockAccount);

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
        accountId: '123456',
        name: 'Test LinkedIn Campaign',
        type: 'SPONSORED_UPDATES',
        costType: 'CPC',
        dailyBudget: '50',
        unitCost: '2',
        country: 'US',
        language: 'en',
        status: 'PAUSED'
      };

      const result = await linkedinAdAdapter.createCampaign(mockAccount, campaignData);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/adCampaignsV2',
        'POST',
        {
          account: 'urn:li:sponsoredAccount:123456',
          name: 'Test LinkedIn Campaign',
          status: 'PAUSED',
          type: 'SPONSORED_UPDATES',
          costType: 'CPC',
          dailyBudget: {
            amount: '50',
            currencyCode: 'USD'
          },
          unitCost: {
            amount: '2',
            currencyCode: 'USD'
          },
          locale: {
            country: 'US',
            language: 'en'
          }
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('campaign-id-123');
    });
  });

  describe('createAd', () => {
    it('should create ad successfully', async () => {
      // Mock API yanıtlarını ayarla - content, creative ve ad oluşturma
      mockApiRequestManager.makeRequest
        .mockResolvedValueOnce({
          id: 'content-id-123'
        })
        .mockResolvedValueOnce({
          id: 'creative-id-123'
        })
        .mockResolvedValueOnce({
          id: 'ad-id-123'
        });

      const campaignId = 'campaign-id-123';
      const adData = {
        accountId: '123456',
        name: 'Test LinkedIn Ad',
        shareId: 'share-123456',
        status: 'PAUSED',
        country: 'US',
        language: 'en'
      };

      const result = await linkedinAdAdapter.createAd(mockAccount, campaignId, adData);

      // Content oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://api.linkedin.com/v2/adCreativesV2',
        'POST',
        {
          account: 'urn:li:sponsoredAccount:123456',
          type: 'SPONSORED_STATUS_UPDATE',
          status: 'PAUSED',
          reference: 'urn:li:share:share-123456'
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Creative oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://api.linkedin.com/v2/adCreativesV2',
        'POST',
        {
          account: 'urn:li:sponsoredAccount:123456',
          type: 'SPONSORED_STATUS_UPDATE',
          status: 'PAUSED',
          reference: 'urn:li:share:share-123456'
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Ad oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        3,
        'https://api.linkedin.com/v2/adDirectSponsoredContentsV2',
        'POST',
        {
          account: 'urn:li:sponsoredAccount:123456',
          campaign: 'urn:li:sponsoredCampaign:campaign-id-123',
          creative: 'urn:li:sponsoredCreative:creative-id-123',
          status: 'PAUSED',
          name: 'Test LinkedIn Ad',
          locale: {
            country: 'US',
            language: 'en'
          }
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.ad.id).toBe('ad-id-123');
      expect(result.creative.id).toBe('creative-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
