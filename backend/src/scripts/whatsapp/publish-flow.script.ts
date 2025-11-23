import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WhatsAppFlowService } from '../../modules/whatsapp/services/whatsapp-flow.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

async function publishFlow() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const flowService = app.get(WhatsAppFlowService);
  const configService = app.get(ConfigService);

  try {
    console.log('🚀 Starting WhatsApp Flow Publishing Process...\n');

    // Read Flow JSON
    console.log('📖 Reading Flow JSON...');
    const flowJsonPath = path.join(
      __dirname,
      '..',
      '..',
      'modules',
      'flows',
      'salon-appointment-flow.json',
    );

    if (!fs.existsSync(flowJsonPath)) {
      throw new Error(`Flow JSON not found at: ${flowJsonPath}`);
    }

    const flowJson = JSON.parse(fs.readFileSync(flowJsonPath, 'utf-8'));
    console.log('✅ Flow JSON loaded\n');

    // Step 1: Create Flow
    console.log('📝 Step 1: Creating Flow...');
    const flow = await flowService.createFlow({
      name: 'Kuaför Randevu Sistemi',
      categories: ['APPOINTMENT_BOOKING'],
      flowJson,
    });

    const flowId = flow.id;
    console.log(`✅ Flow created with ID: ${flowId}`);

    if (flow.validation_errors && flow.validation_errors.length > 0) {
      console.warn('⚠️  Validation warnings:');
      console.log(JSON.stringify(flow.validation_errors, null, 2));
    }
    console.log('');

    // Step 2: Connect Meta App (if APP_ID is configured)
    const appId = configService.get<string>('whatsapp.appId');
    if (appId) {
      console.log('🔧 Step 2: Connecting Meta App...');
      await flowService.connectApp(flowId, appId);
      console.log('✅ Meta App connected\n');
    } else {
      console.log(
        '⏭️  Step 2: Skipping Meta App connection (APP_ID not provided)\n',
      );
    }

    // Step 3: Get Flow Details & Health Status
    console.log('🔍 Step 3: Checking Flow health...');
    const details = await flowService.getFlow(flowId, [
      'id',
      'name',
      'status',
      'validation_errors',
    ]);
    const healthStatus = await flowService.getHealthStatus(flowId);

    console.log('Flow Status:', details.status);
    console.log('Flow Name:', details.name);

    // Check health status
    if (healthStatus) {
      console.log('\n🏥 Health Status:', healthStatus.can_send_message);

      if (healthStatus.can_send_message === 'BLOCKED') {
        console.error('\n❌ Flow is BLOCKED! Cannot publish.');
        if (healthStatus.entities) {
          healthStatus.entities.forEach((entity) => {
            if (entity.errors) {
              entity.errors.forEach((error) => {
                console.log(`  - ${error.error_description}`);
                if (error.possible_solution) {
                  console.log(`    Solution: ${error.possible_solution}`);
                }
              });
            }
          });
        }
        process.exit(1);
      }
    }

    // Step 4: Publish Flow
    console.log('\n📤 Step 4: Publishing Flow...');
    await flowService.publishFlow(flowId);
    console.log('✅ Flow published successfully!\n');

    // Step 5: Get Preview URL
    console.log('🖼️  Step 5: Generating preview URL...');
    const previewUrl = await flowService.getPreviewUrl(flowId, false);

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
    console.log(
      `   Endpoint: ${configService.get('whatsapp.flowEndpointUrl')}\n`,
    );

    if (previewUrl) {
      console.log('🔗 Preview URL:');
      console.log(`   ${previewUrl}\n`);
    }

    console.log('📱 Next Steps:');
    console.log('   1. Test the Flow using WhatsApp Manager');
    console.log('   2. Send a test message to your phone number');
    console.log('   3. Or use: npm run flow:send-test -- --to=YOUR_PHONE\n');

    console.log('💡 To send a test message, run:');
    console.log(`   npm run flow:send-test -- --to=YOUR_PHONE_NUMBER\n`);

    // Save Flow ID to file for later use
    const flowIdPath = path.join(__dirname, '..', '..', '..', '.flow-id');
    fs.writeFileSync(flowIdPath, flowId);
    console.log(`💾 Flow ID saved to: ${flowIdPath}\n`);
  } catch (error) {
    console.error('\n❌ Error publishing flow:');
    console.error(error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
publishFlow();
