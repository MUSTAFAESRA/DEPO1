import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwitterAdapter } from '../src/lib/twitter-adapter';
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

describe('TwitterAdapter', () => {
  let twitterAdapter: TwitterAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    twitterAdapter = new TwitterAdapter();
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
        data: {
          id: '123456789',
          username: 'testaccount'
        }
      });

      const result = await twitterAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.twitter.com/2/users/me',
        'GET',
        null,
        {
          'Authorization': 'Bearer test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.account_id).toBe('123456789');
      expect(result.account_name).toBe('testaccount');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await twitterAdapter.authenticate(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 7200 // 2 saat
      });

      const result = await twitterAdapter.refreshToken(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.twitter.com/oauth2/token',
        'POST',
        {
          grant_type: 'refresh_token',
          refresh_token: 'test-refresh-token',
          client_id: ''
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(new Date(result.token_expiry).getTime()).toBeGreaterThan(Date.now());
    });

    it('should return expired status when refresh fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await twitterAdapter.refreshToken(mockAccount);

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('expired');
    });
  });

  describe('publishContent', () => {
    it('should publish text content successfully', async () => {
      // Mock API yanıtını ayarla
      mockApiRequestManager.makeRequest.mockResolvedValueOnce({
        data: {
          id: 'tweet-id-123',
          text: 'Test tweet content'
        }
      });

      const content = {
        text: 'Test tweet content'
      };

      const result = await twitterAdapter.publishContent(mockAccount, content);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
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

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('tweet-id-123');
      expect(result.text).toBe('Test tweet content');
    });

    it('should publish content with media successfully', async () => {
      // Mock API yanıtlarını ayarla - önce medya yükleme, sonra tweet oluşturma
      mockApiRequestManager.makeRequest
        .mockResolvedValueOnce({
          media_id_string: 'media-id-123'
        })
        .mockResolvedValueOnce({
          data: {
            id: 'tweet-id-123',
            text: 'Test tweet with media'
          }
        });

      const content = {
        text: 'Test tweet with media',
        media_urls: ['https://example.com/image.jpg']
      };

      const result = await twitterAdapter.publishContent(mockAccount, content);

      // Medya yükleme API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://upload.twitter.com/1.1/media/upload.json',
        'POST',
        {
          media_data: 'https://example.com/image.jpg',
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      );

      // Tweet oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://api.twitter.com/2/tweets',
        'POST',
        {
          text: 'Test tweet with media',
          media: { media_ids: ['media-id-123'] }
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('tweet-id-123');
      expect(result.text).toBe('Test tweet with media');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
