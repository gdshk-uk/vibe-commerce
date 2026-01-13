'use client';

/**
 * Product Recommendations Component
 * AI-powered personalized product suggestions
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { getRecommendations } from '@/lib/api/ai';
import type { SearchProduct } from '@/types/ai';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductRecommendationsProps {
  limit?: number;
  excludeProductIds?: string[];
  category?: string;
  title?: string;
  className?: string;
}

export function ProductRecommendations({
  limit = 4,
  excludeProductIds,
  category,
  title = 'Recommended for You',
  className,
}: ProductRecommendationsProps) {
  const { getToken, isSignedIn } = useAuth();
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [reason, setReason] = useState<'personalized' | 'popular'>('popular');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await getRecommendations(
          {
            limit,
            excludeProductIds,
            category,
          },
          token
        );

        if (response.success && response.data) {
          setProducts(response.data.products);
          setReason(response.data.reason);
        } else {
          setError(response.error?.message || 'Failed to load recommendations');
        }
      } catch (err) {
        console.error('Recommendations error:', err);
        setError('Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [getToken, isSignedIn, limit, excludeProductIds, category]);

  if (!isSignedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className={cn('py-8', className)}>
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {reason === 'personalized' ? (
            <Sparkles className="h-5 w-5 text-purple-600" />
          ) : (
            <TrendingUp className="h-5 w-5 text-purple-600" />
          )}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
          {reason === 'personalized' ? 'Personalized' : 'Popular'}
        </span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <a
            key={product.id}
            href={`/products/${product.id}`}
            className="group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {product.imageUrls[0] ? (
                <img
                  src={product.imageUrls[0]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}

              {/* AI Badge */}
              {reason === 'personalized' && (
                <div className="absolute right-2 top-2">
                  <span className="flex items-center gap-1 rounded-full bg-purple-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    AI Pick
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <p className="text-xs text-gray-500">
                {product.brand} • {product.category}
              </p>
              <h3 className="mt-1 font-medium text-gray-900 line-clamp-2">
                {product.name}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-purple-600">
                  {formatPrice(product.price)}
                </span>
                {product.stockQuantity > 0 ? (
                  <span className="text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Custom Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
