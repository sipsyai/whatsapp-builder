export interface WhatsAppConfig {
  apiVersion: string;
  baseUrl: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  appId?: string;
  webhookVerifyToken: string;
  flowEndpointUrl: string;
  encryptionPrivateKey?: string;
  encryptionPublicKey?: string;
}

export interface AppConfig {
  port: number;
  environment: string;
}

export interface RateLimitConfig {
  ttl: number;
  limit: number;
}

export interface Configuration {
  whatsapp: WhatsAppConfig;
  app: AppConfig;
  rateLimit: RateLimitConfig;
}
