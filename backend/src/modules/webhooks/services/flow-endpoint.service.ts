import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Flow Endpoint Service
 * Handles business logic for Flow data exchange requests
 */
@Injectable()
export class FlowEndpointService {
  private readonly logger = new Logger(FlowEndpointService.name);

  // Strapi API configuration for Fiyat Guncelleme flow
  private readonly strapiBaseUrl = 'http://192.168.1.18:1337';
  private readonly strapiToken = 'd3a4028ba0d5f00b572132d037ada86fef5a735be3efad3db46cec5ab72c82f1f1bf5bd228af0257d93d4f7ab935d5cf8ce9564f5b7db50928d245f4a3fdeef4d7aa460a4ef200eb6106cf15dc9aaba9f716b074493a9a7b246ed5054c3a714b9160d3cc59bc33c0cf485d875216e4c28eeccf5573a1be888d8b5f9f67e4813c';

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
    private readonly configService: ConfigService,
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

    // Fetch brands from Strapi for BRAND_SCREEN
    try {
      const brands = await this.fetchBrandsFromStrapi();
      this.logger.debug(`Fetched ${brands.length} brands from Strapi`);

      return {
        screen: 'BRAND_SCREEN',
        data: {
          brands: brands,
          ...initialData,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`);
      // Return with empty brands if fetch fails
      return {
        screen: 'BRAND_SCREEN',
        data: {
          brands: [],
          ...initialData,
        },
      };
    }
  }

  /**
   * Fetch brands from Strapi API
   */
  private async fetchBrandsFromStrapi(): Promise<{ id: string; title: string }[]> {
    const response = await fetch(`${this.strapiBaseUrl}/api/brands`, {
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Strapi response to Flow dropdown format
    return (data.data || []).map((brand: any) => ({
      id: brand.name || brand.id?.toString(),
      title: brand.name,
    }));
  }

  /**
   * Fetch products by brand from Strapi API
   */
  private async fetchProductsByBrand(brandName: string): Promise<{ id: string; title: string }[]> {
    const url = `${this.strapiBaseUrl}/api/products?filters[brand][name][$eq]=${encodeURIComponent(brandName)}&pagination[pageSize]=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to dropdown format with price info
    return (data.data || []).map((product: any) => ({
      id: product.documentId || product.id?.toString(),
      title: `${product.name} - ${this.formatPrice(product.price)} TL`,
    }));
  }

  /**
   * Fetch single product details from Strapi
   */
  private async fetchProductDetails(productId: string): Promise<any> {
    const url = `${this.strapiBaseUrl}/api/products/${productId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.strapiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update product price in Strapi
   */
  private async updateProductPrice(productId: string, newPrice: number): Promise<any> {
    const url = `${this.strapiBaseUrl}/api/products/${productId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.strapiToken}`,
      },
      body: JSON.stringify({
        data: {
          price: newPrice,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Format price with thousands separator
   */
  private formatPrice(price: number): string {
    return price?.toLocaleString('tr-TR') || '0';
  }

  /**
   * Handle data_exchange action - Process form submission and return next screen
   * Called when user submits a screen
   */
  async handleDataExchange(request: any): Promise<any> {
    this.logger.debug('Processing data_exchange action');

    const { screen, data, flow_token } = request;

    this.logger.debug(`Screen: ${screen}, Data: ${JSON.stringify(data)}`);

    // Extract context info from flow_token
    let contextId: string | null = null;
    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      contextId = parts[0];
    }

    // Process based on current screen - Fiyat Guncelleme Flow
    switch (screen) {
      case 'BRAND_SCREEN':
        // User selected a brand, fetch products for that brand
        const selectedBrand = data.selected_brand;
        this.logger.debug(`Selected brand: ${selectedBrand}`);

        try {
          const products = await this.fetchProductsByBrand(selectedBrand);
          this.logger.debug(`Fetched ${products.length} products for brand ${selectedBrand}`);

          return {
            screen: 'PRODUCT_SCREEN',
            data: {
              brand_name: selectedBrand,
              products: products,
            },
          };
        } catch (error) {
          this.logger.error(`Failed to fetch products: ${error.message}`);
          return {
            screen: 'PRODUCT_SCREEN',
            data: {
              brand_name: selectedBrand,
              products: [],
            },
          };
        }

      case 'PRODUCT_SCREEN':
        // User selected a product, fetch product details
        const selectedProductId = data.selected_product;
        this.logger.debug(`Selected product ID: ${selectedProductId}`);

        try {
          const product = await this.fetchProductDetails(selectedProductId);
          this.logger.debug(`Product details: ${JSON.stringify(product)}`);

          return {
            screen: 'PRICE_UPDATE_SCREEN',
            data: {
              product_id: selectedProductId,
              product_name: product.name,
              product_sku: product.sku || 'N/A',
              current_price: this.formatPrice(product.price) + ' TL',
            },
          };
        } catch (error) {
          this.logger.error(`Failed to fetch product: ${error.message}`);
          return {
            screen: 'PRICE_UPDATE_SCREEN',
            data: {
              product_id: selectedProductId,
              product_name: 'Unknown',
              product_sku: 'N/A',
              current_price: '0 TL',
            },
          };
        }

      case 'PRICE_UPDATE_SCREEN':
        // User entered new price, update in Strapi
        const productId = data.product_id || request.data?.product_id;
        const newPriceStr = data.new_price;
        const newPrice = parseInt(newPriceStr, 10);
        const oldPrice = data.current_price || data.old_price;
        const productName = data.product_name;

        this.logger.debug(`Updating product ${productId} price to ${newPrice}`);

        try {
          await this.updateProductPrice(productId, newPrice);
          this.logger.log(`Price updated successfully for product ${productId}`);

          // Save data to context if available
          if (contextId) {
            try {
              await this.saveFlowDataToContext(contextId, {
                product_name: productName,
                old_price: oldPrice,
                new_price: this.formatPrice(newPrice) + ' TL',
              });
            } catch (error) {
              this.logger.error('Failed to save flow data:', error.message);
            }
          }

          // Complete the flow with success screen
          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              product_name: productName,
              old_price: oldPrice,
              new_price: this.formatPrice(newPrice) + ' TL',
              extension_message_response: {
                params: {
                  flow_token,
                  product_name: productName,
                  old_price: oldPrice,
                  new_price: this.formatPrice(newPrice) + ' TL',
                  update_status: 'success',
                },
              },
            },
          };
        } catch (error) {
          this.logger.error(`Failed to update price: ${error.message}`);
          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              product_name: productName,
              old_price: oldPrice,
              new_price: this.formatPrice(newPrice) + ' TL',
              extension_message_response: {
                params: {
                  flow_token,
                  error: error.message,
                  update_status: 'failed',
                },
              },
            },
          };
        }

      default:
        this.logger.warn(`Unknown screen: ${screen}`);

        // Save data to context if available
        if (contextId && data) {
          try {
            await this.saveFlowDataToContext(contextId, data);
          } catch (error) {
            this.logger.error('Failed to save flow data:', error.message);
          }
        }

        // Complete flow with all submitted data
        return {
          screen: 'SUCCESS_SCREEN',
          data: {
            extension_message_response: {
              params: {
                flow_token,
                ...data,
              },
            },
          },
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
