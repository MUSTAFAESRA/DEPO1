import { SocialMediaAdapter, ApiRequestManager } from './social-media-adapter';
import { SocialMediaAccount } from './social-media-account';

export interface AdAdapter {
  authenticate(account: SocialMediaAccount): Promise<SocialMediaAccount>;
  refreshToken(account: SocialMediaAccount): Promise<SocialMediaAccount>;
  createCampaign(account: SocialMediaAccount, campaignData: any): Promise<any>;
  updateCampaign(account: SocialMediaAccount, campaignId: string, campaignData: any): Promise<any>;
  pauseCampaign(account: SocialMediaAccount, campaignId: string): Promise<any>;
  resumeCampaign(account: SocialMediaAccount, campaignId: string): Promise<any>;
  deleteCampaign(account: SocialMediaAccount, campaignId: string): Promise<boolean>;
  createAd(account: SocialMediaAccount, campaignId: string, adData: any): Promise<any>;
  updateAd(account: SocialMediaAccount, adId: string, adData: any): Promise<any>;
  pauseAd(account: SocialMediaAccount, adId: string): Promise<any>;
  resumeAd(account: SocialMediaAccount, adId: string): Promise<any>;
  deleteAd(account: SocialMediaAccount, adId: string): Promise<boolean>;
  getAnalytics(account: SocialMediaAccount, entityId?: string, entityType?: string): Promise<any>;
}

// API istek yöneticisi - social-media-adapter.ts'deki ile aynı
export { ApiRequestManager } from './social-media-adapter';
