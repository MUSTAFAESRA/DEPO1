import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstagramAdapter } from '../src/lib/instagram-adapter';
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

describe('InstagramAdapter', () => {
  let instagramAdapter: InstagramAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    instagramAdapter = new InstagramAdapter();
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
        id: '123456789',
        username: 'testaccount'
      });

      const result = await instagramAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/123456789?fields=id,username&access_token=test-access-token',
        'GET'
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.account_name).toBe('testaccount');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await instagramAdapter.authenticate(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        access_token: 'new-access-token',
        expires_in: 5184000 // 60 gün
      });

      const result = await instagramAdapter.refreshToken(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        'GET',
        null,
        {
          'client_id': '',
          'client_secret': '',
          'grant_type': 'fb_exchange_token',
          'fb_exchange_token': 'test-refresh-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.access_token).toBe('new-access-token');
      expect(new Date(result.token_expiry).getTime()).toBeGreaterThan(Date.now());
    });

    it('should return expired status when refresh fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await instagramAdapter.refreshToken(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('publishContent', () => {
    it('should throw error when trying to publish without media', async () => {
      const content = {
        text: 'Test post content without media'
      };

      await expect(instagramAdapter.publishContent(mockAccount, content)).rejects.toThrow(
        'Instagram paylaşımları için en az bir medya gereklidir'
      );
    });

    it('should publish media content successfully', async () => {
      // Mock API yanıtlarını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        id: 'container-id-123'
      }).mockResolvedValueOnce({
        id: 'media-id-123'
      });

      const content = {
        text: 'Test photo caption',
        media_urls: ['https://example.com/image.jpg']
      };

      const result = await instagramAdapter.publishContent(mockAccount, content);

      // İlk API çağrısının doğru parametrelerle yapıldığını kontrol et (container oluşturma)
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://graph.facebook.com/v18.0/123456789/media',
        'POST',
        {
          image_url: 'https://example.com/image.jpg',
          caption: 'Test photo caption',
          access_token: 'test-access-token'
        }
      );

      // İkinci API çağrısının doğru parametrelerle yapıldığını kontrol et (medya yayınlama)
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://graph.facebook.com/v18.0/123456789/media_publish',
        'POST',
        {
          creation_id: 'container-id-123',
          access_token: 'test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('media-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
