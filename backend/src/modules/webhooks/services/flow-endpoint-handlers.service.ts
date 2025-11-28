import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationContext } from '../../../entities/conversation-context.entity';
import { ConfigService } from '@nestjs/config';

/**
 * Flow Endpoint Handlers Service
 * Handles business logic for ALL Flow data exchange requests
 * Supports: Stock Management, Price Update, Low Stock Report flows
 */
@Injectable()
export class FlowEndpointHandlersService {
  private readonly logger = new Logger(FlowEndpointHandlersService.name);

  // Strapi API configuration
  private readonly strapiBaseUrl: string;
  private readonly strapiToken: string;

  constructor(
    @InjectRepository(ConversationContext)
    private readonly contextRepo: Repository<ConversationContext>,
    private readonly configService: ConfigService,
  ) {
    // Load from environment or use defaults
    this.strapiBaseUrl =
      this.configService.get<string>('STRAPI_BASE_URL') ||
      'https://gardenhausapi.sipsy.ai/api';
    this.strapiToken =
      this.configService.get<string>('STRAPI_TOKEN') ||
      'b1653f8a6740702305117a40d274b208ad2549f123f5ad712e5d9d1314379ebda123c95031d88645ca1225823ba62c6ad10371c8ce15ac605ee6ab17435f82f22f60e7164d4bbf11e018b3353dd239153d98a86008fca0ce74c3766eba0e0af3e17acc7fa4469e939b384146ec1bf0efca1f5f45cf07203be5b5f3f9703a67dd';
  }

  // =====================================================
  // STRAPI API HELPER METHODS
  // =====================================================

