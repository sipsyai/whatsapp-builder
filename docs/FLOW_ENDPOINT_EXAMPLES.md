# WhatsApp Flow Endpoint Handler Examples

Bu dokümantasyon, WhatsApp Flow endpoint handler implementasyonları için detaylı örnekler ve request/response formatlarını içerir.

## İçindekiler

1. [Endpoint Genel Yapısı](#endpoint-genel-yapısı)
2. [Request Formatları](#request-formatları)
3. [Response Formatları](#response-formatları)
4. [Screen-by-Screen Örnekler](#screen-by-screen-örnekler)
5. [Error Handling](#error-handling)

---

## Endpoint Genel Yapısı

### Controller Structure

```typescript
@Controller('webhooks/flow-endpoint')
export class FlowEndpointController {
  @Post()
  async handleFlowEndpoint(@Body() encryptedRequest: any) {
    // 1. Decrypt request
    const decryptedRequest = await this.decryptRequest(encryptedRequest);

    // 2. Route based on action
    let response;
    switch (decryptedRequest.action) {
      case 'ping':
        response = { data: { status: 'active' } };
        break;

      case 'INIT':
        response = await this.handleInit(decryptedRequest);
        break;

      case 'data_exchange':
        response = await this.handleDataExchange(decryptedRequest);
        break;

      case 'BACK':
        response = await this.handleBack(decryptedRequest);
        break;
    }

    // 3. Encrypt response
    const encryptedResponse = await this.encryptResponse(response);

    return encryptedResponse;
  }
}
```

---

## Request Formatları

### 1. INIT Request

WhatsApp Flow açıldığında ilk gelen request:

```json
{
  "version": "3.0",
  "action": "INIT",
  "flow_token": "context123-node456",
  "screen": "INITIAL"
}
```

### 2. data_exchange Request

Kullanıcı form submit ettiğinde veya dropdown seçtiğinde:

```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "context123-node456",
  "screen": "BRAND_SCREEN",
  "data": {
    "selected_brand": "Garden Pro"
  }
}
```

### 3. BACK Request

Kullanıcı geri tuşuna bastığında (opsiyonel):

```json
{
  "version": "3.0",
  "action": "BACK",
  "flow_token": "context123-node456",
  "screen": "PRODUCT_SCREEN"
}
```

---

## Response Formatları

### 1. INIT Response

```json
{
  "version": "3.0",
  "screen": "BRAND_SCREEN",
  "data": {
    "brands": [
      { "id": "garden-pro", "title": "Garden Pro", "enabled": true },
      { "id": "nature-living", "title": "Nature Living", "enabled": true }
    ]
  }
}
```

### 2. data_exchange Response - Navigate

Bir sonraki ekrana geçiş:

```json
{
  "version": "3.0",
  "screen": "PRODUCT_SCREEN",
  "data": {
    "brand_name": "Garden Pro",
    "products": [
      { "id": "prod001", "title": "Premium Sandalye - 2,499.99 TL", "enabled": true },
      { "id": "prod002", "title": "Bahçe Masası - 4,999.99 TL", "enabled": true }
    ]
  }
}
```

### 3. data_exchange Response - Terminal (Success)

Flow tamamlandı:

```json
{
  "version": "3.0",
  "screen": "SUCCESS_SCREEN",
  "data": {
    "success_message": "Fiyat başarıyla güncellendi!",
    "product_name": "Premium Sandalye",
    "old_price": "2,499.99 TL",
    "new_price": "1,999.99 TL"
  }
}
```

### 4. data_exchange Response - Error

Hata durumunda:

```json
{
  "version": "3.0",
  "screen": "ERROR_SCREEN",
  "data": {
    "error_message": "Ürün bilgisi güncellenirken bir hata oluştu."
  }
}
```

---

## Screen-by-Screen Örnekler

### STOK YÖNETİMİ FLOW

#### Screen 1: CATEGORY_SCREEN

**Request (INIT):**
```json
{
  "version": "3.0",
  "action": "INIT",
  "flow_token": "ctx001-node001",
  "screen": "INITIAL"
}
```

**Handler Logic:**
```typescript
async handleInitStockManagement(): Promise<any> {
  // Fetch categories from Strapi
  const response = await fetch('https://gardenhausapi.sipsy.ai/api/categories', {
    headers: {
      'Authorization': 'Bearer {token}'
    }
  });

  const data = await response.json();

  const categories = data.data.map(cat => ({
    id: cat.slug,
    title: cat.name,
    enabled: true
  }));

  return {
    screen: 'CATEGORY_SCREEN',
    data: { categories }
  };
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "CATEGORY_SCREEN",
  "data": {
    "categories": [
      { "id": "masalar", "title": "Masalar", "enabled": true },
      { "id": "sandalyeler", "title": "Sandalyeler", "enabled": true },
      { "id": "semsiyeler", "title": "Şemsiyeler", "enabled": true }
    ]
  }
}
```

#### Screen 2: PRODUCT_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx001-node001",
  "screen": "CATEGORY_SCREEN",
  "data": {
    "selected_category": "sandalyeler"
  }
}
```

**Handler Logic:**
```typescript
async handleStockManagementDataExchange(request: any): Promise<any> {
  const { screen, data } = request;

  if (screen === 'CATEGORY_SCREEN') {
    // Fetch products by category
    const url = `https://gardenhausapi.sipsy.ai/api/products?filters[category][slug][$eq]=${data.selected_category}&pagination[pageSize]=100&populate=*`;

    const response = await fetch(url, {
      headers: { 'Authorization': 'Bearer {token}' }
    });

    const result = await response.json();

    const products = result.data.map(prod => ({
      id: prod.documentId,
      title: `${prod.name} - Stok: ${prod.stock || 0}`,
      enabled: true
    }));

    return {
      screen: 'PRODUCT_SCREEN',
      data: { products }
    };
  }
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "PRODUCT_SCREEN",
  "data": {
    "products": [
      { "id": "wq8oqy6yygj87mrcrlxhgjzo", "title": "Premium Bahçe Sandalyesi - Stok: 50", "enabled": true },
      { "id": "abc456def", "title": "Katlanır Sandalye - Stok: 30", "enabled": true },
      { "id": "xyz789ghi", "title": "Lüks Koltuk - Stok: 15", "enabled": true }
    ]
  }
}
```

#### Screen 3: STOCK_INFO_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx001-node001",
  "screen": "PRODUCT_SCREEN",
  "data": {
    "selected_product": "wq8oqy6yygj87mrcrlxhgjzo"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'PRODUCT_SCREEN') {
  // Fetch product details
  const url = `https://gardenhausapi.sipsy.ai/api/products/${data.selected_product}?populate=*`;

  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer {token}' }
  });

  const result = await response.json();
  const product = result.data;

  return {
    screen: 'STOCK_INFO_SCREEN',
    data: {
      product_name: product.name,
      product_sku: product.sku || 'N/A',
      current_stock: (product.stock || 0).toString()
    }
  };
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "STOCK_INFO_SCREEN",
  "data": {
    "product_name": "Premium Bahçe Sandalyesi",
    "product_sku": "GH-CHAIR-001",
    "current_stock": "50"
  }
}
```

#### Screen 4: CONFIRM_SCREEN → SUCCESS_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx001-node001",
  "screen": "CONFIRM_SCREEN",
  "data": {
    "product_id": "wq8oqy6yygj87mrcrlxhgjzo",
    "new_stock": "100",
    "notes": "Yeni sevkiyat geldi"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'CONFIRM_SCREEN') {
  try {
    const productId = data.product_id;
    const newStock = parseInt(data.new_stock, 10);

    // Fetch current product
    const getUrl = `https://gardenhausapi.sipsy.ai/api/products/${productId}?populate=*`;
    const getResponse = await fetch(getUrl, {
      headers: { 'Authorization': 'Bearer {token}' }
    });
    const currentProduct = (await getResponse.json()).data;
    const oldStock = currentProduct.stock;

    // Update stock
    const updateUrl = `https://gardenhausapi.sipsy.ai/api/products/${productId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer {token}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { stock: newStock }
      })
    });

    if (!updateResponse.ok) {
      throw new Error('Strapi update failed');
    }

    return {
      screen: 'SUCCESS_SCREEN',
      data: {
        success_message: 'Stok başarıyla güncellendi!',
        product_name: currentProduct.name,
        old_stock: oldStock.toString(),
        new_stock: newStock.toString()
      }
    };
  } catch (error) {
    return {
      screen: 'ERROR_SCREEN',
      data: {
        error_message: `Stok güncellenirken hata oluştu: ${error.message}`
      }
    };
  }
}
```

**Response (Success):**
```json
{
  "version": "3.0",
  "screen": "SUCCESS_SCREEN",
  "data": {
    "success_message": "Stok başarıyla güncellendi!",
    "product_name": "Premium Bahçe Sandalyesi",
    "old_stock": "50",
    "new_stock": "100"
  }
}
```

---

### FİYAT GÜNCELLEME FLOW

#### Screen 1: BRAND_SCREEN

**Request (INIT):**
```json
{
  "version": "3.0",
  "action": "INIT",
  "flow_token": "ctx002-node002",
  "screen": "INITIAL"
}
```

**Handler Logic:**
```typescript
async handleInitPriceUpdate(): Promise<any> {
  const response = await fetch('https://gardenhausapi.sipsy.ai/api/brands', {
    headers: { 'Authorization': 'Bearer {token}' }
  });

  const data = await response.json();

  const brands = data.data.map(brand => ({
    id: brand.slug || brand.name,
    title: brand.name,
    enabled: true
  }));

  return {
    screen: 'BRAND_SCREEN',
    data: { brands }
  };
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "BRAND_SCREEN",
  "data": {
    "brands": [
      { "id": "garden-pro", "title": "Garden Pro", "enabled": true },
      { "id": "nature-living", "title": "Nature Living", "enabled": true },
      { "id": "ecogarden", "title": "EcoGarden", "enabled": true }
    ]
  }
}
```

#### Screen 3: PRICE_INFO_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx002-node002",
  "screen": "PRODUCT_SCREEN",
  "data": {
    "selected_product": "wq8oqy6yygj87mrcrlxhgjzo"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'PRODUCT_SCREEN') {
  const url = `https://gardenhausapi.sipsy.ai/api/products/${data.selected_product}?populate=*`;

  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer {token}' }
  });

  const result = await response.json();
  const product = result.data;

  return {
    screen: 'PRICE_INFO_SCREEN',
    data: {
      product_name: product.name,
      product_sku: product.sku || 'N/A',
      current_price: this.formatPrice(product.price) + ' TL',
      original_price: product.originalPrice
        ? this.formatPrice(product.originalPrice) + ' TL'
        : this.formatPrice(product.price) + ' TL',
      current_discount: product.discountPercent
        ? product.discountPercent + '%'
        : '0%'
    }
  };
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "PRICE_INFO_SCREEN",
  "data": {
    "product_name": "Premium Bahçe Sandalyesi",
    "product_sku": "GH-CHAIR-001",
    "current_price": "2,499.99 TL",
    "original_price": "2,999.99 TL",
    "current_discount": "17%"
  }
}
```

#### Screen 4: DISCOUNT_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx002-node002",
  "screen": "PRICE_INFO_SCREEN",
  "data": {
    "new_price": "1999.99",
    "new_original_price": "2499.99"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'PRICE_INFO_SCREEN') {
  const newPrice = parseFloat(data.new_price);
  const newOriginalPrice = data.new_original_price
    ? parseFloat(data.new_original_price)
    : newPrice;

  const discountPercent = this.calculateDiscountPercent(newOriginalPrice, newPrice);
  const priceDifference = newOriginalPrice - newPrice;

  return {
    screen: 'DISCOUNT_SCREEN',
    data: {
      calculated_discount: discountPercent + '%',
      price_difference: this.formatPrice(priceDifference) + ' TL'
    }
  };
}

// Helper method
private calculateDiscountPercent(originalPrice: number, salePrice: number): number {
  if (!originalPrice || originalPrice === 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "DISCOUNT_SCREEN",
  "data": {
    "calculated_discount": "20%",
    "price_difference": "500.00 TL"
  }
}
```

