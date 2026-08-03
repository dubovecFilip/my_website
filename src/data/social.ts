export type SocialIconName = 'twitch' | 'kick' | 'youtube' | 'tiktok' | 'x' | 'kofi' | 'steam';

export interface SocialLink {
  label: string;
  url: string;
  icon: SocialIconName;
}

export const socialLinks: SocialLink[] = [
  { label: 'Kick', url: 'https://kick.com/boggelino', icon: 'kick' },
  { label: 'YouTube', url: 'https://youtube.com/@boggelino', icon: 'youtube' },
  { label: 'YouTube Extra', url: 'https://www.youtube.com/@BOGGELINO_Extra', icon: 'youtube' },
  { label: 'Steam', url: 'https://steamcommunity.com/id/boggelino', icon: 'steam' },
  { label: 'TikTok', url: 'https://tiktok.com/@boggelino', icon: 'tiktok' },
  { label: 'X', url: 'https://x.com/boggelino', icon: 'x' },
  { label: 'Ko-fi', url: 'https://ko-fi.com/boggelino/', icon: 'kofi' },
  { label: 'Twitch', url: 'https://twitch.tv/boggelino', icon: 'twitch' },
];
