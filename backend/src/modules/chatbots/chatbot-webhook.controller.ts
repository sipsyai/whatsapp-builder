import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { ProductCatalogService } from './product-catalog.service';
import { ChatBotCryptoUtil } from './chatbot-crypto.util';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@ApiTags('Chatbot Webhook')
@Controller('chatbot-webhook')
export class ChatBotWebhookController {
  // In production, store these securely in environment variables
  private privateKey: string;
  private publicKey: string;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly mockCalendarService: MockCalendarService,
    private readonly productCatalogService: ProductCatalogService,
  ) {
    // Generate key pair for testing
    // In production, generate once and store in .env
    const keys = ChatBotCryptoUtil.generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;

    console.log('\n=================================');
    console.log('WhatsApp ChatBot Public Key:');
    console.log('=================================');
    console.log(this.publicKey);
    console.log('=================================\n');
    console.log('Copy this public key to WhatsApp Business Manager');
    console.log('when configuring your ChatBot endpoint.\n');
  }

  @Get('public-key')
  @ApiOperation({ summary: 'Get RSA public key', description: 'Returns the RSA public key for encrypting chatbot requests' })
  @ApiResponse({ status: 200, description: 'Public key returned successfully' })
  getPublicKey() {
    return {
      publicKey: this.publicKey,
      message: 'Use this public key in WhatsApp Business Manager',
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Handle chatbot data exchange',
    description: `Handles encrypted data exchange requests for chatbot features like appointment booking and product catalog.

**Actions:**
- \`ping\`: Health check
- \`INIT\`: Initial screen load
- \`data_exchange\`: Process user inputs (get_stylist_info, get_available_slots, create_appointment, get_categories, get_products, get_product_details, add_to_cart, create_order)`
  })
  @ApiBody({ description: 'Encrypted chatbot request' })
  @ApiResponse({ status: 200, description: 'Encrypted response returned successfully' })
  async handleChatBotRequest(@Body() body: any) {
    try {
      console.log('Received ChatBot request:', JSON.stringify(body, null, 2));

      // Decrypt the request
      const decryptedRequest = ChatBotCryptoUtil.decryptRequest(
        body,
        this.privateKey,
      );

      console.log(
        'Decrypted request:',
        JSON.stringify(decryptedRequest, null, 2),
      );

      // Extract AES key and IV for response encryption
      const aesKey = Buffer.from(body.encrypted_aes_key, 'base64');
      const initialVector = Buffer.from(body.initial_vector, 'base64');

      // Process the request based on action
      let responseData;

      if (decryptedRequest.action === 'ping') {
        // Health check from WhatsApp
        responseData = {
          version: '3.1',
          data: {
            status: 'active',
          },
        };
      } else if (decryptedRequest.action === 'INIT') {
        // Initial screen load
        const availableDates =
          this.mockCalendarService.getAvailableDates('ali');

        responseData = {
          version: '3.0',
          screen: 'MAIN_MENU',
          data: {},
        };
      } else if (decryptedRequest.action === 'data_exchange') {
        // Handle data exchange (get available slots or create appointment)
        const chatbotToken = decryptedRequest.chatbot_token;
        const screenId = decryptedRequest.screen;
        const data = decryptedRequest.data;

        if (data.action === 'get_stylist_info') {
          // Kuaför seçildiğinde - müsait tarihleri döndür
          const availableDates = this.mockCalendarService.getAvailableDates(
            data.stylist,
          );

          responseData = {
            version: '3.0',
            screen: screenId,
            data: {},
          };
        } else if (data.action === 'get_available_slots') {
          // Tarih seçildiğinde - o tarihteki müsait saatleri döndür
          const availableSlots = this.mockCalendarService.getAvailableSlots(
            data.stylist,
            data.date,
          );

          responseData = {
            version: '3.0',
            screen: screenId,
            data: {
              available_slots: availableSlots,
            },
          };
        } else if (data.action === 'create_appointment') {
          // Create appointment
          try {
            const appointment = this.appointmentService.createAppointment({
              service: data.service,
              stylist: data.stylist,
              appointmentDate: data.appointment_date,
              appointmentTime: data.appointment_time,
              customerName: data.customer_name,
              customerPhone: data.customer_phone,
              notes: data.notes,
            });

            const appointmentDetails =
              this.appointmentService.getAppointmentDetails(appointment);

            responseData = {
              version: '3.0',
              screen: 'SUCCESS',
              data: {
                confirmation_message: `Merhaba ${appointment.customerName}! Randevunuz başarıyla oluşturuldu.`,
                appointment_details: appointmentDetails,
              },
            };
          } catch (error) {
            responseData = {
              version: '3.0',
              screen: 'DATETIME_SCREEN',
              data: {
                error_message: error.message,
              },
            };
          }
        }
        // ==========================================
        // PRODUCT CATALOG FLOW ACTIONS
        // ==========================================
        else if (data.action === 'get_categories') {
          // Return all product categories
          const categories = this.productCatalogService.getCategories();

          responseData = {
            version: '3.0',
            screen: 'CATEGORY_SCREEN',
            data: {
              categories,
            },
          };
        } else if (data.action === 'get_products') {
          // Return products by selected category
          const categoryId = data.category;
          const products = this.productCatalogService.getProductsByCategory(categoryId);
          const categoryName = this.productCatalogService.getCategoryName(categoryId);

          responseData = {
            version: '3.0',
            screen: 'PRODUCT_LIST_SCREEN',
            data: {
              category_name: categoryName,
              products,
            },
          };
        } else if (data.action === 'get_product_details') {
          // Return product details for selected product
          const productId = data.product;
          const product = this.productCatalogService.getProductDetails(productId);

          if (!product) {
            responseData = {
              version: '3.0',
              screen: 'PRODUCT_LIST_SCREEN',
              data: {
                error_message: 'Ürün bulunamadı',
              },
            };
          } else {
            const quantityOptions = this.productCatalogService.getQuantityOptions(
              Math.min(product.stock, 10),
            );

            responseData = {
              version: '3.0',
              screen: 'PRODUCT_DETAIL_SCREEN',
              data: {
                product_id: product.id,
                product_title: product.title,
                product_description: product.description,
                product_price: this.productCatalogService.formatPrice(product.price),
                product_stock: `${product.stock} adet stokta`,
                quantity_options: quantityOptions,
              },
            };
          }
        } else if (data.action === 'add_to_cart') {
          // Confirm order details before checkout
          const productId = data.product_id;
          const quantity = parseInt(data.quantity, 10) || 1;
          const product = this.productCatalogService.getProductDetails(productId);

          if (!product) {
            responseData = {
              version: '3.0',
              screen: 'PRODUCT_DETAIL_SCREEN',
              data: {
                error_message: 'Ürün bulunamadı',
              },
            };
          } else {
            const totalPrice = product.price * quantity;

            responseData = {
              version: '3.0',
              screen: 'CHECKOUT_SCREEN',
              data: {
                product_id: product.id,
                product_title: product.title,
                quantity: String(quantity),
                unit_price: this.productCatalogService.formatPrice(product.price),
                total_price: this.productCatalogService.formatPrice(totalPrice),
              },
            };
          }
        } else if (data.action === 'create_order') {
          // Create the order
          try {
            const order = this.productCatalogService.createOrder({
              productId: data.product_id,
              quantity: parseInt(data.quantity, 10) || 1,
              customerName: data.customer_name,
              customerPhone: data.customer_phone || '',
              address: data.address,
              notes: data.notes,
            });

            responseData = {
              version: '3.0',
              screen: 'SUCCESS',
              data: {
                extension_message_response: {
                  params: {
                    flow_token: decryptedRequest.flow_token,
                    order_id: order.orderId,
                    product_title: order.product.title,
                    quantity: order.quantity,
                    total_price: this.productCatalogService.formatPrice(order.totalPrice),
                    customer_name: order.customerName,
                    address: order.address,
                  },
                },
              },
            };
          } catch (error) {
            responseData = {
              version: '3.0',
              screen: 'CHECKOUT_SCREEN',
              data: {
                error_message: error.message,
              },
            };
          }
        } else {
          // Default response
          responseData = {
            version: '3.0',
            screen: screenId,
            data: {},
          };
        }
      } else {
        // Unknown action
        responseData = {
          version: '3.1',
          data: {
            error: 'Unknown action',
          },
        };
      }

      // Encrypt the response
      const encryptedResponse = ChatBotCryptoUtil.encryptResponse(
        responseData,
        aesKey.subarray(0, 16), // Use first 16 bytes for AES-128
        initialVector,
      );

      console.log('Response data:', JSON.stringify(responseData, null, 2));

      return {
        encrypted_chatbot_data: encryptedResponse,
      };
    } catch (error) {
      console.error('Error handling chatbot request:', error);

      // Return error response
      return {
        error: 'Failed to process request',
        message: error.message,
      };
    }
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get all appointments', description: 'Retrieves all booked appointments from the system' })
  @ApiResponse({ status: 200, description: 'List of appointments returned successfully' })
  getAllAppointments() {
    return {
      appointments: this.appointmentService.getAllAppointments(),
    };
  }
}
