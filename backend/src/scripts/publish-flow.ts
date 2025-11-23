import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// WhatsApp API Configuration
const BASE_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WABA_ID;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const APP_ID = process.env.APP_ID;
const FLOW_ENDPOINT_URL = process.env.FLOW_ENDPOINT_URL;

interface FlowResponse {
  id: string;
  success: boolean;
  validation_errors?: any[];
}

async function publishFlow() {
  try {
    console.log('🚀 Starting WhatsApp Flow Publishing Process...\n');

    // Validate environment variables
    if (!ACCESS_TOKEN || !WABA_ID || !PHONE_NUMBER_ID || !FLOW_ENDPOINT_URL) {
      console.error('❌ Missing required environment variables!');
      console.log('Please set the following in your .env file:');
      console.log('- WHATSAPP_ACCESS_TOKEN');
      console.log('- WABA_ID');
      console.log('- PHONE_NUMBER_ID');
      console.log('- FLOW_ENDPOINT_URL\n');
      console.log('See .env.example for reference');
      process.exit(1);
    }

    // Read Flow JSON
    console.log('📖 Reading Flow JSON...');
    const flowJsonPath = path.join(
      __dirname,
      '..',
      'modules',
      'flows',
      'salon-appointment-flow.json',
    );
    const flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf-8'));

    // Convert Flow JSON to string (escaped for API)
    const flowJsonString = JSON.stringify(flowJson);
    console.log('✅ Flow JSON loaded\n');

    // Step 1: Create Flow
    console.log('📝 Step 1: Creating Flow...');
    const createResponse = await axios.post<FlowResponse>(
      `${BASE_URL}/${WABA_ID}/flows`,
      {
        name: 'Kuaför Randevu Sistemi',
        categories: ['APPOINTMENT_BOOKING'],
        flow_json: flowJsonString,
        endpoint_uri: FLOW_ENDPOINT_URL,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const flowId = createResponse.data.id;
    console.log(`✅ Flow created with ID: ${flowId}`);

    if (
      createResponse.data.validation_errors &&
      createResponse.data.validation_errors.length > 0
    ) {
      console.warn('⚠️  Validation warnings:');
      console.log(
        JSON.stringify(createResponse.data.validation_errors, null, 2),
      );
    }
    console.log('');

    // Step 2: Update Flow with Application ID (if provided)
    if (APP_ID) {
      console.log('🔧 Step 2: Connecting Meta App...');
      await axios.post(
        `${BASE_URL}/${flowId}`,
        {
          application_id: APP_ID,
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('✅ Meta App connected\n');
    } else {
      console.log(
        '⏭️  Step 2: Skipping Meta App connection (APP_ID not provided)\n',
      );
    }

    // Step 3: Get Flow Details
    console.log('🔍 Step 3: Getting Flow details...');
    const detailsResponse = await axios.get(
      `${BASE_URL}/${flowId}?fields=id,name,status,validation_errors,preview,health_status.phone_number(${PHONE_NUMBER_ID})`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    console.log('Flow Status:', detailsResponse.data.status);
    console.log('Flow Name:', detailsResponse.data.name);

    // Check health status
    if (detailsResponse.data.health_status) {
      const healthStatus = detailsResponse.data.health_status;
      console.log('\n🏥 Health Status:', healthStatus.can_send_message);

      if (healthStatus.can_send_message === 'BLOCKED') {
        console.error('\n❌ Flow is BLOCKED! Cannot publish.');
        console.log('Errors:');
        healthStatus.entities?.forEach((entity: any) => {
          if (entity.errors) {
            entity.errors.forEach((error: any) => {
              console.log(`  - ${error.error_description}`);
              if (error.possible_solution) {
                console.log(`    Solution: ${error.possible_solution}`);
              }
            });
          }
        });
        process.exit(1);
      }
    }

    // Step 4: Publish Flow
    console.log('\n📤 Step 4: Publishing Flow...');
    await axios.post(
      `${BASE_URL}/${flowId}/publish`,
      {},
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );
    console.log('✅ Flow published successfully!\n');

    // Step 5: Get Preview URL
    console.log('🖼️  Step 5: Generating preview URL...');
    const previewResponse = await axios.get(
      `${BASE_URL}/${flowId}?fields=preview.invalidate(false)`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    const previewUrl = previewResponse.data.preview?.preview_url;
    if (previewUrl) {
      console.log('✅ Preview URL generated\n');
    }

    // Final Summary
    console.log('═════════════════════════════════════════════════════');
    console.log('✅ Flow Published Successfully!');
    console.log('═════════════════════════════════════════════════════\n');

    console.log('📋 Flow Details:');
    console.log(`   Flow ID: ${flowId}`);
    console.log(`   Flow Name: Kuaför Randevu Sistemi`);
    console.log(`   Status: PUBLISHED`);
    console.log(`   Endpoint: ${FLOW_ENDPOINT_URL}\n`);

    if (previewUrl) {
      console.log('🔗 Preview URL:');
      console.log(`   ${previewUrl}\n`);
    }

    console.log('📱 Next Steps:');
    console.log('   1. Test the Flow using WhatsApp Manager');
    console.log('   2. Send a test message to your phone number');
    console.log(
      '   3. Or use the send-test-message.ts script to send programmatically\n',
    );

    console.log('💡 To send a test message, run:');
    console.log(
      `   npm run send-test -- --flow-id=${flowId} --to=YOUR_PHONE_NUMBER\n`,
    );

    // Save Flow ID to file for later use
    const flowIdPath = path.join(__dirname, '..', '..', '.flow-id');
    fs.writeFileSync(flowIdPath, flowId);
    console.log(`💾 Flow ID saved to: ${flowIdPath}\n`);
  } catch (error) {
    console.error('\n❌ Error publishing flow:');
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
publishFlow();
