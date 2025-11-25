import { Injectable } from '@nestjs/common';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
}

export interface Category {
  id: string;
  title: string;
  description?: string;
}

@Injectable()
export class ProductCatalogService {
  // Mock product data - in production, this would come from database
  private categories: Category[] = [
    { id: 'electronics', title: 'Elektronik', description: 'Telefon, tablet, aksesuar' },
    { id: 'clothing', title: 'Giyim', description: 'Erkek, kadın, çocuk giyim' },
    { id: 'home', title: 'Ev & Yaşam', description: 'Mobilya, dekorasyon' },
    { id: 'sports', title: 'Spor', description: 'Spor ekipmanları' },
  ];

  private products: Product[] = [
    // Electronics
    {
      id: 'iphone15',
      title: 'iPhone 15 Pro',
      description: '256GB, Titanium Blue',
      price: 64999,
      category: 'electronics',
      stock: 15,
    },
    {
      id: 'samsung-s24',
      title: 'Samsung Galaxy S24',
      description: '256GB, Phantom Black',
      price: 49999,
      category: 'electronics',
      stock: 20,
    },
    {
      id: 'airpods',
      title: 'AirPods Pro 2',
      description: 'Active Noise Cancelling',
      price: 8999,
      category: 'electronics',
      stock: 50,
    },
    {
      id: 'ipad-air',
      title: 'iPad Air M2',
      description: '256GB, Space Gray',
      price: 32999,
      category: 'electronics',
      stock: 10,
    },
    // Clothing
    {
      id: 'tshirt-white',
      title: 'Basic T-Shirt',
      description: '%100 Pamuk, Beyaz',
      price: 299,
      category: 'clothing',
      stock: 100,
    },
    {
      id: 'jeans-blue',
      title: 'Slim Fit Jean',
      description: 'Mavi, 32/32',
      price: 599,
      category: 'clothing',
      stock: 75,
    },
    {
      id: 'jacket-leather',
      title: 'Deri Ceket',
      description: 'Gerçek Deri, Siyah',
      price: 2499,
      category: 'clothing',
      stock: 25,
    },
    // Home
    {
      id: 'sofa-gray',
      title: 'L Koltuk Takımı',
      description: 'Gri Kumaş, 3+2+1',
      price: 15999,
      category: 'home',
      stock: 5,
    },
    {
      id: 'lamp-modern',
      title: 'Modern Abajur',
      description: 'LED, Ayarlanabilir',
      price: 899,
      category: 'home',
      stock: 30,
    },
    // Sports
    {
      id: 'yoga-mat',
      title: 'Yoga Matı',
      description: '6mm, Kaymaz',
      price: 399,
      category: 'sports',
      stock: 60,
    },
    {
      id: 'dumbbell-set',
      title: 'Dambıl Seti',
      description: '2x10kg, Kauçuk Kaplı',
      price: 1299,
      category: 'sports',
      stock: 40,
    },
  ];

  /**
   * Get all categories for dropdown
   */
  getCategories(): { id: string; title: string }[] {
    return this.categories.map((c) => ({
      id: c.id,
      title: c.title,
    }));
  }

  /**
   * Get products by category for dropdown
   */
  getProductsByCategory(categoryId: string): { id: string; title: string; description: string }[] {
    return this.products
      .filter((p) => p.category === categoryId && p.stock > 0)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: `${p.description} - ${this.formatPrice(p.price)}`,
      }));
  }

  /**
   * Get product details
   */
  getProductDetails(productId: string): Product | null {
    return this.products.find((p) => p.id === productId) || null;
  }

  /**
   * Get category name
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.title || categoryId;
  }

  /**
   * Format price in TL
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  }

  /**
   * Create order (mock)
   */
  createOrder(data: {
    productId: string;
    quantity: number;
    customerName: string;
    customerPhone: string;
    address: string;
    notes?: string;
  }): {
    orderId: string;
    product: Product;
    quantity: number;
    totalPrice: number;
    customerName: string;
    address: string;
  } {
    const product = this.getProductDetails(data.productId);
    if (!product) {
      throw new Error('Ürün bulunamadı');
    }

    if (product.stock < data.quantity) {
      throw new Error(`Yetersiz stok. Mevcut: ${product.stock}`);
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Decrease stock (mock)
    product.stock -= data.quantity;

    return {
      orderId,
      product,
      quantity: data.quantity,
      totalPrice: product.price * data.quantity,
      customerName: data.customerName,
      address: data.address,
    };
  }

  /**
   * Get quantity options for dropdown
   */
  getQuantityOptions(maxQuantity: number = 10): { id: string; title: string }[] {
    const options: { id: string; title: string }[] = [];
    const max = Math.min(maxQuantity, 10);
    for (let i = 1; i <= max; i++) {
      options.push({
        id: String(i),
        title: `${i} adet`,
      });
    }
    return options;
  }
}
