import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WhatsAppMessageService } from '../../modules/whatsapp/services/whatsapp-message.service';

// Parse command line arguments
const args = process.argv.slice(2);
let recipientPhone = '';
let messageText = 'Hello! This is a test message from WhatsApp API 🚀';

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--to=')) {
    recipientPhone = args[i].substring('--to='.length);
  } else if (args[i].startsWith('--message=')) {
    messageText = args[i].substring('--message='.length);
  }
}

async function sendTextMessage() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const messageService = app.get(WhatsAppMessageService);

  try {
    console.log('📨 Sending Test Text Message...\n');

    // Validate recipient phone
    if (!recipientPhone) {
      console.error('❌ Recipient phone number not provided');
      console.log(
        'Usage: npm run test:send-text -- --to=PHONE_NUMBER [--message="Your message"]',
      );
      console.log('Example: npm run test:send-text -- --to=905551234567');
      process.exit(1);
    }

    console.log(`📱 Sending to: ${recipientPhone}`);
    console.log(`💬 Message: ${messageText}\n`);

    // Send text message using the service
    const response = await messageService.sendTextMessage({
      to: recipientPhone,
      text: messageText,
      previewUrl: true,
    });

    console.log('═════════════════════════════════════════════════════');
    console.log('✅ Test Message Sent Successfully!');
    console.log('═════════════════════════════════════════════════════\n');

    console.log('📋 Message Details:');
    console.log(`   Message ID: ${response.messages?.[0]?.id}`);
    console.log(`   Recipient: ${recipientPhone}`);
    console.log(`   WhatsApp ID: ${response.contacts?.[0]?.wa_id}\n`);

    console.log('📱 Next Steps:');
    console.log('   1. Check WhatsApp on the recipient phone');
    console.log('   2. Verify the message was received\n');
  } catch (error) {
    console.error('\n❌ Error sending test message:');
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
sendTextMessage();
