export interface Portfolio {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  images: string[] | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  type: string;
  description: string | null;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type PortfolioInsert = Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>;
export type PortfolioUpdate = Partial<PortfolioInsert>;

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'>;
export type ServiceUpdate = Partial<ServiceInsert>;

export type SiteSettingUpdate = Pick<SiteSetting, 'value'>;

export type SocialLinkInsert = Omit<SocialLink, 'id' | 'created_at'>;
export type SocialLinkUpdate = Partial<SocialLinkInsert>;
