import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { MockCalendarService } from './mock-calendar.service';
import { FlowCryptoUtil } from './flow-crypto.util';

@Controller('flow-webhook')
export class FlowWebhookController {
  // In production, store these securely in environment variables
  private privateKey: string;
  private publicKey: string;

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly mockCalendarService: MockCalendarService,
  ) {
    // Generate key pair for testing
    // In production, generate once and store in .env
    const keys = FlowCryptoUtil.generateKeyPair();
    this.privateKey = keys.privateKey;
    this.publicKey = keys.publicKey;

    console.log('\n=================================');
    console.log('WhatsApp Flow Public Key:');
    console.log('=================================');
    console.log(this.publicKey);
    console.log('=================================\n');
    console.log('Copy this public key to WhatsApp Business Manager');
    console.log('when configuring your Flow endpoint.\n');
  }

  @Get('public-key')
  getPublicKey() {
    return {
      publicKey: this.publicKey,
      message: 'Use this public key in WhatsApp Business Manager',
    };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleFlowRequest(@Body() body: any) {
    try {
      console.log('Received Flow request:', JSON.stringify(body, null, 2));

      // Decrypt the request
      const decryptedRequest = FlowCryptoUtil.decryptRequest(
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
        const flowToken = decryptedRequest.flow_token;
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
      const encryptedResponse = FlowCryptoUtil.encryptResponse(
        responseData,
        aesKey.subarray(0, 16), // Use first 16 bytes for AES-128
        initialVector,
      );

      console.log('Response data:', JSON.stringify(responseData, null, 2));

      return {
        encrypted_flow_data: encryptedResponse,
      };
    } catch (error) {
      console.error('Error handling flow request:', error);

      // Return error response
      return {
        error: 'Failed to process request',
        message: error.message,
      };
    }
  }

  @Get('appointments')
  getAllAppointments() {
    return {
      appointments: this.appointmentService.getAllAppointments(),
    };
  }
}
