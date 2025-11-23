import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MediaService } from '../../modules/media/media.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script for media upload functionality
 *
 * Usage:
 * ts-node -r tsconfig-paths/register src/scripts/media/test-media-upload.script.ts <file-path>
 *
 * Example:
 * ts-node -r tsconfig-paths/register src/scripts/media/test-media-upload.script.ts ./test-image.jpg
 */

async function testMediaUpload() {
  console.log('Starting media upload test...\n');

  // Get file path from command line arguments
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Error: Please provide a file path as an argument');
    console.log('\nUsage: npm run test:media-upload <file-path>');
    console.log('Example: npm run test:media-upload ./test-image.jpg\n');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}\n`);
    process.exit(1);
  }

  try {
    // Create NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const mediaService = app.get(MediaService);

    // Read file
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);

    // Determine MIME type based on file extension
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.3gp': 'video/3gpp',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.amr': 'audio/amr',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx':
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    console.log('File Information:');
    console.log(`  Name: ${fileName}`);
    console.log(`  Path: ${filePath}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`  MIME Type: ${mimeType}\n`);

    // Create upload file object
    const uploadedFile = {
      fieldname: 'file',
      originalname: fileName,
      encoding: '7bit',
      mimetype: mimeType,
      size: stats.size,
      buffer: buffer,
    };

    console.log('Uploading to WhatsApp...');

    // Upload the file
    const result = await mediaService.uploadMedia(uploadedFile);

    console.log('\n✓ Upload successful!\n');
    console.log('Upload Result:');
    console.log(`  Media ID: ${result.mediaId}`);
    console.log(`  Media URL: ${result.mediaUrl || 'N/A'}`);
    console.log(`  Media Type: ${result.mediaType}`);
    console.log(`  File Name: ${result.fileName}`);
    console.log(`  File Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
    console.log(`  MIME Type: ${result.mimeType}`);
    console.log(`  Uploaded At: ${result.uploadedAt}\n`);

    console.log(
      'You can now use this media ID to send messages via WhatsApp API.',
    );

    await app.close();
  } catch (error) {
    console.error('\n✗ Upload failed!\n');
    console.error('Error:', error.message);

    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

testMediaUpload();
