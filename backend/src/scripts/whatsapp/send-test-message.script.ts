import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WhatsAppMessageService } from '../../modules/whatsapp/services/whatsapp-message.service';
import { FlowMode } from '../../modules/whatsapp/dto/requests/send-flow-message.dto';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let flowId = '';
let recipientPhone = '';

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--flow-id=')) {
    flowId = args[i].substring('--flow-id='.length);
  } else if (args[i].startsWith('--to=')) {
    recipientPhone = args[i].substring('--to='.length);
  }
}

async function sendTestMessage() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const messageService = app.get(WhatsAppMessageService);

  try {
    console.log('📨 Sending Test Flow Message...\n');

    // Get Flow ID from file if not provided
    if (!flowId) {
      const flowIdPath = path.join(__dirname, '..', '..', '..', '.flow-id');
      if (fs.existsSync(flowIdPath)) {
        flowId = fs.readFileSync(flowIdPath, 'utf-8').trim();
        console.log(`📋 Using Flow ID from file: ${flowId}`);
      } else {
        console.error(
          '❌ Flow ID not provided and not found in .flow-id file',
        );
        console.log(
          'Usage: npm run flow:send-test -- --flow-id=FLOW_ID --to=PHONE_NUMBER',
        );
        process.exit(1);
      }
    }

    // Validate recipient phone
    if (!recipientPhone) {
      console.error('❌ Recipient phone number not provided');
      console.log(
        'Usage: npm run flow:send-test -- --flow-id=FLOW_ID --to=PHONE_NUMBER',
      );
      console.log('Example: npm run flow:send-test -- --to=905551234567');
      process.exit(1);
    }

    console.log(`📱 Sending to: ${recipientPhone}\n`);

    // Send Flow message using the service
    const response = await messageService.sendFlowMessage({
      to: recipientPhone,
      flowId: flowId,
      header: 'Kuaför Randevusu 💇‍♀️',
      body: 'Merhaba! Randevu oluşturmak için aşağıdaki butona tıklayın.',
      footer: 'Powered by WhatsApp Flows',
      ctaText: 'Randevu Al',
      mode: FlowMode.NAVIGATE,
      initialScreen: 'START',
      initialData: {},
    });

    console.log('═════════════════════════════════════════════════════');
    console.log('✅ Test Message Sent Successfully!');
    console.log('═════════════════════════════════════════════════════\n');

    console.log('📋 Message Details:');
    console.log(`   Message ID: ${response.messages?.[0]?.id}`);
    console.log(`   Recipient: ${recipientPhone}`);
    console.log(`   Flow ID: ${flowId}\n`);

    console.log('📱 Next Steps:');
    console.log('   1. Check your WhatsApp for the message');
    console.log('   2. Tap the "Randevu Al" button');
    console.log('   3. Complete the Flow to book an appointment\n');

    console.log('💡 View appointments at:');
    console.log('   http://localhost:3000/flow-webhook/appointments\n');
  } catch (error) {
    console.error('\n❌ Error sending test message:');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
sendTestMessage();
