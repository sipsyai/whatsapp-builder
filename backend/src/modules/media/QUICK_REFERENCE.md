# Media Upload Module - Quick Reference

## Endpoints

### Upload Media
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
  file: <binary file>
  mediaType (optional): image|video|audio|document
  caption (optional): string
```

**Response:**
```json
{
  "mediaId": "string",
  "mediaUrl": "string",
  "mediaType": "image|video|audio|document",
  "fileName": "string",
  "fileSize": number,
  "mimeType": "string",
  "uploadedAt": "ISO date string"
}
```

### Get Configuration
```http
GET /api/upload/config
```

**Response:**
```json
{
  "maxFileSize": number,
  "maxFileSizeMB": "string",
  "allowedMimeTypes": { ... },
  "supportedFormats": { ... }
}
```

### Health Check
```http
GET /api/upload/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "media-upload",
  "timestamp": "ISO date string"
}
```

## Quick Upload Examples

### cURL
```bash
# Upload image
curl -X POST http://localhost:3000/api/upload -F "file=@image.jpg"

# Upload PDF
curl -X POST http://localhost:3000/api/upload -F "file=@document.pdf"

# Upload with caption
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg" \
  -F "caption=My caption"
```

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Media ID:', result.mediaId);
```

### Axios
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('http://localhost:3000/api/upload', formData);
console.log('Media ID:', response.data.mediaId);
```

### CLI Test Script
```bash
npm run test:media-upload ./path/to/file.jpg
```

## Supported File Types

| Type | Extensions | MIME Types |
|------|-----------|------------|
| **Images** | .jpg, .jpeg, .png, .webp | image/jpeg, image/png, image/webp |
| **Videos** | .mp4, .3gp, .mov | video/mp4, video/3gpp, video/quicktime |
| **Audio** | .mp3, .aac, .m4a, .amr, .ogg | audio/mpeg, audio/aac, audio/mp4, audio/amr, audio/ogg |
| **Documents** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv | application/pdf, application/msword, etc. |

## Error Codes

| Code | Meaning | Status |
|------|---------|--------|
| `NO_FILE_PROVIDED` | No file in request | 400 |
| `INVALID_FILE_TYPE` | Unsupported file type | 400 |
| `FILE_SIZE_EXCEEDED` | File too large | 400 |
| `WHATSAPP_UPLOAD_FAILED` | WhatsApp API error | 500 |

## Configuration

### Environment Variables
```env
# Optional - defaults to 16MB (16777216 bytes)
MAX_FILE_SIZE=16777216
```

## Import in Your Service

```typescript
import { Injectable } from '@nestjs/common';
import { MediaService } from '../media/media.service';

@Injectable()
export class YourService {
  constructor(private readonly mediaService: MediaService) {}

  async uploadFile(file: Express.Multer.File) {
    const result = await this.mediaService.uploadMedia({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });

    return result.mediaId;
  }
}
```

## Common Use Cases

### 1. Upload and Send via WhatsApp
```typescript
// Upload media
const uploadResult = await mediaService.uploadMedia(file);

// Send message with media
await whatsAppMessageService.sendMediaMessage({
  to: '+1234567890',
  mediaType: uploadResult.mediaType,
  mediaId: uploadResult.mediaId,
  caption: 'Check this out!',
});
```

### 2. Validate Before Upload
```typescript
const config = mediaService.getMediaConfig();
const isValid = mediaService.isAllowedMimeType(file.mimetype);
const maxSize = mediaService.getMaxFileSize();

if (!isValid || file.size > maxSize) {
  throw new Error('Invalid file');
}
```

### 3. Get Allowed Types
```typescript
const imageTypes = mediaService.getAllowedMimeTypes(MediaType.IMAGE);
console.log('Allowed image types:', imageTypes);
// ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
```

## File Size Limits

- Default: 16MB (16,777,216 bytes)
- Configurable via `MAX_FILE_SIZE` environment variable
- WhatsApp limits vary by media type (check WhatsApp documentation)

## Best Practices

1. Always validate file type before upload
2. Check file size limits
3. Handle errors gracefully
4. Use the provided error codes for specific error handling
5. Store the returned `mediaId` for sending messages
6. Don't rely on `mediaUrl` - it may expire

## Troubleshooting

### Upload Fails
1. Check file size (max 16MB by default)
2. Verify MIME type is supported
3. Ensure WhatsApp credentials are configured
4. Check network connectivity to WhatsApp API

### Invalid File Type Error
- File extension doesn't match content
- MIME type not in allowed list
- Use `/api/upload/config` to check allowed types

### File Size Exceeded
- Reduce file size
- Compress images/videos
- Increase `MAX_FILE_SIZE` if needed

## Related Documentation

- **README.md** - Full module documentation
- **EXAMPLES.md** - Detailed usage examples
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

## Support

For issues or questions:
1. Check the documentation files
2. Review error messages and codes
3. Test with `/api/upload/health` endpoint
4. Use the CLI test script for debugging
