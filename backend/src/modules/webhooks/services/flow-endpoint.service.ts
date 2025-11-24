import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';

/**
 * Flow Endpoint Service
 * Handles business logic for Flow data exchange requests
 */
@Injectable()
export class FlowEndpointService {
  private readonly logger = new Logger(FlowEndpointService.name);

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
  ) {}

  /**
   * Handle INIT action - Return first screen data
   * Called when user opens the Flow
   */
  async handleInit(request: any): Promise<any> {
    this.logger.debug('Processing INIT action');

    const { flow_token } = request;

    // Extract context ID from flow_token if it contains context info
    // Format: {contextId}-{nodeId} or just a unique token
    let contextId: string | null = null;
    let initialData: any = {};

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      contextId = parts[0];

      // Load context to get variables for initial data
      if (contextId) {
        try {
          const context = await this.contextRepo.findOne({
            where: { id: contextId },
          });

          if (context) {
            initialData = context.variables || {};
          }
        } catch (error) {
          this.logger.warn(`Could not load context ${contextId}:`, error.message);
        }
      }
    }

    // Return initial screen
    // In a real implementation, you would determine which screen to show
    // based on flow_token or other business logic
    return {
      screen: 'WELCOME',
      data: initialData,
    };
  }

  /**
   * Handle data_exchange action - Process form submission and return next screen
   * Called when user submits a screen
   */
  async handleDataExchange(request: any): Promise<any> {
    this.logger.debug('Processing data_exchange action');

    const { screen, data, flow_token } = request;

    // Extract context info from flow_token
    let contextId: string | null = null;
    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      contextId = parts[0];
    }

    // Process based on current screen
    // This is where you implement your business logic
    switch (screen) {
      case 'WELCOME':
        // User submitted welcome screen, move to next screen
        return {
          screen: 'FORM_SCREEN',
          data: {
            // Provide data for the next screen
            user_name: data.name || '',
          },
        };

      case 'FORM_SCREEN':
        // User submitted form, validate and complete or show error
        if (!data.email || !this.isValidEmail(data.email)) {
          // Return to same screen with error
          return {
            screen: 'FORM_SCREEN',
            data: {
              error_message: 'Please enter a valid email address',
              ...data,
            },
          };
        }

        // Save data to context if available
        if (contextId) {
          try {
            await this.saveFlowDataToContext(contextId, data);
          } catch (error) {
            this.logger.error('Failed to save flow data:', error.message);
          }
        }

        // Complete the flow
        return {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token,
                some_param_name: 'value',
              },
            },
          },
        };

      default:
        this.logger.warn(`Unknown screen: ${screen}`);
        return {
          screen: 'SUCCESS',
          data: {},
        };
    }
  }

  /**
   * Handle BACK action - Return to previous screen
   * Optional: you can return the current screen or previous screen data
   */
  async handleBack(request: any): Promise<any> {
    this.logger.debug('Processing BACK action');

    const { screen } = request;

    // Return current screen (user stays on same screen)
    // Or implement logic to return previous screen
    return {
      screen: screen,
      data: {},
    };
  }

  /**
   * Save Flow response data to conversation context
   */
  private async saveFlowDataToContext(
    contextId: string,
    flowData: any,
  ): Promise<void> {
    const context = await this.contextRepo.findOne({
      where: { id: contextId },
    });

    if (!context) {
      this.logger.warn(`Context ${contextId} not found`);
      return;
    }

    // Get the output variable name from context
    const outputVariable = context.variables['__awaiting_flow_response__'];

    if (outputVariable) {
      // Save flow data to the specified variable
      context.variables[outputVariable] = flowData;
      delete context.variables['__awaiting_flow_response__'];
      await this.contextRepo.save(context);

      this.logger.log(
        `Flow data saved to variable '${outputVariable}' in context ${contextId}`,
      );
    }
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
