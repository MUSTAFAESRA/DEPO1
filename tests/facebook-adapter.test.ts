import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacebookAdapter } from '../src/lib/facebook-adapter';
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

describe('FacebookAdapter', () => {
  let facebookAdapter: FacebookAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    facebookAdapter = new FacebookAdapter();
    mockApiRequestManager = (ApiRequestManager as any).mock.results[0].value;
    
    mockAccount = {
      id: 'test-id',
      user_id: 'user-id',
      platform: 'facebook',
      account_name: 'Test Account',
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
        name: 'Test User'
      });

      const result = await facebookAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/me?access_token=test-access-token',
        'GET'
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.account_id).toBe('123456789');
      expect(result.account_name).toBe('Test User');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await facebookAdapter.authenticate(mockAccount);

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

      const result = await facebookAdapter.refreshToken(mockAccount);

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

      const result = await facebookAdapter.refreshToken(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('publishContent', () => {
    it('should publish text content successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        id: 'post-id-123'
      });

      const content = {
        text: 'Test post content'
      };

      const result = await facebookAdapter.publishContent(mockAccount, content);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/123456789/feed',
        'POST',
        {
          message: 'Test post content',
          access_token: 'test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('post-id-123');
    });

    it('should publish image content successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        id: 'photo-id-123'
      });

      const content = {
        text: 'Test photo caption',
        media_urls: ['https://example.com/image.jpg']
      };

      const result = await facebookAdapter.publishContent(mockAccount, content);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/123456789/photos',
        'POST',
        {
          message: 'Test photo caption',
          url: 'https://example.com/image.jpg',
          access_token: 'test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('photo-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
