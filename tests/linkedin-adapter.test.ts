import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkedInAdapter } from '../src/lib/linkedin-adapter';
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

describe('LinkedInAdapter', () => {
  let linkedinAdapter: LinkedInAdapter;
  let mockApiRequestManager: any;
  let mockAccount: SocialMediaAccount;

  beforeEach(() => {
    // Test öncesi mock'ları sıfırla
    vi.clearAllMocks();
    
    linkedinAdapter = new LinkedInAdapter();
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
        id: '123456789',
        localizedFirstName: 'Test',
        localizedLastName: 'User'
      });

      const result = await linkedinAdapter.authenticate(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/me',
        'GET',
        null,
        {
          'Authorization': 'Bearer test-access-token'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.status).toBe('active');
      expect(result.account_id).toBe('123456789');
      expect(result.account_name).toBe('Test User');
    });

    it('should return expired status when authentication fails', async () => {
      // Mock API hatasını ayarla
      mockApiRequestManager.makeRequest.mockRejectedValueOnce(new Error('Authentication failed'));

      const result = await linkedinAdapter.authenticate(mockAccount);

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
        expires_in: 5184000 // 60 gün
      });

      const result = await linkedinAdapter.refreshToken(mockAccount);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        'POST',
        {
          grant_type: 'refresh_token',
          refresh_token: 'test-refresh-token',
          client_id: '',
          client_secret: ''
        },
        {
          'Content-Type': 'application/x-www-form-urlencoded'
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

      const result = await linkedinAdapter.refreshToken(mockAccount);

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

      const result = await linkedinAdapter.publishContent(mockAccount, content);

      // API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/ugcPosts',
        'POST',
        {
          author: 'urn:li:person:123456789',
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: 'Test post content'
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('post-id-123');
    });

    it('should publish content with media successfully', async () => {
      // Mock API yanıtlarını ayarla - önce medya yükleme, sonra post oluşturma
      mockApiRequestManager.makeRequest
        .mockResolvedValueOnce({
          value: {
            asset: 'urn:li:digitalmediaAsset:123',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://api.linkedin.com/mediaUpload/123'
              }
            }
          }
        })
        .mockResolvedValueOnce({
          id: 'post-id-123'
        });

      const content = {
        text: 'Test post with media',
        media_urls: ['https://example.com/image.jpg']
      };

      const result = await linkedinAdapter.publishContent(mockAccount, content);

      // Medya kayıt API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        1,
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        'POST',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: 'urn:li:person:123456789',
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        },
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Post oluşturma API çağrısının doğru parametrelerle yapıldığını kontrol et
      expect(mockApiRequestManager.makeRequest).toHaveBeenNthCalledWith(
        2,
        'https://api.linkedin.com/v2/ugcPosts',
        'POST',
        expect.objectContaining({
          author: 'urn:li:person:123456789',
          specificContent: {
            'com.linkedin.ugc.ShareContent': expect.objectContaining({
              shareCommentary: {
                text: 'Test post with media'
              },
              shareMediaCategory: 'IMAGE',
              media: expect.any(Array)
            })
          }
        }),
        {
          'Authorization': 'Bearer test-access-token',
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      );

      // Sonucun doğru olduğunu kontrol et
      expect(result.id).toBe('post-id-123');
    });
  });

  // Diğer metodlar için benzer testler eklenebilir
});
