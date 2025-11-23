/**
 * Minimal WhatsApp Flow Webhook Handler Örneği
 *
 * Bu örnek, temel bir webhook handler'ın nasıl implemente edileceğini gösterir.
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FlowCryptoUtil } from './flow-crypto.util';

interface FlowRequest {
  action: string;
  screen?: string;
  data?: any;
  flow_token?: string;
}

interface FlowResponse {
  version: string;
  screen?: string;
  data?: any;
}

@Controller('flow-webhook')
export class SimpleWebhookController {
  private privateKey: string;
  private publicKey: string;

  constructor() {
    // RSA key pair oluştur
    const keys = FlowCryptoUtil.generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;

    console.log('Public Key:', this.publicKey);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleFlowRequest(@Body() body: any) {
    try {
      // 1. Request'i decrypt et
      const decryptedRequest: FlowRequest = FlowCryptoUtil.decryptRequest(
        body,
        this.privateKey,
      );

      console.log('Request:', decryptedRequest);

      // 2. Response'u hazırla
      let responseData: FlowResponse;

      switch (decryptedRequest.action) {
        case 'ping':
          // Health check
          responseData = {
            version: '3.1',
            data: { status: 'active' },
          };
          break;

        case 'INIT':
          // Flow başlangıcı
          responseData = {
            version: '3.0',
            screen: 'MAIN_SCREEN',
            data: {},
          };
          break;

        case 'data_exchange':
          // Custom action
          responseData = this.handleDataExchange(decryptedRequest);
          break;

        default:
          responseData = {
            version: '3.1',
            data: { error: 'Unknown action' },
          };
      }

      // 3. Response'u encrypt et
      const aesKey = Buffer.from(body.encrypted_aes_key, 'base64');
      const initialVector = Buffer.from(body.initial_vector, 'base64');

      const encryptedResponse = FlowCryptoUtil.encryptResponse(
        responseData,
        aesKey.subarray(0, 16),
        initialVector,
      );

      console.log('Response:', responseData);

      // 4. Encrypted response döndür
      return {
        encrypted_flow_data: encryptedResponse,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        error: 'Failed to process request',
        message: error.message,
      };
    }
  }

  private handleDataExchange(request: FlowRequest): FlowResponse {
    const { screen, data } = request;

    // Örnek: Müsait saatleri döndür
    if (data?.action === 'get_available_slots') {
      return {
        version: '3.0',
        screen: screen,
        data: {
          available_slots: [
            { id: '09:00', title: '09:00', enabled: true },
            { id: '10:00', title: '10:00', enabled: true },
            { id: '11:00', title: '11:00', enabled: true },
          ],
        },
      };
    }

    // Örnek: Form submit
    if (data?.action === 'submit_form') {
      return {
        version: '3.0',
        screen: 'SUCCESS',
        data: {
          confirmation: `Form submitted: ${data.name}`,
        },
      };
    }

    // Default response
    return {
      version: '3.0',
      screen: screen,
      data: {},
    };
  }
}

/**
 * Kullanım:
 *
 * 1. Bu controller'ı NestJS module'e ekle
 * 2. Server'ı başlat: npm run start:dev
 * 3. Public key'i WhatsApp Business Manager'a ekle
 * 4. Endpoint URL'i yapılandır: https://your-domain.com/flow-webhook
 *
 * Test:
 * curl -X POST http://localhost:3000/flow-webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"encrypted_flow_data":"...","encrypted_aes_key":"...","initial_vector":"..."}'
 */
