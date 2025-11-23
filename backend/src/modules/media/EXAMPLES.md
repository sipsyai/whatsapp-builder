# Media Upload Module - Usage Examples

This document provides practical examples of how to use the Media Upload Module in various scenarios.

## Table of Contents
- [Basic Upload Examples](#basic-upload-examples)
- [Frontend Integration](#frontend-integration)
- [Backend Service Integration](#backend-service-integration)
- [Error Handling](#error-handling)
- [Testing](#testing)

## Basic Upload Examples

### Using cURL

#### Upload an Image
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

#### Upload a PDF Document
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/document.pdf"
```

#### Upload a Video
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/video.mp4"
```

#### Upload an Audio File
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/audio.mp3"
```

### Using Postman

1. Create a new POST request to `http://localhost:3000/api/upload`
2. Go to "Body" tab
3. Select "form-data"
4. Add a key named "file" and set type to "File"
5. Select your file
6. Click "Send"

## Frontend Integration

### React Example with Axios

```typescript
import axios from 'axios';
import { useState } from 'react';

interface MediaUploadResult {
  mediaId: string;
  mediaUrl?: string;
  mediaType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

function MediaUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<MediaUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post<MediaUploadResult>(
        'http://localhost:3000/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setResult(response.data);
      console.log('Upload successful:', response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Upload Media</h2>
      <input type="file" onChange={handleFileSelect} disabled={uploading} />
      <button onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {result && (
        <div>
          <h3>Upload Successful!</h3>
          <p>Media ID: {result.mediaId}</p>
          <p>File Name: {result.fileName}</p>
          <p>File Size: {(result.fileSize / 1024).toFixed(2)} KB</p>
          <p>Type: {result.mediaType}</p>
        </div>
      )}
    </div>
  );
}

export default MediaUploader;
```

### Vanilla JavaScript with Fetch

```javascript
async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Usage
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const result = await uploadMedia(file);
      alert(`Media uploaded! ID: ${result.mediaId}`);
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  }
});
```

### Vue.js Example

```vue
<template>
  <div class="media-uploader">
    <h2>Upload Media</h2>
    <input type="file" @change="onFileSelect" :disabled="uploading" />
    <button @click="uploadFile" :disabled="!selectedFile || uploading">
      {{ uploading ? 'Uploading...' : 'Upload' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="result" class="success">
      <h3>Upload Successful!</h3>
      <p>Media ID: {{ result.mediaId }}</p>
      <p>File Name: {{ result.fileName }}</p>
      <p>File Size: {{ formatSize(result.fileSize) }}</p>
      <p>Type: {{ result.mediaType }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const result = ref(null);
const error = ref<string | null>(null);

const onFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    error.value = null;
    result.value = null;
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await axios.post('http://localhost:3000/api/upload', formData);
    result.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
};

const formatSize = (bytes: number) => {
  return `${(bytes / 1024).toFixed(2)} KB`;
};
</script>

<style scoped>
.error { color: red; }
.success { color: green; }
</style>
```

## Backend Service Integration

### Using MediaService in Another NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import { MediaService } from './modules/media/media.service';
import { WhatsAppMessageService } from './modules/whatsapp/services/whatsapp-message.service';
import { UploadedMediaFile } from './modules/media/interfaces/media.interface';

@Injectable()
export class MessageHandlerService {
  constructor(
    private readonly mediaService: MediaService,
    private readonly whatsAppMessageService: WhatsAppMessageService,
  ) {}

  /**
   * Upload media and send it via WhatsApp
   */
  async uploadAndSendMedia(
    file: UploadedMediaFile,
    recipientPhone: string,
    caption?: string,
  ) {
    // Upload media to WhatsApp servers
    const uploadResult = await this.mediaService.uploadMedia(file);

    console.log('Media uploaded:', uploadResult.mediaId);

    // Send media message using the media ID
    const messageResult = await this.whatsAppMessageService.sendMediaMessage({
      to: recipientPhone,
      type: uploadResult.mediaType,
      mediaId: uploadResult.mediaId,
      caption: caption,
    });

    return {
      upload: uploadResult,
      message: messageResult,
    };
  }

  /**
   * Validate file before processing
   */
  async validateMediaFile(file: UploadedMediaFile): Promise<boolean> {
    const maxSize = this.mediaService.getMaxFileSize();
    const isValidType = this.mediaService.isAllowedMimeType(file.mimetype);

    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize} bytes`);
    }

    if (!isValidType) {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    return true;
  }
}
```

### Creating a Custom Controller

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../media/media.service';

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('send-with-media')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessageWithMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('to') to: string,
    @Body('caption') caption?: string,
  ) {
    // Upload media
    const uploadResult = await this.mediaService.uploadMedia({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });

    // Here you would send the message using WhatsApp API
    // with the uploadResult.mediaId

    return {
      success: true,
      mediaId: uploadResult.mediaId,
      to: to,
    };
  }
}
```

## Error Handling

### Handling Different Error Types

```typescript
import { MediaUploadException, InvalidFileTypeException, FileSizeExceededException } from './modules/media/exceptions/media.exception';

async function handleMediaUpload(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.errorCode) {
        case 'NO_FILE_PROVIDED':
          console.error('No file was provided');
          break;
        case 'INVALID_FILE_TYPE':
          console.error('Invalid file type:', error.details);
          break;
        case 'FILE_SIZE_EXCEEDED':
          console.error('File too large:', error.details);
          break;
        case 'WHATSAPP_UPLOAD_FAILED':
          console.error('WhatsApp upload failed:', error.details);
          break;
        default:
          console.error('Upload failed:', error.message);
      }

      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}
```

### Custom Error Handler in NestJS

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { MediaUploadException } from './modules/media/exceptions/media.exception';

@Catch(MediaUploadException)
export class MediaUploadExceptionFilter implements ExceptionFilter {
  catch(exception: MediaUploadException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      errorCode: exception.errorCode,
      details: exception.details,
      timestamp: new Date().toISOString(),
    });
  }
}

// Usage in controller
@Controller('api/upload')
@UseFilters(MediaUploadExceptionFilter)
export class MediaController {
  // ... controller code
}
```

## Testing

### Manual Testing Script

Save this as `test-upload.js`:

```javascript
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://localhost:3000/api/upload', formData, {
      headers: formData.getHeaders(),
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run test
testUpload('./test-image.jpg');
```

### Using the Provided Test Script

```bash
# Test with an image
npm run test:media-upload ./test-image.jpg

# Test with a PDF
npm run test:media-upload ./document.pdf

# Test with a video
npm run test:media-upload ./video.mp4
```

### Integration Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { WhatsAppApiService } from '../whatsapp/services/whatsapp-api.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

describe('MediaService', () => {
  let service: MediaService;
  let whatsAppApiService: WhatsAppApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: WhatsAppApiService,
          useValue: {
            post: jest.fn(),
            getPhoneNumberId: jest.fn().mockReturnValue('123456'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'media.maxFileSize') return 16 * 1024 * 1024;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    whatsAppApiService = module.get<WhatsAppApiService>(WhatsAppApiService);
  });

  it('should upload an image successfully', async () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('fake image data'),
    };

    jest.spyOn(whatsAppApiService, 'post').mockResolvedValue({
      id: 'media-123',
      url: 'https://example.com/media/123',
    });

    const result = await service.uploadMedia(mockFile);

    expect(result.mediaId).toBe('media-123');
    expect(result.mediaType).toBe('image');
    expect(whatsAppApiService.post).toHaveBeenCalled();
  });
});
```

## Advanced Examples

### Drag and Drop Upload (React)

```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';

function DragDropUploader() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:3000/api/upload', formData);
      console.log('Upload successful:', response.data);
      alert(`File uploaded! Media ID: ${response.data.mediaId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'blue' : 'gray'}`,
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      {uploading ? 'Uploading...' : 'Drag and drop a file here'}
    </div>
  );
}
```

### Multiple File Upload

```typescript
async function uploadMultipleFiles(files: File[]) {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData);
      return { success: true, file: file.name, data: response.data };
    } catch (error) {
      return { success: false, file: file.name, error: error.message };
    }
  });

  const results = await Promise.all(uploadPromises);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Uploaded ${successful.length} files successfully`);
  console.log(`Failed to upload ${failed.length} files`);

  return { successful, failed };
}
```
