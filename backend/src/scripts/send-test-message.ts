import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// WhatsApp API Configuration
const BASE_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

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
  try {
    console.log('📨 Sending Test Flow Message...\n');

    // Validate environment variables
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.error('❌ Missing required environment variables!');
      console.log('Please set:');
      console.log('- WHATSAPP_ACCESS_TOKEN');
      console.log('- PHONE_NUMBER_ID');
      process.exit(1);
    }

    // Get Flow ID from file if not provided
    if (!flowId) {
      const flowIdPath = path.join(__dirname, '..', '..', '.flow-id');
      if (fs.existsSync(flowIdPath)) {
        flowId = fs.readFileSync(flowIdPath, 'utf-8').trim();
        console.log(`📋 Using Flow ID from file: ${flowId}`);
      } else {
        console.error('❌ Flow ID not provided and not found in .flow-id file');
        console.log(
          'Usage: npm run send-test -- --flow-id=FLOW_ID --to=PHONE_NUMBER',
        );
        process.exit(1);
      }
    }

    // Validate recipient phone
    if (!recipientPhone) {
      console.error('❌ Recipient phone number not provided');
      console.log(
        'Usage: npm run send-test -- --flow-id=FLOW_ID --to=PHONE_NUMBER',
      );
      console.log('Example: npm run send-test -- --to=905551234567');
      process.exit(1);
    }

    // Remove '+' if present
    recipientPhone = recipientPhone.replace('+', '');

    console.log(`📱 Sending to: ${recipientPhone}\n`);

    // Send message with Flow
    const response = await axios.post(
      `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'interactive',
        interactive: {
          type: 'flow',
          header: {
            type: 'text',
            text: 'Kuaför Randevusu 💇‍♀️',
          },
          body: {
            text: 'Merhaba! Randevu oluşturmak için aşağıdaki butona tıklayın.',
          },
          footer: {
            text: 'Powered by WhatsApp Flows',
          },
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              flow_token: 'FLOW_TOKEN_' + Date.now(),
              flow_id: flowId,
              flow_cta: 'Randevu Al',
              flow_action: 'navigate',
              flow_action_payload: {
                screen: 'START',
                data: {},
              },
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('═════════════════════════════════════════════════════');
    console.log('✅ Test Message Sent Successfully!');
    console.log('═════════════════════════════════════════════════════\n');

    console.log('📋 Message Details:');
    console.log(`   Message ID: ${response.data.messages?.[0]?.id}`);
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
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
sendTestMessage();