  /**
   * Fetch categories from Strapi API
   */
  private async fetchCategoriesFromStrapi(): Promise<
    { id: string; title: string; enabled: boolean }[]
  > {
    try {
      const response = await fetch(`${this.strapiBaseUrl}/categories`, {
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform Strapi response to Flow dropdown format
      return (data.data || []).map((category: any) => ({
        id: category.slug || category.id?.toString(),
        title: category.name,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch brands from Strapi API
   */
  private async fetchBrandsFromStrapi(): Promise<
    { id: string; title: string; enabled: boolean }[]
  > {
    try {
      const response = await fetch(`${this.strapiBaseUrl}/brands`, {
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.data || []).map((brand: any) => ({
        id: brand.slug || brand.name,
        title: brand.name,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch brands: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch products by category from Strapi API
   */
  private async fetchProductsByCategory(
    categorySlug: string,
  ): Promise<{ id: string; title: string; enabled: boolean }[]> {
    try {
      const url = `${this.strapiBaseUrl}/products?filters[category][slug][$eq]=${encodeURIComponent(categorySlug)}&pagination[pageSize]=100&populate=*`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.data || []).map((product: any) => ({
        id: product.documentId || product.id?.toString(),
        title: `${product.name} - Stok: ${product.stock || 0}`,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch products by category: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch products by brand from Strapi API
   */
  private async fetchProductsByBrand(
    brandName: string,
  ): Promise<{ id: string; title: string; enabled: boolean }[]> {
    try {
      const url = `${this.strapiBaseUrl}/products?filters[brand][name][$eq]=${encodeURIComponent(brandName)}&pagination[pageSize]=100&populate=*`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.data || []).map((product: any) => ({
        id: product.documentId || product.id?.toString(),
        title: `${product.name} - ${this.formatPrice(product.price)} TL`,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch products by brand: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch low stock products from Strapi
   */
  private async fetchLowStockProducts(
    threshold: number,
    sortBy: string,
  ): Promise<{ id: string; title: string; enabled: boolean }[]> {
    try {
      // Build sort parameter
      let sortParam = 'stock:asc'; // default
      if (sortBy === 'stock_desc') sortParam = 'stock:desc';
      if (sortBy === 'name_asc') sortParam = 'name:asc';

      const url = `${this.strapiBaseUrl}/products?filters[stock][$lte]=${threshold}&sort=${sortParam}&pagination[pageSize]=100&populate=*`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.strapiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();

      return (data.data || []).map((product: any) => ({
        id: product.documentId || product.id?.toString(),
        title: `${product.name} - Stok: ${product.stock || 0}`,
        enabled: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch low stock products: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch single product details from Strapi
   */
  private async fetchProductDetails(productId: string): Promise<any> {
    try {
      const url = `${this.strapiBaseUrl}/products/${productId}?populate=*`;

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
    } catch (error) {
      this.logger.error(`Failed to fetch product details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product stock in Strapi
   */
  private async updateProductStock(
    productId: string,
    newStock: number,
  ): Promise<any> {
    try {
      const url = `${this.strapiBaseUrl}/products/${productId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.strapiToken}`,
        },
        body: JSON.stringify({
          data: {
            stock: newStock,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Failed to update stock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product price in Strapi
   */
  private async updateProductPrice(
    productId: string,
    newPrice: number,
    originalPrice?: number,
    discountPercent?: number,
  ): Promise<any> {
    try {
      const url = `${this.strapiBaseUrl}/products/${productId}`;

      const updateData: any = {
        price: newPrice,
      };

      if (originalPrice !== undefined) {
        updateData.originalPrice = originalPrice;
      }

      if (discountPercent !== undefined) {
        updateData.discountPercent = discountPercent;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.strapiToken}`,
        },
        body: JSON.stringify({
          data: updateData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Strapi API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Failed to update price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format price with thousands separator
   */
  private formatPrice(price: number): string {
    return price?.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || '0.00';
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscountPercent(
    originalPrice: number,
    salePrice: number,
  ): number {
    if (!originalPrice || originalPrice === 0) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  }

  // =====================================================
  // INIT HANDLER - Route to appropriate flow
  // =====================================================

  /**
   * Handle INIT action - Return first screen data
   * Routes based on flow_token or context
   */
  async handleInit(request: any): Promise<any> {
    this.logger.debug('Processing INIT action');

    const { flow_token } = request;

    // Extract context ID from flow_token
    let contextId: string | null = null;
    let flowType = 'price_update'; // default

    if (flow_token && flow_token.includes('-')) {
      const parts = flow_token.split('-');
      contextId = parts[0];
      // You can store flow type in context variables
    }

    // Load context to determine flow type
    if (contextId) {
      try {
        const context = await this.contextRepo.findOne({
          where: { id: contextId },
        });

        if (context?.variables?.flow_type) {
          flowType = context.variables.flow_type;
        }
      } catch (error) {
        this.logger.warn(`Could not load context ${contextId}: ${error.message}`);
      }
    }

    // Route to appropriate flow initialization
    switch (flowType) {
      case 'stock_management':
        return this.handleInitStockManagement();

      case 'price_update':
        return this.handleInitPriceUpdate();

      case 'low_stock_report':
        return this.handleInitLowStockReport();

      default:
        // Default to price update
        return this.handleInitPriceUpdate();
    }
  }

  // =====================================================
  // STOCK MANAGEMENT FLOW HANDLERS
  // =====================================================

  private async handleInitStockManagement(): Promise<any> {
    const categories = await this.fetchCategoriesFromStrapi();

    return {
      screen: 'CATEGORY_SCREEN',
      data: {
        categories: categories,
      },
    };
  }

  private async handleStockManagementDataExchange(request: any): Promise<any> {
    const { screen, data } = request;

    switch (screen) {
      case 'CATEGORY_SCREEN': {
        const products = await this.fetchProductsByCategory(
          data.selected_category,
        );

        return {
          screen: 'PRODUCT_SCREEN',
          data: {
            products: products,
          },
        };
      }

      case 'PRODUCT_SCREEN': {
        const product = await this.fetchProductDetails(data.selected_product);

        return {
          screen: 'STOCK_INFO_SCREEN',
          data: {
            product_name: product.name,
            product_sku: product.sku || 'N/A',
            current_stock: product.stock?.toString() || '0',
          },
        };
      }

      case 'CONFIRM_SCREEN': {
        try {
          const productId = data.product_id;
          const newStock = parseInt(data.new_stock, 10);

          const oldProduct = await this.fetchProductDetails(productId);
          const oldStock = oldProduct.stock;

          await this.updateProductStock(productId, newStock);

          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              success_message: 'Stok başarıyla güncellendi!',
              product_name: oldProduct.name,
              old_stock: oldStock?.toString() || '0',
              new_stock: newStock.toString(),
            },
          };
        } catch (error) {
          this.logger.error(`Stock update failed: ${error.message}`);
          return {
            screen: 'ERROR_SCREEN',
            data: {
              error_message: `Stok güncellenirken hata oluştu: ${error.message}`,
            },
          };
        }
      }

      default:
        return {
          screen: 'ERROR_SCREEN',
          data: {
            error_message: 'Bilinmeyen ekran',
          },
        };
    }
  }

  // =====================================================
  // PRICE UPDATE FLOW HANDLERS
  // =====================================================

  private async handleInitPriceUpdate(): Promise<any> {
    const brands = await this.fetchBrandsFromStrapi();

    return {
      screen: 'BRAND_SCREEN',
      data: {
        brands: brands,
      },
    };
  }

  private async handlePriceUpdateDataExchange(request: any): Promise<any> {
    const { screen, data } = request;

    switch (screen) {
      case 'BRAND_SCREEN': {
        const products = await this.fetchProductsByBrand(data.selected_brand);

        return {
          screen: 'PRODUCT_SCREEN',
          data: {
            brand_name: data.selected_brand,
            products: products,
          },
        };
      }

      case 'PRODUCT_SCREEN': {
        const product = await this.fetchProductDetails(data.selected_product);

        return {
          screen: 'PRICE_INFO_SCREEN',
          data: {
            product_name: product.name,
            product_sku: product.sku || 'N/A',
            current_price: this.formatPrice(product.price) + ' TL',
            original_price: product.originalPrice
              ? this.formatPrice(product.originalPrice) + ' TL'
              : this.formatPrice(product.price) + ' TL',
            current_discount: product.discountPercent
              ? product.discountPercent + '%'
              : '0%',
          },
        };
      }

      case 'PRICE_INFO_SCREEN': {
        const newPrice = parseFloat(data.new_price);
        const newOriginalPrice = data.new_original_price
          ? parseFloat(data.new_original_price)
          : newPrice;

        const discountPercent = this.calculateDiscountPercent(
          newOriginalPrice,
          newPrice,
        );
        const priceDifference = newOriginalPrice - newPrice;

        return {
          screen: 'DISCOUNT_SCREEN',
          data: {
            calculated_discount: discountPercent + '%',
            price_difference: this.formatPrice(priceDifference) + ' TL',
          },
        };
      }

      case 'CONFIRM_SCREEN': {
        try {
          const productId = data.product_id;
          const newPrice = parseFloat(data.new_price);
          const newOriginalPrice = data.new_original_price
            ? parseFloat(data.new_original_price)
            : undefined;
          const discountPercent = data.discount_percent
            ? parseInt(data.discount_percent.replace('%', ''), 10)
            : undefined;

          const oldProduct = await this.fetchProductDetails(productId);
          const oldPrice = oldProduct.price;

          await this.updateProductPrice(
            productId,
            newPrice,
            newOriginalPrice,
            discountPercent,
          );

          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              success_message: 'Fiyat başarıyla güncellendi!',
              product_name: oldProduct.name,
              old_price: this.formatPrice(oldPrice) + ' TL',
              new_price: this.formatPrice(newPrice) + ' TL',
              discount_percent: discountPercent ? discountPercent + '%' : '0%',
            },
          };
        } catch (error) {
          this.logger.error(`Price update failed: ${error.message}`);
          return {
            screen: 'ERROR_SCREEN',
            data: {
              error_message: `Fiyat güncellenirken hata oluştu: ${error.message}`,
            },
          };
        }
      }

      default:
        return {
          screen: 'ERROR_SCREEN',
          data: {
            error_message: 'Bilinmeyen ekran',
          },
        };
    }
  }

  // =====================================================
  // LOW STOCK REPORT FLOW HANDLERS
  // =====================================================

  private async handleInitLowStockReport(): Promise<any> {
    return {
      screen: 'FILTER_SCREEN',
      data: {},
    };
  }

  private async handleLowStockReportDataExchange(request: any): Promise<any> {
    const { screen, data } = request;

    switch (screen) {
      case 'FILTER_SCREEN': {
        const threshold = parseInt(data.stock_threshold || '10', 10);
        const sortBy = data.sort_by || 'stock_asc';

        const products = await this.fetchLowStockProducts(threshold, sortBy);

        return {
          screen: 'REPORT_SCREEN',
          data: {
            total_products: products.length.toString(),
            low_stock_products: products,
          },
        };
      }

      case 'REPORT_SCREEN': {
        const product = await this.fetchProductDetails(data.selected_product);

        return {
          screen: 'ACTION_SCREEN',
          data: {
            product_name: product.name,
            product_sku: product.sku || 'N/A',
            current_stock: product.stock?.toString() || '0',
            product_price: this.formatPrice(product.price) + ' TL',
          },
        };
      }

      case 'ACTION_SCREEN': {
        const actionType = data.action_type;

        if (actionType === 'update_stock') {
          return {
            screen: 'STOCK_UPDATE_SCREEN',
            data: {},
          };
        } else if (actionType === 'create_order') {
          return {
            screen: 'ORDER_SCREEN',
            data: {},
          };
        }

        return {
          screen: 'ERROR_SCREEN',
          data: {
            error_message: 'Geçersiz aksiyon türü',
          },
        };
      }

      case 'STOCK_UPDATE_SCREEN': {
        try {
          const productId = data.product_id;
          const newStock = parseInt(data.new_stock, 10);

          const oldProduct = await this.fetchProductDetails(productId);
          const oldStock = oldProduct.stock;

          await this.updateProductStock(productId, newStock);

          return {
            screen: 'SUCCESS_SCREEN',
            data: {
              success_message: 'Stok başarıyla güncellendi!',
              action_details: `Stok güncellendi: ${oldStock} → ${newStock}`,
            },
          };
        } catch (error) {
          this.logger.error(`Stock update failed: ${error.message}`);
          return {
            screen: 'ERROR_SCREEN',
            data: {
              error_message: `Stok güncellenirken hata oluştu: ${error.message}`,
            },
          };
        }
      }

      case 'ORDER_SCREEN': {
        // Create order logic here (you can create a new order entity or send notification)
        const quantity = parseInt(data.order_quantity, 10);
        const priority = data.order_priority;
        const notes = data.order_notes;
        const productId = data.product_id;

        this.logger.log(
          `Order created: Product ${productId}, Quantity: ${quantity}, Priority: ${priority}`,
        );

        // TODO: Implement order creation in your system or send notification

        return {
          screen: 'SUCCESS_SCREEN',
          data: {
            success_message: 'Sipariş talebi oluşturuldu!',
            action_details: `Miktar: ${quantity} adet\nÖncelik: ${priority}\nNotlar: ${notes || 'Yok'}`,
          },
        };
      }

      default:
        return {
          screen: 'ERROR_SCREEN',
          data: {
            error_message: 'Bilinmeyen ekran',
          },
        };
    }
  }

  // =====================================================
  // MAIN DATA_EXCHANGE ROUTER
  // =====================================================

  /**
   * Handle data_exchange action - Route to appropriate flow handler
   */
  async handleDataExchange(request: any): Promise<any> {
    this.logger.debug('Processing data_exchange action');

    const { screen, data, flow_token } = request;

    this.logger.debug(`Screen: ${screen}, Data: ${JSON.stringify(data)}`);

    // Determine flow type based on screen name or context
    let flowType = this.detectFlowType(screen, flow_token);

    // Route to appropriate flow handler
    switch (flowType) {
      case 'stock_management':
        return this.handleStockManagementDataExchange(request);

      case 'price_update':
        return this.handlePriceUpdateDataExchange(request);

      case 'low_stock_report':
        return this.handleLowStockReportDataExchange(request);

      default:
        this.logger.warn(`Unknown flow type: ${flowType}`);
        return {
          screen: 'ERROR_SCREEN',
          data: {
            error_message: 'Bilinmeyen flow türü',
          },
        };
    }
  }

  /**
   * Detect flow type from screen name or context
   */
  private detectFlowType(screen: string, flow_token?: string): string {
    // Stock Management screens
    if (
      [
        'CATEGORY_SCREEN',
        'STOCK_INFO_SCREEN',
        'STOCK_UPDATE_SCREEN',
      ].includes(screen)
    ) {
      return 'stock_management';
    }

    // Price Update screens
    if (
      ['BRAND_SCREEN', 'PRICE_INFO_SCREEN', 'DISCOUNT_SCREEN'].includes(screen)
    ) {
      return 'price_update';
    }

    // Low Stock Report screens
    if (
      [
        'FILTER_SCREEN',
        'REPORT_SCREEN',
        'ACTION_SCREEN',
        'ORDER_SCREEN',
      ].includes(screen)
    ) {
      return 'low_stock_report';
    }

    // PRODUCT_SCREEN and CONFIRM_SCREEN are shared, check flow_token or default
    // Default to price_update
    return 'price_update';
  }

  /**
   * Handle BACK action - Return to previous screen
   */
  async handleBack(request: any): Promise<any> {
    this.logger.debug('Processing BACK action');

    const { screen } = request;

    // Return current screen (user stays on same screen)
    return {
      screen: screen,
      data: {},
    };
  }

  /**
   * Save Flow response data to conversation context
   */
  async saveFlowDataToContext(
    contextId: string,
    flowData: any,
  ): Promise<void> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to save flow data: ${error.message}`);
    }
  }
}
