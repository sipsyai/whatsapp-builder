# DataSources Feature

Complete frontend implementation for managing external API data sources in the WhatsApp Builder.

## Files Created

1. **api.ts** - API client and type definitions
2. **components/DataSourcesPage.tsx** - Main page component
3. **index.ts** - Public exports

## Features

### Data Source Management
- List all data sources in a table view
- Create new data sources with validation
- Edit existing data sources
- Delete data sources with confirmation
- Test connection to verify configuration

### Supported Types
- REST API
- Strapi CMS
- GraphQL

### Authentication Methods
- None
- Bearer Token
- API Key (with custom header name)
- Basic Auth

### Form Fields
- Name (required)
- Description (optional)
- Type (dropdown)
- Base URL (required, validated)
- Auth Type (dropdown)
- Auth Token (password field, conditional)
- Auth Header Name (for API Key auth)
- Timeout (optional, default: 30000ms)
- Is Active (toggle switch)

## Usage

```tsx
import { DataSourcesPage } from '@/features/data-sources';

// In your router
<Route path="/data-sources" element={<DataSourcesPage />} />
```

## API Endpoints Used

- `GET /api/data-sources` - List all data sources
- `GET /api/data-sources/active` - List active only
- `GET /api/data-sources/:id` - Get one data source
- `POST /api/data-sources` - Create new data source
- `PUT /api/data-sources/:id` - Update data source
- `DELETE /api/data-sources/:id` - Delete data source
- `POST /api/data-sources/:id/test` - Test connection

## Styling

Follows the existing WhatsApp Builder design system:
- Dark theme with `bg-[#102216]` and `bg-surface-dark`
- Primary color accent `bg-primary` (green)
- Tailwind CSS classes
- Material Symbols icons
- Responsive layout with hover effects

## Type Safety

All components are fully typed with TypeScript:
- `DataSourceType`: 'REST_API' | 'STRAPI' | 'GRAPHQL'
- `AuthType`: 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC'
- Proper interfaces for all API requests and responses
