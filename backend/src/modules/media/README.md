# Media Upload Module

This module handles media file uploads for the WhatsApp Web Clone backend, providing integration with the WhatsApp Media API.

## Features

- File upload endpoint (`POST /api/upload`)
- Support for multiple media types (images, videos, documents, audio)
- File validation (size and MIME type)
- Integration with WhatsApp Media API
- Comprehensive error handling
- Configuration endpoint for supported formats

## Endpoints

### Upload Media
**POST** `/api/upload`

Upload a media file to WhatsApp servers.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (required): The media file to upload
  - `mediaType` (optional): Type of media (image, video, audio, document)
  - `caption` (optional): Caption for the media
  - `fileName` (optional): Custom file name

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg" \
  -F "caption=My image caption"
```

**Response:**
```json
{
  "mediaId": "123456789",
  "mediaUrl": "https://example.com/media/123456789",
  "mediaType": "image",
  "fileName": "image.jpg",
  "fileSize": 1024000,
  "mimeType": "image/jpeg",
  "uploadedAt": "2025-11-23T12:00:00.000Z"
}
```

### Get Media Configuration
**GET** `/api/upload/config`

Get information about supported media types and size limits.

**Response:**
```json
{
  "maxFileSize": 16777216,
  "maxFileSizeMB": "16.00",
  "allowedMimeTypes": {
    "image": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    "video": ["video/mp4", "video/3gpp", "video/quicktime"],
    "audio": ["audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg"],
    "document": ["application/pdf", "application/msword", ...]
  },
  "supportedFormats": {
    "image": ["JPEG", "PNG", "WebP"],
    "video": ["MP4", "3GPP", "QuickTime"],
    "audio": ["AAC", "MP4", "MPEG", "AMR", "OGG"],
    "document": ["PDF", "DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "TXT", "CSV"]
  }
}
```

### Health Check
**GET** `/api/upload/health`

Check if the media upload service is running.

**Response:**
```json
{
  "status": "ok",
  "service": "media-upload",
  "timestamp": "2025-11-23T12:00:00.000Z"
}
```

## Supported Media Types

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- Max size: 16MB

### Videos
- MP4 (.mp4)
- 3GPP (.3gp)
- QuickTime (.mov)
- Max size: 16MB

### Audio
- AAC (.aac)
- MP4 Audio (.m4a)
- MPEG Audio (.mp3)
- AMR (.amr)
- OGG Vorbis (.ogg)
- Max size: 16MB

### Documents
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Text (.txt)
- CSV (.csv)
- Max size: 16MB

## Configuration

The module can be configured using environment variables:

```env
# Maximum file size in bytes (default: 16777216 = 16MB)
MAX_FILE_SIZE=16777216
```

## Error Handling

The module provides comprehensive error handling with specific error types:

### NoFileProvidedException
- **Code:** `NO_FILE_PROVIDED`
- **Status:** 400
- **Message:** "No file provided in the request"

### InvalidFileTypeException
- **Code:** `INVALID_FILE_TYPE`
- **Status:** 400
- **Message:** "Invalid file type for '[filename]'. Received '[mimetype]'. Allowed types: [types]"

### FileSizeExceededException
- **Code:** `FILE_SIZE_EXCEEDED`
- **Status:** 400
- **Message:** "File '[filename]' size ([size]MB) exceeds maximum allowed size ([max]MB)"

### MediaUploadException
- **Code:** `WHATSAPP_UPLOAD_FAILED`
- **Status:** 500
- **Message:** "Failed to upload media to WhatsApp servers"

## Architecture

### MediaController
Handles HTTP requests for media uploads and provides endpoints for configuration and health checks.

### MediaService
Core business logic for:
- File validation (size and MIME type)
- Media type determination
- Integration with WhatsApp Media API
- Error handling

### Interfaces
- `MediaType`: Enum for media types
- `MediaConfig`: Configuration interface
- `UploadedMediaFile`: File information interface
- `MediaUploadResult`: Upload result interface

### DTOs
- `UploadMediaDto`: Request validation
- `MediaUploadResponseDto`: Response format

### Exceptions
Custom exception classes for proper error handling and client feedback.

## Dependencies

- `@nestjs/common`: NestJS core functionality
- `@nestjs/config`: Configuration management
- `@nestjs/platform-express`: Express platform (includes multer)
- `form-data`: Multipart form data for API requests
- `WhatsAppModule`: Integration with WhatsApp API

## Usage Example

### From Frontend (JavaScript/TypeScript)

```typescript
async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('caption', 'My media caption');

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const result = await response.json();
  console.log('Media ID:', result.mediaId);
  console.log('Media URL:', result.mediaUrl);

  return result;
}
```

### From Another NestJS Service

```typescript
import { MediaService } from './modules/media/media.service';

@Injectable()
export class MyService {
  constructor(private readonly mediaService: MediaService) {}

  async handleFileUpload(file: UploadedMediaFile) {
    const result = await this.mediaService.uploadMedia(file);
    console.log('Uploaded media ID:', result.mediaId);
    return result;
  }
}
```

## Testing

### Test Upload with cURL

```bash
# Upload an image
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg"

# Upload a PDF document
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf"

# Upload with caption
curl -X POST http://localhost:3000/api/upload \
  -F "file=@video.mp4" \
  -F "caption=My video"
```

### Get Configuration

```bash
curl http://localhost:3000/api/upload/config
```

### Health Check

```bash
curl http://localhost:3000/api/upload/health
```

## Integration with WhatsApp Messaging

After uploading media, you can use the returned `mediaId` to send media messages via WhatsApp:

```typescript
// First, upload the media
const uploadResult = await mediaService.uploadMedia(file);

// Then, send a message with the media
await whatsAppMessageService.sendMediaMessage({
  to: '+1234567890',
  mediaType: uploadResult.mediaType,
  mediaId: uploadResult.mediaId,
  caption: 'Check out this image!',
});
```

## Notes

- Files are temporarily stored in memory (buffer) during upload
- Files are not persisted on the backend server
- All files are uploaded directly to WhatsApp servers
- The `mediaId` returned can be used to send messages via WhatsApp API
- Media URLs may expire after a certain period (check WhatsApp documentation)

## Security Considerations

1. **File Size Limits**: Enforced to prevent DoS attacks
2. **MIME Type Validation**: Only allowed file types are accepted
3. **No File Persistence**: Files are not stored on the server
4. **Error Handling**: Detailed errors without exposing sensitive information
