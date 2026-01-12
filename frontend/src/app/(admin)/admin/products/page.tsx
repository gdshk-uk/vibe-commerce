/**
 * Admin Products List Page
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/admin/products-table';
import { Plus } from 'lucide-react';
import type { Product } from '@/types/admin';

// Mock data for demo (replace with actual API call)
const mockProducts: Product[] = [];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);

  // In production, fetch products from API
  // useEffect(() => {
  //   async function loadProducts() {
  //     setLoading(true);
  //     try {
  //       const response = await listProducts();
  //       setProducts(response.data.products);
  //     } catch (error) {
  //       console.error('Failed to load products:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   loadProducts();
  // }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) {
      return;
    }

    try {
      // await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600 mt-2">
            Manage your product catalog
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : (
        <ProductsTable products={products} onDelete={handleDelete} />
      )}
    </div>
  );
}
