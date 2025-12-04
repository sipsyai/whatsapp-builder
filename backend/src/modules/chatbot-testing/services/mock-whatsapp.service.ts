import { Injectable, Logger } from '@nestjs/common';
import { IMessageSender } from '../interfaces/message-sender.interface';
import { SendTextMessageDto } from '../../whatsapp/dto/requests/send-text-message.dto';
import {
  SendInteractiveButtonDto,
  SendInteractiveListDto,
} from '../../whatsapp/dto/requests/send-interactive-message.dto';
import { SendFlowMessageDto } from '../../whatsapp/dto/requests/send-flow-message.dto';
import { MessageResponse } from '../../whatsapp/interfaces/message.interface';
import { TestSessionGateway } from '../../websocket/test-session.gateway';

/**
 * Mock WhatsApp Service for Testing
 *
 * This service implements IMessageSender interface for test sessions.
 * It does NOT:
 * - Save messages to database
 * - Send actual requests to WhatsApp API
 *
 * It DOES:
 * - Log all message operations
 * - Emit events to TestSessionGateway via WebSocket
 * - Return fake message IDs for tracking
 */
@Injectable()
export class MockWhatsAppService implements IMessageSender {
  private readonly logger = new Logger(MockWhatsAppService.name);

  constructor(private readonly testSessionGateway: TestSessionGateway) {}

  /**
   * Send a mock text message
   * Emits the message to WebSocket for test UI display
   */
  async sendTextMessage(dto: SendTextMessageDto): Promise<MessageResponse> {
    this.logger.debug(
      `[MOCK] Sending text message to ${dto.to}: ${dto.text.substring(0, 50)}...`,
    );

    const fakeMessageId = this.generateFakeMessageId();

    // Extract test session ID from recipient (format: test_session_id or phone number)
    const testSessionId = this.extractTestSessionId(dto.to);

    if (testSessionId) {
      // Emit bot response to test session
      this.testSessionGateway.emitBotResponse(
        testSessionId,
        [{ content: dto.text, type: 'text' }],
        'mock-node', // nodeId will be set by caller if needed
      );

      this.logger.log(
        `[MOCK] Text message emitted to test session: ${testSessionId}`,
      );
    }

    return this.createMockResponse(dto.to, fakeMessageId);
  }

  /**
   * Send a mock interactive button message
   */
  async sendInteractiveButtonMessage(
    dto: SendInteractiveButtonDto,
  ): Promise<MessageResponse> {
    this.logger.debug(
      `[MOCK] Sending interactive button message to ${dto.to}`,
    );

    const fakeMessageId = this.generateFakeMessageId();
    const testSessionId = this.extractTestSessionId(dto.to);

    if (testSessionId) {
      // Format button message for display
      const buttonLabels = dto.buttons.map((b) => b.title).join(', ');
      const content = `${dto.bodyText}\n\n[Buttons: ${buttonLabels}]`;

      this.testSessionGateway.emitBotResponse(
        testSessionId,
        [{ content, type: 'interactive' }],
        'mock-node',
      );

      // Also emit waiting for input with button type
      this.testSessionGateway.emitWaitingInput(
        testSessionId,
        'mock-node',
        dto.bodyText,
        'button',
      );

      this.logger.log(
        `[MOCK] Interactive button message emitted to test session: ${testSessionId}`,
      );
    }

    return this.createMockResponse(dto.to, fakeMessageId);
  }

  /**
   * Send a mock interactive list message
   */
  async sendInteractiveListMessage(
    dto: SendInteractiveListDto,
  ): Promise<MessageResponse> {
    this.logger.debug(`[MOCK] Sending interactive list message to ${dto.to}`);

    const fakeMessageId = this.generateFakeMessageId();
    const testSessionId = this.extractTestSessionId(dto.to);

    if (testSessionId) {
      // Format list message for display
      const sectionInfo = dto.sections
        .map((s) => `${s.title}: ${s.rows.map((r) => r.title).join(', ')}`)
        .join(' | ');
      const content = `${dto.bodyText}\n\n[List: ${dto.listButtonText}]\n${sectionInfo}`;

      this.testSessionGateway.emitBotResponse(
        testSessionId,
        [{ content, type: 'interactive' }],
        'mock-node',
      );

      // Emit waiting for input with list type
      this.testSessionGateway.emitWaitingInput(
        testSessionId,
        'mock-node',
        dto.bodyText,
        'list',
      );

      this.logger.log(
        `[MOCK] Interactive list message emitted to test session: ${testSessionId}`,
      );
    }

    return this.createMockResponse(dto.to, fakeMessageId);
  }

  /**
   * Send a mock WhatsApp Flow message
   */
  async sendFlowMessage(dto: SendFlowMessageDto): Promise<MessageResponse> {
    this.logger.debug(
      `[MOCK] Sending flow message to ${dto.to}, Flow ID: ${dto.flowId}`,
    );

    const fakeMessageId = this.generateFakeMessageId();
    const testSessionId = this.extractTestSessionId(dto.to);

    if (testSessionId) {
      // Format flow message for display
      const content = `${dto.body}\n\n[Flow: ${dto.ctaText}]`;

      this.testSessionGateway.emitBotResponse(
        testSessionId,
        [{ content, type: 'flow' }],
        'mock-node',
      );

      // Emit flow sent event
      this.testSessionGateway.emitFlowSent(testSessionId, dto.flowId, {
        ctaText: dto.ctaText,
        header: dto.header,
        footer: dto.footer,
        initialScreen: dto.initialScreen,
        initialData: dto.initialData,
        mode: dto.mode,
      });

      // Emit waiting for input with flow type
      this.testSessionGateway.emitWaitingInput(
        testSessionId,
        'mock-node',
        dto.body,
        'flow',
      );

      this.logger.log(
        `[MOCK] Flow message emitted to test session: ${testSessionId}`,
      );
    }

    return this.createMockResponse(dto.to, fakeMessageId);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Generate a fake WhatsApp message ID
   * Format similar to real WhatsApp message IDs
   */
  private generateFakeMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `wamid.mock_${timestamp}_${random}`;
  }

  /**
   * Extract test session ID from recipient
   * In test mode, the 'to' field may contain a test session identifier
   */
  private extractTestSessionId(to: string): string | null {
    // If 'to' starts with 'test_', it's a test session ID
    if (to.startsWith('test_')) {
      return to;
    }

    // Check if we have metadata attached (format: phone|test_session_id)
    if (to.includes('|')) {
      const parts = to.split('|');
      const sessionPart = parts.find((p) => p.startsWith('test_'));
      return sessionPart || null;
    }

    return null;
  }

  /**
   * Create a mock WhatsApp API response
   */
  private createMockResponse(
    to: string,
    messageId: string,
  ): MessageResponse {
    // Clean phone number (remove test session ID if present)
    const phoneNumber = to.includes('|') ? to.split('|')[0] : to;
    const cleanPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');

    return {
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: cleanPhoneNumber,
          wa_id: cleanPhoneNumber.replace('+', ''),
        },
      ],
      messages: [
        {
          id: messageId,
          message_status: 'accepted',
        },
      ],
    };
  }
}
