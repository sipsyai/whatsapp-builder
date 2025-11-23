export default () => ({
  whatsapp: {
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    baseUrl: process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.PHONE_NUMBER_ID || '',
    wabaId: process.env.WABA_ID || '',
    appId: process.env.APP_ID,
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || '',
    flowEndpointUrl: process.env.FLOW_ENDPOINT_URL || '',
    encryptionPrivateKey: process.env.WHATSAPP_PRIVATE_KEY,
    encryptionPublicKey: process.env.WHATSAPP_PUBLIC_KEY,
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
  },
  rateLimit: {
    ttl: 60,
    limit: 100,
  },
});
