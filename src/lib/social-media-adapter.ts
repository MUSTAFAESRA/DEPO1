import { SocialMediaAccount } from './social-media-account';

// Sosyal medya adaptörü arayüzü
export interface SocialMediaAdapter {
  authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount>;
  refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount>;
  publishContent(account: SocialMediaAccount, content: any): Promise<any>;
  scheduleContent(account: SocialMediaAccount, content: any, scheduledTime: string): Promise<any>;
  deleteContent(account: SocialMediaAccount, contentId: string): Promise<boolean>;
  getAnalytics(account: SocialMediaAccount, contentId?: string): Promise<any>;
  getComments(account: SocialMediaAccount, contentId: string): Promise<any[]>;
  replyToComment(account: SocialMediaAccount, commentId: string, reply: string): Promise<any>;
}

// API istek yöneticisi
export class ApiRequestManager {
  async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    data?: any, 
    headers?: Record<string, string>
  ): Promise<any> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`API isteği başarısız: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API isteği sırasında hata oluştu:', error);
      throw error;
    }
  }

  handleRateLimiting(retryAfter?: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, retryAfter || 5000);
    });
  }

  async handleErrors(error: any): Promise<void> {
    console.error('API hatası:', error);
    
    if (error.response && error.response.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10) * 1000;
      await this.handleRateLimiting(retryAfter);
    }
  }

  async retryFailedRequests<T>(
    requestFn: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await requestFn();
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        await this.handleErrors(error);
      }
    }
    
    throw new Error('Maksimum yeniden deneme sayısına ulaşıldı');
  }
}
