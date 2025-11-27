import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface DecryptedRequest {
  decryptedBody: any;
  aesKeyBuffer: Buffer;
  initialVectorBuffer: Buffer;
}

@Injectable()
export class FlowEncryptionService {
  private readonly logger = new Logger(FlowEncryptionService.name);

  /**
   * Decrypt incoming Flow request
   * @param encryptedFlowData - Base64 encoded encrypted data
   * @param encryptedAesKey - Base64 encoded encrypted AES key
   * @param initialVector - Base64 encoded initialization vector
   * @param privateKey - Business private key (PEM format)
   * @returns Decrypted request body, AES key, and IV
   */
  decryptRequest(
    encryptedFlowData: string,
    encryptedAesKey: string,
    initialVector: string,
    privateKey: string,
  ): DecryptedRequest {
    try {
      // Decode base64 inputs
      const flowDataBuffer = Buffer.from(encryptedFlowData, 'base64');
      const encryptedAesKeyBuffer = Buffer.from(encryptedAesKey, 'base64');
      const initialVectorBuffer = Buffer.from(initialVector, 'base64');

      // Decrypt the AES key using RSA private key
      const aesKeyBuffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedAesKeyBuffer,
      );

      // Decrypt the flow data using AES key
      const decipher = crypto.createDecipheriv(
        'aes-128-gcm',
        aesKeyBuffer,
        initialVectorBuffer,
      );

      // Extract authentication tag (last 16 bytes of encrypted data)
      const authTagLength = 16;
      const encryptedDataBody = flowDataBuffer.subarray(
        0,
        flowDataBuffer.length - authTagLength,
      );
      const authTag = flowDataBuffer.subarray(flowDataBuffer.length - authTagLength);

      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decryptedData = decipher.update(encryptedDataBody, undefined, 'utf-8');
      decryptedData += decipher.final('utf-8');

      const decryptedBody = JSON.parse(decryptedData);

      this.logger.debug('Request decrypted successfully');

      return {
        decryptedBody,
        aesKeyBuffer,
        initialVectorBuffer,
      };
    } catch (error) {
      this.logger.error('Failed to decrypt request', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt outgoing Flow response
   * @param response - Response object to encrypt
   * @param aesKeyBuffer - AES key from decrypted request
   * @param initialVectorBuffer - IV from decrypted request
   * @returns Base64 encoded encrypted response
   */
  encryptResponse(
    response: any,
    aesKeyBuffer: Buffer,
    initialVectorBuffer: Buffer,
  ): string {
    try {
      // Convert response to JSON string
      const responseJson = JSON.stringify(response);

      // IMPORTANT: Flip the IV for response encryption (WhatsApp Flow API requirement)
      // Each byte is XORed with 0xFF to create the flipped IV
      const flippedIv = Buffer.from(initialVectorBuffer.map(byte => byte ^ 0xFF));

      // Create cipher with flipped IV
      const cipher = crypto.createCipheriv(
        'aes-128-gcm',
        aesKeyBuffer,
        flippedIv,
      );

      // Encrypt the response
      let encryptedData = cipher.update(responseJson, 'utf-8');
      encryptedData = Buffer.concat([encryptedData, cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine encrypted data and auth tag
      const encryptedDataWithTag = Buffer.concat([encryptedData, authTag]);

      // Return as base64 string
      const result = encryptedDataWithTag.toString('base64');

      this.logger.debug('Response encrypted successfully');

      return result;
    } catch (error) {
      this.logger.error('Failed to encrypt response', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Verify request signature (X-Hub-Signature-256 header)
   * @param payload - Raw request body string
   * @param signature - Signature from X-Hub-Signature-256 header
   * @param appSecret - App secret from WhatsApp config
   * @returns True if signature is valid
   */
  verifySignature(payload: string, signature: string, appSecret: string): boolean {
    try {
      // Calculate expected signature
      const expectedSignature =
        'sha256=' +
        crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

      // Compare signatures (timing-safe comparison)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Signature verification failed', error);
      return false;
    }
  }

  /**
   * Generate RSA key pair for testing/development
   * @returns Public and private keys in PEM format
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }
}
