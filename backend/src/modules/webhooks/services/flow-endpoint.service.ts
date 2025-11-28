import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { WhatsAppFlow } from '../../../entities/whatsapp-flow.entity';
import { ConfigService } from '@nestjs/config';
import { DataSourcesService } from '../../data-sources/data-sources.service';

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
    @InjectRepository(WhatsAppFlow)
    private readonly flowRepo: Repository<WhatsAppFlow>,
    private readonly configService: ConfigService,
    private readonly dataSourcesService: DataSourcesService,
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
    let nodeId: string | null = null;
    let initialData: any = {};
    let dataSourceId: string | null = null;

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      // UUID format: 8-4-4-4-12 = 5 parts when split by '-'
      // flow_token format: {contextId}-{nodeId}
      if (parts.length >= 6) {
        contextId = parts.slice(0, 5).join('-');
        nodeId = parts.slice(5).join('-');
      }

      // Load context to get variables and flow configuration
      if (contextId) {
        try {
          const context = await this.contextRepo.findOne({
            where: { id: contextId },
            relations: ['chatbot'],
          });

          if (context) {
            initialData = context.variables || {};

            // Find the WhatsApp Flow node to get the flow ID
            if (nodeId && context.chatbot) {
              const flowNode = context.chatbot.nodes?.find(
                (n: any) => n.id === nodeId,
              );
              if (flowNode?.data?.whatsappFlowId) {
                // Load the flow to get dataSourceId
                const flow = await this.flowRepo.findOne({
                  where: { whatsappFlowId: flowNode.data.whatsappFlowId },
                });
                if (flow) {
                  dataSourceId = flow.dataSourceId || null;
                  this.logger.debug(
                    `Flow loaded: ${flow.name}, dataSourceId: ${dataSourceId}`,
                  );
                }
              }
            }
          }
        } catch (error) {
          this.logger.warn(
            `Could not load context ${contextId}:`,
            error.message,
          );
        }
      }
    }

    // Get data source configuration
    const dsConfig = await this.getDataSourceConfig(dataSourceId);

    if (!dsConfig) {
      this.logger.error('No data source configuration available');
      return {
        screen: 'BRAND_SCREEN',
        data: {
          brands: [],
          ...initialData,
        },
      };
    }

    // Fetch brands from Strapi for BRAND_SCREEN
    try {
      const brands = await this.fetchBrandsFromStrapi(dsConfig);
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
  private async fetchBrandsFromStrapi(
    config: { baseUrl: string; token: string },
  ): Promise<{ id: string; title: string }[]> {
    const response = await fetch(`${config.baseUrl}/api/brands`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
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
  private async fetchProductsByBrand(
    brandName: string,
    config: { baseUrl: string; token: string },
  ): Promise<{ id: string; title: string }[]> {
    const url = `${config.baseUrl}/api/products?filters[brand][name][$eq]=${encodeURIComponent(brandName)}&pagination[pageSize]=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
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
  private async fetchProductDetails(
    productId: string,
    config: { baseUrl: string; token: string },
  ): Promise<any> {
    // Try with documentId first, then with numeric id filter
    let url = `${config.baseUrl}/api/products/${productId}?populate=*`;
    this.logger.log(
      `Fetching product details - productId: ${productId}, url: ${url}`,
    );

    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    // If 404, try with numeric id filter
    if (response.status === 404) {
      url = `${config.baseUrl}/api/products?filters[id][$eq]=${productId}&populate=*`;
      this.logger.debug(`Retrying with filter: ${url}`);

      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const filterData = await response.json();
      if (filterData.data && filterData.data.length > 0) {
        return filterData.data[0];
      }
      throw new Error('Product not found');
    }

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Update product price in Strapi
   */
  private async updateProductPrice(
    documentId: string,
    newPrice: number,
    config: { baseUrl: string; token: string },
    newOriginalPrice?: number,
  ): Promise<any> {
    const url = `${config.baseUrl}/api/products/${documentId}`;

    const updateData: any = {
      price: newPrice,
    };

    if (newOriginalPrice && newOriginalPrice > 0) {
      updateData.originalPrice = newOriginalPrice;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        data: updateData,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Strapi update error: ${response.status} - ${errorBody}`,
      );
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
    this.logger.log('Processing data_exchange action');

    const { screen, data, flow_token } = request;

    this.logger.log(`Screen: ${screen}, Data: ${JSON.stringify(data)}`);

    // Extract context info from flow_token
    // flow_token format: {contextId}-{nodeId} where contextId is UUID (5 parts)
    let contextId: string | null = null;
    let nodeId: string | null = null;
    let dataSourceId: string | null = null;

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      if (parts.length >= 6) {
        contextId = parts.slice(0, 5).join('-');
        nodeId = parts.slice(5).join('-');
      }
    }

    // Load context to get flow configuration
    if (contextId) {
      try {
        const context = await this.contextRepo.findOne({
          where: { id: contextId },
          relations: ['chatbot'],
        });

        if (context && nodeId && context.chatbot) {
          // Find the WhatsApp Flow node to get the flow ID
          const flowNode = context.chatbot.nodes?.find((n: any) => n.id === nodeId);
          if (flowNode?.data?.whatsappFlowId) {
            // Load the flow to get dataSourceId
            const flow = await this.flowRepo.findOne({
              where: { whatsappFlowId: flowNode.data.whatsappFlowId },
            });
            if (flow) {
              dataSourceId = flow.dataSourceId || null;
              this.logger.debug(
                `Flow loaded: ${flow.name}, dataSourceId: ${dataSourceId}`,
              );
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `Could not load context ${contextId}:`,
          error.message,
        );
      }
    }

    // Get data source configuration
    const dsConfig = await this.getDataSourceConfig(dataSourceId);

    if (!dsConfig) {
      this.logger.error('No data source configuration available');
      return {
        screen: 'ERROR_SCREEN',
        data: {
          error_message: 'Data source configuration not found',
          error_details: 'Unable to process request without data source',
        },
      };
    }

    // Process based on current screen - Fiyat Guncelleme Flow
    switch (screen) {
      case 'BRAND_SCREEN':
        // User selected a brand, fetch products for that brand
        const selectedBrand = data.selected_brand;
        this.logger.debug(`Selected brand: ${selectedBrand}`);

        try {
          const products = await this.fetchProductsByBrand(
            selectedBrand,
            dsConfig,
          );
          this.logger.debug(
            `Fetched ${products.length} products for brand ${selectedBrand}`,
          );

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
        // Flow sends: selected_product (from dropdown named "product")
        const selectedProductId =
          data.selected_product || data.product_id || data.product;
        this.logger.debug(`Selected product ID: ${selectedProductId}`);

        try {
          const product = await this.fetchProductDetails(
            selectedProductId,
            dsConfig,
          );
          this.logger.debug(`Product details: ${JSON.stringify(product)}`);

          // Calculate discount percentage
          const currentDiscount =
            product.originalPrice && product.originalPrice > product.price
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : 0;

          return {
            screen: 'PRICE_UPDATE_SCREEN',
            data: {
              product_id: product.documentId || selectedProductId,
              product_name: product.name,
              product_sku:
                product.sku || product.documentId || selectedProductId,
              current_price: `${this.formatPrice(product.price)} TL`,
            },
          };
        } catch (error) {
          this.logger.error(`Failed to fetch product: ${error.message}`);
          return {
            screen: 'PRICE_UPDATE_SCREEN',
            data: {
              product_id: selectedProductId,
              product_name: 'Bilinmeyen Ürün',
              product_sku: selectedProductId,
              current_price: '0 TL',
            },
          };
        }

      case 'PRICE_UPDATE_SCREEN':
        // User submitted price update from PRICE_UPDATE_SCREEN
        // Payload: product_id, new_price
        const productId = data.product_id;
        const newPriceStr = data.new_price;

        const newPrice = parseFloat(newPriceStr) || 0;

        this.logger.debug(
          `Updating product ${productId} - new price: ${newPrice}`,
        );

        try {
          // First fetch product to get documentId and old price
          const productDetails = await this.fetchProductDetails(
            productId,
            dsConfig,
          );
          const documentId = productDetails.documentId || productId;
          const oldPrice = productDetails.price || 0;
          const fetchedProductName = productDetails.name || 'Ürün';

          await this.updateProductPrice(documentId, newPrice, dsConfig);
          this.logger.log(
            `Price updated successfully for product ${documentId}`,
          );

          // Save data to context if available
          if (contextId) {
            try {
              await this.saveFlowDataToContext(contextId, {
                product_name: fetchedProductName,
                new_price: `${this.formatPrice(newPrice)} TL`,
                old_price: `${this.formatPrice(oldPrice)} TL`,
              });
            } catch (error) {
              this.logger.error('Failed to save flow data:', error.message);
            }
          }

          // Complete the flow with success screen
          // Flow JSON expects: new_price, old_price, product_name
          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              product_name: fetchedProductName,
              new_price: `${this.formatPrice(newPrice)} TL`,
              old_price: `${this.formatPrice(oldPrice)} TL`,
            },
          };
        } catch (error) {
          this.logger.error(`Failed to update price: ${error.message}`);
          return {
            screen: 'ERROR_SCREEN',
            data: {
              error_message: 'Fiyat güncellenirken hata oluştu',
              error_details: error.message,
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

  /**
   * Get data source configuration from dataSourceId or fallback to ConfigService
   * @param dataSourceId Optional data source ID to load
   * @returns Configuration with baseUrl and token, or null if not available
   */
  private async getDataSourceConfig(
    dataSourceId?: string | null,
  ): Promise<{ baseUrl: string; token: string } | null> {
    // Try to load from data source first
    if (dataSourceId) {
      try {
        const dataSource = await this.dataSourcesService.findOne(dataSourceId);
        if (dataSource && dataSource.isActive) {
          this.logger.debug(
            `Using data source: ${dataSource.name} (${dataSource.baseUrl})`,
          );
          return {
            baseUrl: dataSource.baseUrl,
            token: dataSource.authToken || '',
          };
        }
      } catch (error) {
        this.logger.warn(
          `Failed to load data source ${dataSourceId}: ${error.message}`,
        );
      }
    }

    // Fallback to ConfigService for backward compatibility
    const baseUrl = this.configService.get<string>('STRAPI_BASE_URL');
    const token = this.configService.get<string>('STRAPI_TOKEN');

    if (baseUrl && token) {
      this.logger.debug('Using fallback Strapi configuration from ConfigService');
      return { baseUrl, token };
    }

    this.logger.warn('No data source configuration available');
    return null;
  }
}