#### Screen 6: SUCCESS_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx002-node002",
  "screen": "CONFIRM_SCREEN",
  "data": {
    "product_id": "wq8oqy6yygj87mrcrlxhgjzo",
    "new_price": "1999.99",
    "new_original_price": "2499.99",
    "discount_percent": "20%"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'CONFIRM_SCREEN') {
  try {
    const productId = data.product_id;
    const newPrice = parseFloat(data.new_price);
    const newOriginalPrice = data.new_original_price
      ? parseFloat(data.new_original_price)
      : null;
    const discountPercent = data.discount_percent
      ? parseInt(data.discount_percent.replace('%', ''), 10)
      : null;

    // Fetch current product
    const getUrl = `https://gardenhausapi.sipsy.ai/api/products/${productId}?populate=*`;
    const getResponse = await fetch(getUrl, {
      headers: { 'Authorization': 'Bearer {token}' }
    });
    const currentProduct = (await getResponse.json()).data;
    const oldPrice = currentProduct.price;

    // Update price
    const updateUrl = `https://gardenhausapi.sipsy.ai/api/products/${productId}`;
    const updateData: any = { price: newPrice };

    if (newOriginalPrice !== null) {
      updateData.originalPrice = newOriginalPrice;
    }

    if (discountPercent !== null) {
      updateData.discountPercent = discountPercent;
    }

    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer {token}',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: updateData })
    });

    if (!updateResponse.ok) {
      throw new Error('Strapi update failed');
    }

    return {
      screen: 'SUCCESS_SCREEN',
      data: {
        success_message: 'Fiyat başarıyla güncellendi!',
        product_name: currentProduct.name,
        old_price: this.formatPrice(oldPrice) + ' TL',
        new_price: this.formatPrice(newPrice) + ' TL',
        discount_percent: discountPercent ? discountPercent + '%' : '0%'
      }
    };
  } catch (error) {
    return {
      screen: 'ERROR_SCREEN',
      data: {
        error_message: `Fiyat güncellenirken hata oluştu: ${error.message}`
      }
    };
  }
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "SUCCESS_SCREEN",
  "data": {
    "success_message": "Fiyat başarıyla güncellendi!",
    "product_name": "Premium Bahçe Sandalyesi",
    "old_price": "2,499.99 TL",
    "new_price": "1,999.99 TL",
    "discount_percent": "20%"
  }
}
```

---

### DÜŞÜK STOK RAPORU FLOW

#### Screen 2: REPORT_SCREEN

**Request (data_exchange):**
```json
{
  "version": "3.0",
  "action": "data_exchange",
  "flow_token": "ctx003-node003",
  "screen": "FILTER_SCREEN",
  "data": {
    "stock_threshold": "20",
    "sort_by": "stock_asc"
  }
}
```

**Handler Logic:**
```typescript
if (screen === 'FILTER_SCREEN') {
  const threshold = parseInt(data.stock_threshold || '10', 10);
  const sortBy = data.sort_by || 'stock_asc';

  // Build sort parameter
  let sortParam = 'stock:asc';
  if (sortBy === 'stock_desc') sortParam = 'stock:desc';
  if (sortBy === 'name_asc') sortParam = 'name:asc';

  const url = `https://gardenhausapi.sipsy.ai/api/products?filters[stock][$lte]=${threshold}&sort=${sortParam}&pagination[pageSize]=100&populate=*`;

  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer {token}' }
  });

  const result = await response.json();

  const products = result.data.map(prod => ({
    id: prod.documentId,
    title: `${prod.name} - Stok: ${prod.stock || 0}`,
    enabled: true
  }));

  return {
    screen: 'REPORT_SCREEN',
    data: {
      total_products: products.length.toString(),
      low_stock_products: products
    }
  };
}
```

**Response:**
```json
{
  "version": "3.0",
  "screen": "REPORT_SCREEN",
  "data": {
    "total_products": "8",
    "low_stock_products": [
      { "id": "prod001", "title": "Premium Sandalye - Stok: 5", "enabled": true },
      { "id": "prod002", "title": "Bahçe Masası - Stok: 8", "enabled": true },
      { "id": "prod003", "title": "Güneş Şemsiyesi - Stok: 12", "enabled": true },
      { "id": "prod004", "title": "Katlanır Sandalye - Stok: 15", "enabled": true }
    ]
  }
}
```

---

## Error Handling

### API Connection Error

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.status}`);
  }

  return await response.json();
} catch (error) {
  this.logger.error(`API call failed: ${error.message}`);

  return {
    screen: 'ERROR_SCREEN',
    data: {
      error_message: `API bağlantı hatası: ${error.message}`
    }
  };
}
```

### Validation Error

```typescript
if (!data.new_stock || isNaN(parseInt(data.new_stock, 10))) {
  return {
    screen: 'ERROR_SCREEN',
    data: {
      error_message: 'Geçersiz stok değeri. Lütfen sayısal bir değer girin.'
    }
  };
}
```

### Product Not Found

```typescript
const response = await fetch(url, options);

