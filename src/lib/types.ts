export interface DeveloperProfile {
  id: number;
  email: string;
  full_name: string;
  date_joined: string;
}

export interface App {
  id: number;
  name: string;
  description: string;
  owner_slug: string;
  is_active: boolean;
  api_key_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  app: number;
  app_name: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated {
  id: number;
  name: string;
  key_prefix: string;
  raw_key: string;
  expires_at: string | null;
  created_at: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  email: string;
  full_name: string;
}

export interface HealthStatus {
  status: string;
  providers: Record<string, string>;
}
