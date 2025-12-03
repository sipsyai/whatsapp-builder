import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { WhatsAppFlow } from '../../../entities/whatsapp-flow.entity';
import { ConfigService } from '@nestjs/config';
import { DataSourcesService } from '../../data-sources/data-sources.service';
import { ComponentDataSourceConfigDto } from '../../flows/dto/component-data-source-config.dto';
import { IntegrationHandlerRegistry } from './integration-handlers/integration-handler.registry';
import { IntegrationConfigDto, FlowExecutionContextDto } from '../../flows/dto/integration-config.dto';

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
    private readonly integrationRegistry: IntegrationHandlerRegistry,
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
    let whatsappFlowId: string | null = null;
    let flowRecord: WhatsAppFlow | null = null;
    let chatbotUserId: string | undefined; // N+1 optimizasyonu icin

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      // UUID format: 8-4-4-4-12 = 5 parts when split by '-'
      // flow_token format: {contextId}-{nodeId}
      if (parts.length >= 6) {
        contextId = parts.slice(0, 5).join('-');
        nodeId = parts.slice(5).join('-');
      }

      // Load context to get variables and flow configuration
      // Context'i chatbot ile birlikte yükle (N+1 optimizasyonu)
      if (contextId) {
        try {
          const context = await this.contextRepo.findOne({
            where: { id: contextId },
            relations: ['chatbot'],
          });

          if (context) {
            initialData = context.variables || {};
            chatbotUserId = context.chatbot?.userId || undefined;

            // Find the WhatsApp Flow node to get the flow ID
            if (nodeId && context.chatbot) {
              const flowNode = context.chatbot.nodes?.find(
                (n: any) => n.id === nodeId,
              );
              if (flowNode?.data?.whatsappFlowId) {
                whatsappFlowId = flowNode.data.whatsappFlowId;
                // Load the flow to get dataSourceId and dataSourceConfig
                const flow = await this.flowRepo.findOne({
                  where: { whatsappFlowId: flowNode.data.whatsappFlowId },
                  relations: ['dataSource'],
                });
                if (flow) {
                  flowRecord = flow;
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

    // ============================================================================
    // Integration Handler-Based Data Fetching (Newest Approach)
    // ============================================================================
    const integrationConfigs = (flowRecord?.metadata?.integrationConfigs as IntegrationConfigDto[]) || [];

    if (integrationConfigs.length > 0) {
      this.logger.debug(`Found ${integrationConfigs.length} integration configs for flow`);

      // Initial configs (dependsOn olmayan) için data fetch et
      const initialConfigs = integrationConfigs.filter(c => !c.dependsOn);
      const screenData: Record<string, any> = {};

      for (const config of initialConfigs) {
        const flowContext: FlowExecutionContextDto = {
          flowToken: request.flow_token,
          contextId: contextId || undefined,
          nodeId: nodeId || undefined,
          chatbotUserId: chatbotUserId, // N+1 optimizasyonu: onceden yuklenmis deger
        };

        try {
          const componentData = await this.integrationRegistry.fetchComponentData(
            config,
            {},
            flowContext
          );
          screenData[config.componentName] = componentData;
          this.logger.debug(`Fetched ${componentData.length} items for ${config.componentName}`);
        } catch (error) {
          this.logger.error(`Integration fetch failed for ${config.componentName}: ${error.message}`);
          screenData[config.componentName] = [];
        }
      }

      // İlk screen'i bul ve data ile döndür
      const initialScreen = flowRecord ? this.getInitialScreen(flowRecord) : 'INIT';
      return {
        screen: initialScreen,
        data: screenData,
      };
    }

    // ============================================================================
    // Config-Driven Data Fetching (New Generic Approach)
    // ============================================================================
    const dataSourceConfigs = (flowRecord?.metadata?.dataSourceConfig as ComponentDataSourceConfigDto[]) || [];

    if (dataSourceConfigs.length > 0) {
      this.logger.debug(`Found ${dataSourceConfigs.length} data source configs, using config-driven approach`);

      try {
        // Find configs for initial screen (no dependencies)
        const initialConfigs = dataSourceConfigs.filter((c) => !c.dependsOn);

        if (initialConfigs.length > 0) {
          // Fetch data for each initial component config
          const screenData: Record<string, any> = { ...initialData };

          for (const config of initialConfigs) {
            const componentData = await this.fetchComponentData(config, {});
            screenData[config.componentName] = componentData;
            this.logger.debug(
              `Fetched ${componentData.length} items for component: ${config.componentName}`,
            );
          }

          // Determine initial screen from flowJson or use first screen
          let initialScreen = 'INIT_SCREEN';
          if (flowRecord && flowRecord.flowJson?.screens?.length > 0) {
            initialScreen = flowRecord.flowJson.screens[0].id;
          }

          return {
            screen: initialScreen,
            data: screenData,
          };
        }
      } catch (error) {
        this.logger.error(`Config-driven init failed: ${error.message}, falling back to legacy`);
        // Fall through to legacy handler
      }
    }

    // ============================================================================
    // Legacy Hardcoded Handler (Fallback for backward compatibility)
    // ============================================================================
    this.logger.debug('Using legacy hardcoded handler');

    // Get data source configuration
    const dsConfig = await this.getDataSourceConfig(dataSourceId);

    if (!dsConfig) {
      this.logger.error('No data source configuration available');
      return {
        screen: 'ERROR_SCREEN',
        data: {
          error_message: 'Data source configuration not found',
          error_details: 'Unable to initialize flow without data source',
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
  async handleDataExchange(request: any, flowRecord: WhatsAppFlow | null): Promise<any> {
    this.logger.log('Processing data_exchange action');

    const { screen, data, flow_token } = request;

    // Handle error notifications from WhatsApp
    if (data?.error) {
      this.logger.warn(`Received error notification from WhatsApp: ${data.error} - ${data.error_message}`);
      return {
        data: {
          acknowledged: true,
        },
      };
    }

    this.logger.log(`Screen: ${screen}, Data: ${JSON.stringify(data)}`);

    // Extract context info from flow_token
    // flow_token format: {contextId}-{nodeId} where contextId is UUID (5 parts)
    let contextId: string | null = null;
    let nodeId: string | null = null;
    let dataSourceId: string | null = null;
    let loadedFlowRecord = flowRecord;

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      if (parts.length >= 6) {
        contextId = parts.slice(0, 5).join('-');
        nodeId = parts.slice(5).join('-');
      }
    }

    // Load context to get flow configuration if flowRecord not provided
    // Context'i chatbot ile birlikte yükle (N+1 optimizasyonu)
    let chatbotUserId: string | undefined;
    if (contextId) {
      try {
        const context = await this.contextRepo.findOne({
          where: { id: contextId },
          relations: ['chatbot'],
        });

        if (context && nodeId && context.chatbot) {
          chatbotUserId = context.chatbot.userId || undefined;
          // Find the WhatsApp Flow node to get the flow ID if not already loaded
          if (!loadedFlowRecord) {
            const flowNode = context.chatbot.nodes?.find((n: any) => n.id === nodeId);
            if (flowNode?.data?.whatsappFlowId) {
              // Load the flow to get dataSourceId and dataSourceConfig
              const flow = await this.flowRepo.findOne({
                where: { whatsappFlowId: flowNode.data.whatsappFlowId },
                relations: ['dataSource'],
              });
              if (flow) {
                loadedFlowRecord = flow;
                this.logger.debug(
                  `Flow loaded: ${flow.name}, dataSourceId: ${flow.dataSourceId}`,
                );
              }
            }
          }
          dataSourceId = loadedFlowRecord?.dataSourceId || null;
        }
      } catch (error) {
        this.logger.warn(
          `Could not load context ${contextId}:`,
          error.message,
        );
      }
    }

    // ============================================================================
    // Integration Handler-Based Data Exchange (Newest Approach)
    // ============================================================================
    const integrationConfigs = (loadedFlowRecord?.metadata?.integrationConfigs as IntegrationConfigDto[]) || [];

    if (integrationConfigs.length > 0) {
      const submittedFields = Object.keys(data || {});
      const screenData: Record<string, any> = { ...data };
      let hasIntegrationMatch = false;

      for (const fieldName of submittedFields) {
        // Bu field'a bağlı config'leri bul
        const dependentConfigs = integrationConfigs.filter(c => c.dependsOn === fieldName);

        if (dependentConfigs.length > 0) {
          hasIntegrationMatch = true;

          for (const config of dependentConfigs) {
            const flowContext: FlowExecutionContextDto = {
              flowToken: flow_token,
              contextId: contextId || undefined,
              nodeId: nodeId || undefined,
              chatbotUserId: chatbotUserId, // N+1 optimizasyonu: onceden yuklenmis deger
            };

            try {
              const componentData = await this.integrationRegistry.fetchComponentData(
                config,
                data,
                flowContext
              );
              screenData[config.componentName] = componentData;
              this.logger.debug(`Fetched ${componentData.length} items for ${config.componentName} (depends on ${fieldName})`);
            } catch (error) {
              this.logger.error(`Integration fetch failed for ${config.componentName}: ${error.message}`);
              screenData[config.componentName] = [];
              screenData.error_message = 'Veri yüklenemedi. Lütfen tekrar deneyin.';
            }
          }
        }
      }

      if (hasIntegrationMatch) {
        // Sonraki screen'i bul
        const nextScreen = this.findNextScreen(loadedFlowRecord, screen);
        return {
          screen: nextScreen || screen,
          data: screenData,
        };
      }
    }

    // ============================================================================
    // Config-Driven Data Exchange (New Generic Approach)
    // ============================================================================
    const dataSourceConfigs = (loadedFlowRecord?.metadata?.dataSourceConfig as ComponentDataSourceConfigDto[]) || [];

    if (dataSourceConfigs.length > 0) {
      this.logger.debug(`Found ${dataSourceConfigs.length} data source configs, using config-driven approach`);

      try {
        // Check if any config depends on the submitted data
        const submittedFieldsForDS = Object.keys(data || {});
        const screenDataDS: Record<string, any> = { ...data };
        let hasConfigMatch = false;

        for (const fieldName of submittedFieldsForDS) {
          // Find configs that depend on this submitted field
          const dependentConfigs = this.findDependentConfigs(dataSourceConfigs, fieldName);

          if (dependentConfigs.length > 0) {
            hasConfigMatch = true;
            this.logger.debug(
              `Found ${dependentConfigs.length} configs dependent on field: ${fieldName}`,
            );

            // Fetch data for each dependent config
            for (const config of dependentConfigs) {
              const componentData = await this.fetchComponentData(config, data);
              screenDataDS[config.componentName] = componentData;
              this.logger.debug(
                `Fetched ${componentData.length} items for component: ${config.componentName}`,
              );
            }
          }
        }

        // If we processed any config-driven data, determine next screen and return
        if (hasConfigMatch) {
          // Determine next screen from flowJson
          let nextScreenDS = this.findNextScreen(loadedFlowRecord, screen);

          // If no next screen found, check if we should complete the flow
          if (!nextScreenDS) {
            // Save data to context if available
            if (contextId && data) {
              try {
                await this.saveFlowDataToContext(contextId, data);
              } catch (error) {
                this.logger.error('Failed to save flow data:', error.message);
              }
            }

            // Return success with extension_message_response
            return {
              screen: 'SUCCESS',
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

          return {
            screen: nextScreenDS,
            data: screenDataDS,
          };
        }

        // No matching configs - check if this is a terminal screen (form submission without cascading)
        // Save to context and complete flow
        if (contextId && data) {
          try {
            await this.saveFlowDataToContext(contextId, data);
          } catch (error) {
            this.logger.error('Failed to save flow data:', error.message);
          }
        }

        // Check if current screen is the last screen in flowJson
        const isLastScreen = this.isLastScreen(loadedFlowRecord, screen);
        if (isLastScreen) {
          return {
            screen: 'SUCCESS',
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

        // Continue to next screen without additional data
        const nextScreenContinue = this.findNextScreen(loadedFlowRecord, screen);
        if (nextScreenContinue) {
          return {
            screen: nextScreenContinue,
            data: screenDataDS,
          };
        }

        // Fall through to legacy handler if no config match and no clear next screen
        this.logger.debug('No config match found, falling back to legacy handler');
      } catch (error) {
        this.logger.error(`Config-driven data exchange failed: ${error.message}, falling back to legacy`);
        // Fall through to legacy handler
      }
    }

    // ============================================================================
    // Legacy Hardcoded Handler (Fallback for backward compatibility)
    // ============================================================================
    this.logger.debug('Using legacy hardcoded handler');

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

    // Process based on current screen - Fiyat Guncelleme Flow (Legacy)
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
   * Handle BACK action - user pressed back button
   * If the previous screen has refresh_on_back: true, we need to refresh its data
   */
  async handleBack(request: any, flowRecord: WhatsAppFlow | null): Promise<any> {
    const { screen, data, flow_token } = request;

    this.logger.debug(`Handling BACK action from screen: ${screen}`);

    if (!flowRecord?.flowJson) {
      return {
        screen: screen,
        data: {},
      };
    }

    const flowJson = flowRecord.flowJson as any;
    const screens = flowJson.screens || [];

    // Find current screen index
    const currentIndex = screens.findIndex((s: any) => s.id === screen);
    if (currentIndex <= 0) {
      // Already at first screen or not found
      return {
        screen: screen,
        data: data || {},
      };
    }

    // Get previous screen
    const previousScreen = screens[currentIndex - 1];
    const previousScreenId = previousScreen?.id;

    // Check if previous screen has refresh_on_back
    if (previousScreen?.refresh_on_back === true) {
      this.logger.debug(`Previous screen ${previousScreenId} has refresh_on_back, fetching fresh data`);

      // Re-fetch data for previous screen using integration handlers
      const integrationConfigs = (flowRecord?.metadata?.integrationConfigs as IntegrationConfigDto[]) || [];

      if (integrationConfigs.length > 0) {
        const screenData: Record<string, any> = { ...data };

        // Extract context info from flow_token
        let contextId: string | undefined;
        let nodeId: string | undefined;
        let chatbotUserId: string | undefined;

        if (flow_token && flow_token.includes('-')) {
          const parts = flow_token.split('-');
          if (parts.length >= 6) {
            contextId = parts.slice(0, 5).join('-');
            nodeId = parts.slice(5).join('-');
          }
        }

        // Get chatbot user ID if context exists
        if (contextId) {
          const context = await this.contextRepo.findOne({
            where: { id: contextId },
            relations: ['chatbot'],
          });
          chatbotUserId = context?.chatbot?.userId || undefined;
        }

        // Find configs for the previous screen (configs without dependsOn are initial data)
        const initialConfigs = integrationConfigs.filter(c => !c.dependsOn);

        // Fetch fresh data for each initial config
        for (const config of initialConfigs) {
          const flowContext: FlowExecutionContextDto = {
            flowToken: flow_token,
            contextId,
            nodeId,
            chatbotUserId,
          };

          try {
            const componentData = await this.integrationRegistry.fetchComponentData(
              config,
              data || {},
              flowContext,
            );
            screenData[config.componentName] = componentData;
            this.logger.debug(`Refreshed ${componentData.length} items for ${config.componentName} on BACK`);
          } catch (error) {
            this.logger.error(`Failed to refresh data for ${config.componentName} on BACK: ${error.message}`);
            // Keep existing data on error
          }
        }

        return {
          screen: previousScreenId,
          data: screenData,
        };
      }
    }

    return {
      screen: previousScreenId || screen,
      data: data || {},
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

  // ============================================================================
  // Generic Config-Driven Data Exchange Methods
  // ============================================================================

  /**
   * Load dataSourceConfig from Flow metadata
   * @param flowId Internal flow ID (UUID)
   * @returns Array of component data source configurations
   */
  private async getFlowDataSourceConfig(
    flowId: string,
  ): Promise<ComponentDataSourceConfigDto[]> {
    try {
      const flow = await this.flowRepo.findOne({
        where: { id: flowId },
        relations: ['dataSource'],
      });
      return (flow?.metadata?.dataSourceConfig as ComponentDataSourceConfigDto[]) || [];
    } catch (error) {
      this.logger.warn(`Failed to load flow data source config: ${error.message}`);
      return [];
    }
  }

  /**
   * Load dataSourceConfig from Flow by whatsappFlowId
   * @param whatsappFlowId WhatsApp Flow ID (from WhatsApp API)
   * @returns Array of component data source configurations and the flow
   */
  private async getFlowDataSourceConfigByWhatsAppId(
    whatsappFlowId: string,
  ): Promise<{ configs: ComponentDataSourceConfigDto[]; flow: WhatsAppFlow | null }> {
    try {
      const flow = await this.flowRepo.findOne({
        where: { whatsappFlowId },
        relations: ['dataSource'],
      });
      const configs = (flow?.metadata?.dataSourceConfig as ComponentDataSourceConfigDto[]) || [];
      return { configs, flow };
    } catch (error) {
      this.logger.warn(`Failed to load flow data source config by whatsappFlowId: ${error.message}`);
      return { configs: [], flow: null };
    }
  }

  /**
   * Fetch data from data source and transform to dropdown format
   * @param config Component data source configuration
   * @param formData Form data for cascading filters
   * @returns Transformed data array for dropdown component
   */
  private async fetchComponentData(
    config: ComponentDataSourceConfigDto,
    formData: Record<string, any> = {},
  ): Promise<{ id: string; title: string; description?: string }[]> {
    try {
      // 1. Load DataSource
      const dataSource = await this.dataSourcesService.findOne(config.dataSourceId);
      if (!dataSource || !dataSource.isActive) {
        this.logger.warn(`Data source ${config.dataSourceId} not found or inactive`);
        return [];
      }

      // 2. Build filter parameters for cascading
      const params: Record<string, any> = {};
      if (config.dependsOn && config.filterParam && formData[config.dependsOn]) {
        params[config.filterParam] = formData[config.dependsOn];
        this.logger.debug(
          `Cascading filter: ${config.filterParam}=${formData[config.dependsOn]}`,
        );
      }

      // 3. Fetch data from data source
      this.logger.debug(
        `Fetching data for component ${config.componentName} from ${config.endpoint}`,
      );
      const response = await this.dataSourcesService.fetchData(
        config.dataSourceId,
        config.endpoint,
        { params },
      );

      // 4. Extract array from response using dataKey
      const dataArray = this.extractDataArray(response, config.dataKey);
      this.logger.debug(
        `Extracted ${dataArray.length} items from response using key: ${config.dataKey}`,
      );

      // 5. Transform to dropdown format
      return dataArray.map((item: any) => {
        const result: { id: string; title: string; description?: string } = {
          id: String(item[config.transformTo.idField] || item.id || ''),
          title: String(
            item[config.transformTo.titleField] || item.name || item.title || '',
          ),
        };

        if (config.transformTo.descriptionField && item[config.transformTo.descriptionField]) {
          result.description = String(item[config.transformTo.descriptionField]);
        }

        return result;
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch component data for ${config.componentName}: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Extract data array from response using nested key
   * @param response API response object
   * @param dataKey Dot-notation key (e.g., "data" or "data.items")
   * @returns Extracted array or empty array
   */
  private extractDataArray(response: any, dataKey: string): any[] {
    if (!response || !dataKey) {
      return [];
    }

    const keys = dataKey.split('.');
    let result = response;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return [];
      }
      result = result[key];
    }

    return Array.isArray(result) ? result : [];
  }

  /**
   * Find component configs for a specific screen
   * @param configs All component configs
   * @param screenName Target screen name (optional, for filtering)
   * @param formData Current form data to check dependencies
   * @returns Filtered configs that apply to the current context
   */
  private findApplicableConfigs(
    configs: ComponentDataSourceConfigDto[],
    formData: Record<string, any> = {},
  ): ComponentDataSourceConfigDto[] {
    return configs.filter((config) => {
      // If config has dependsOn, check if the dependency value exists in formData
      if (config.dependsOn) {
        return formData[config.dependsOn] !== undefined;
      }
      // If no dependency, it's applicable for initial screen
      return true;
    });
  }

  /**
   * Find configs that need data based on newly submitted form field
   * @param configs All component configs
   * @param submittedFieldName The field name that was just submitted
   * @returns Configs that depend on the submitted field
   */
  private findDependentConfigs(
    configs: ComponentDataSourceConfigDto[],
    submittedFieldName: string,
  ): ComponentDataSourceConfigDto[] {
    return configs.filter((config) => config.dependsOn === submittedFieldName);
  }

  /**
   * Find next screen using routing_model if available, otherwise fallback to sequential
   */
  private findNextScreen(flow: WhatsAppFlow | null, currentScreen: string): string | null {
    if (!flow?.flowJson) return null;

    const flowJson = flow.flowJson as any;

    // First, try to use routing_model
    if (flowJson.routing_model && flowJson.routing_model[currentScreen]) {
      const validNextScreens = flowJson.routing_model[currentScreen];
      if (Array.isArray(validNextScreens) && validNextScreens.length > 0) {
        // Return first valid next screen
        return validNextScreens[0];
      }
      // Empty array means terminal screen
      if (Array.isArray(validNextScreens) && validNextScreens.length === 0) {
        return null;
      }
    }

    // Fallback: Sequential screen navigation
    const screens = flowJson.screens;
    if (!screens || !Array.isArray(screens)) return null;

    const currentIndex = screens.findIndex((s: any) => s.id === currentScreen);
    if (currentIndex === -1 || currentIndex >= screens.length - 1) {
      return null;
    }

    return screens[currentIndex + 1]?.id || null;
  }

  /**
   * Validate if screen transition is allowed by routing_model
   */
  private isValidScreenTransition(flow: WhatsAppFlow | null, fromScreen: string, toScreen: string): boolean {
    if (!flow?.flowJson) return true; // No flow, allow all

    const flowJson = flow.flowJson as any;

    // If no routing_model, allow all transitions
    if (!flowJson.routing_model) return true;

    const allowedScreens = flowJson.routing_model[fromScreen];
    if (!allowedScreens) return true; // Screen not in routing_model, allow

    return Array.isArray(allowedScreens) && allowedScreens.includes(toScreen);
  }

  /**
   * Check if current screen is the last screen in the flow
   * @param flow WhatsApp Flow record
   * @param currentScreen Current screen ID
   * @returns True if this is the last screen
   */
  private isLastScreen(flow: WhatsAppFlow | null, currentScreen: string): boolean {
    if (!flow?.flowJson?.screens) {
      return true;
    }

    const screens = flow.flowJson.screens;
    const currentIndex = screens.findIndex((s: any) => s.id === currentScreen);

    // Check if current screen has terminal action (complete or data_exchange with complete)
    if (currentIndex !== -1) {
      const currentScreenData = screens[currentIndex];
      if (currentScreenData?.layout?.children) {
        const footer = this.findComponentByType(currentScreenData.layout.children, 'Footer');
        if (footer?.['on-click-action']?.name === 'complete') {
          return true;
        }
      }
    }

    return currentIndex === screens.length - 1;
  }

  /**
   * Find a component by type in the layout tree (recursive)
   * @param children Layout children array
   * @param componentType Type of component to find
   * @returns Found component or null
   */
  private findComponentByType(children: any[], componentType: string): any | null {
    for (const child of children) {
      if (child.type === componentType) {
        return child;
      }
      if (child.children) {
        const found = this.findComponentByType(child.children, componentType);
        if (found) {
          return found;
        }
      }
    }
    return null;
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

  /**
   * Get chatbot owner's user ID from context
   * @param contextId Conversation context ID
   * @returns User ID of the chatbot owner, or null if not found
   */
  private async getChatbotOwnerUserId(contextId: string): Promise<string | null> {
    if (!contextId) return null;

    try {
      const context = await this.contextRepo.findOne({
        where: { id: contextId },
        relations: ['chatbot'],
      });
      return context?.chatbot?.userId || null;
    } catch (error) {
      this.logger.warn(`Could not get chatbot owner for context ${contextId}`);
      return null;
    }
  }

  /**
   * Get the initial screen from Flow JSON
   * @param flowRecord WhatsApp Flow record
   * @returns Initial screen ID, defaults to 'INIT' if not found
   */
  private getInitialScreen(flowRecord: WhatsAppFlow): string {
    // Flow JSON'dan ilk screen'i bul
    const flowJson = flowRecord.flowJson as any;
    if (flowJson?.screens?.length > 0) {
      return flowJson.screens[0].id;
    }
    // Fallback
    return 'INIT';
  }
}