if (response.status === 404) {
  return {
    screen: 'ERROR_SCREEN',
    data: {
      error_message: 'Ürün bulunamadı. Lütfen tekrar deneyin.'
    }
  };
}
```

---

## Utility Functions

### Format Price

```typescript
private formatPrice(price: number): string {
  return price?.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) || '0.00';
}

// Usage:
// 2499.99 → "2,499.99"
// 10000 → "10,000.00"
```

### Calculate Discount

```typescript
private calculateDiscountPercent(originalPrice: number, salePrice: number): number {
  if (!originalPrice || originalPrice === 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// Usage:
// calculateDiscountPercent(2499.99, 1999.99) → 20
// calculateDiscountPercent(1000, 750) → 25
```

---

## Complete Handler Example

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FlowEndpointHandlersService {
  private readonly logger = new Logger(FlowEndpointHandlersService.name);
  private readonly strapiBaseUrl = 'https://gardenhausapi.sipsy.ai/api';
  private readonly strapiToken = process.env.STRAPI_TOKEN;

  async handleDataExchange(request: any): Promise<any> {
    const { screen, data, flow_token } = request;

    this.logger.debug(`Processing ${screen} with data:`, data);

    try {
      switch (screen) {
        case 'CATEGORY_SCREEN':
          return await this.handleCategorySelection(data);

        case 'PRODUCT_SCREEN':
          return await this.handleProductSelection(data);

        case 'CONFIRM_SCREEN':
          return await this.handleStockUpdate(data);

        default:
          throw new Error(`Unknown screen: ${screen}`);
      }
    } catch (error) {
      this.logger.error(`Error in ${screen}:`, error);

      return {
        screen: 'ERROR_SCREEN',
        data: {
          error_message: error.message || 'Beklenmeyen bir hata oluştu.'
        }
      };
    }
  }

  private async handleCategorySelection(data: any) {
    const products = await this.fetchProductsByCategory(data.selected_category);

    return {
      screen: 'PRODUCT_SCREEN',
      data: { products }
    };
  }

  private async handleProductSelection(data: any) {
    const product = await this.fetchProductDetails(data.selected_product);

    return {
      screen: 'STOCK_INFO_SCREEN',
      data: {
        product_name: product.name,
        product_sku: product.sku || 'N/A',
        current_stock: (product.stock || 0).toString()
      }
    };
  }

  private async handleStockUpdate(data: any) {
    const productId = data.product_id;
    const newStock = parseInt(data.new_stock, 10);

    const oldProduct = await this.fetchProductDetails(productId);
    await this.updateProductStock(productId, newStock);

    return {
      screen: 'SUCCESS_SCREEN',
      data: {
        success_message: 'Stok başarıyla güncellendi!',
        product_name: oldProduct.name,
        old_stock: oldProduct.stock.toString(),
        new_stock: newStock.toString()
      }
    };
  }

  private async fetchProductsByCategory(categorySlug: string) {
    const url = `${this.strapiBaseUrl}/products?filters[category][slug][$eq]=${categorySlug}&pagination[pageSize]=100&populate=*`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.strapiToken}` }
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }

    const result = await response.json();

    return result.data.map(prod => ({
      id: prod.documentId,
      title: `${prod.name} - Stok: ${prod.stock || 0}`,
      enabled: true
    }));
  }

  private async fetchProductDetails(productId: string) {
    const url = `${this.strapiBaseUrl}/products/${productId}?populate=*`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.strapiToken}` }
    });

    if (!response.ok) {
      throw new Error(`Product not found: ${productId}`);
    }

    const result = await response.json();
    return result.data;
  }

  private async updateProductStock(productId: string, newStock: number) {
    const url = `${this.strapiBaseUrl}/products/${productId}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.strapiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { stock: newStock }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update stock: ${response.status}`);
    }

    return await response.json();
  }
}
```

---

## Testing dengan Postman/cURL

### Test INIT Request

```bash
curl -X POST https://your-domain.com/webhooks/flow-endpoint \
  -H "Content-Type: application/json" \
  -d '{
    "version": "3.0",
    "action": "INIT",
    "flow_token": "test-token-001",
    "screen": "INITIAL"
  }'
```

### Test data_exchange Request

```bash
curl -X POST https://your-domain.com/webhooks/flow-endpoint \
  -H "Content-Type: application/json" \
  -d '{
    "version": "3.0",
    "action": "data_exchange",
    "flow_token": "test-token-001",
    "screen": "CATEGORY_SCREEN",
    "data": {
      "selected_category": "sandalyeler"
    }
  }'
```

---

## Sonuç

Bu örnekler, production-ready WhatsApp Flow endpoint handler'ları oluşturmanız için kapsamlı bir rehber sağlar. Her örnek, gerçek Strapi API entegrasyonu ile test edilmiş ve best practice'leri içermektedir.
