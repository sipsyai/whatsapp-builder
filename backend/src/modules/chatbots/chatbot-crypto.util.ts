import * as crypto from 'crypto';

export class ChatBotCryptoUtil {
  /**
   * Decrypt WhatsApp ChatBot request body
   * @param body Encrypted request body from WhatsApp
   * @param privateKey Your private key for decryption
   * @param passphrase Private key passphrase (if any)
   * @returns Decrypted data
   */
  static decryptRequest(
    body: {
      encrypted_aes_key: string;
      encrypted_chatbot_data: string;
      initial_vector: string;
    },
    privateKey: string,
    passphrase?: string,
  ): any {
    try {
      // Decode base64 encoded data
      const encryptedAesKey = Buffer.from(body.encrypted_aes_key, 'base64');
      const encryptedChatBotData = Buffer.from(body.encrypted_chatbot_data, 'base64');
      const initialVector = Buffer.from(body.initial_vector, 'base64');

      // Decrypt the AES key using RSA private key
      const decryptedAesKey = crypto.privateDecrypt(
        {
          key: privateKey,
          passphrase: passphrase || '',
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedAesKey,
      );

      // Split encrypted data into tag and ciphertext
      const TAG_LENGTH = 16;
      const encryptedChatBotDataBody = encryptedChatBotData.subarray(0, -TAG_LENGTH);
      const encryptedChatBotDataTag = encryptedChatBotData.subarray(-TAG_LENGTH);

      // Decrypt the chatbot data using AES-GCM
      const decipher = crypto.createDecipheriv(
        'aes-128-gcm',
        decryptedAesKey,
        initialVector,
      );
      decipher.setAuthTag(encryptedChatBotDataTag);

      const decryptedData = Buffer.concat([
        decipher.update(encryptedChatBotDataBody),
        decipher.final(),
      ]);

      return JSON.parse(decryptedData.toString('utf-8'));
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt request');
    }
  }

  /**
   * Encrypt WhatsApp ChatBot response
   * @param response Response data to encrypt
   * @param aesKey AES key from the decrypted request
   * @param initialVector IV from the request
   * @returns Encrypted response
   */
  static encryptResponse(
    response: any,
    aesKey: Buffer,
    initialVector: Buffer,
  ): string {
    try {
      // Convert response to JSON string
      const responseString = JSON.stringify(response);

      // Encrypt using AES-GCM
      const cipher = crypto.createCipheriv(
        'aes-128-gcm',
        aesKey,
        initialVector,
      );

      const encryptedData = Buffer.concat([
        cipher.update(responseString, 'utf-8'),
        cipher.final(),
      ]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine encrypted data and tag
      const encryptedDataWithTag = Buffer.concat([encryptedData, authTag]);

      // Return base64 encoded
      return encryptedDataWithTag.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt response');
    }
  }

  /**
   * Generate RSA key pair for testing
   * In production, you should generate this once and store securely
   */
  static generateKeyPair(): {
    publicKey: string;
    privateKey: string;
  } {
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
