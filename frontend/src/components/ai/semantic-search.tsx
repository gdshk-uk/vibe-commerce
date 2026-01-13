'use client';

/**
 * Semantic Search Component
 * AI-powered product search with vector similarity
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { semanticSearch } from '@/lib/api/ai';
import type { SearchProduct } from '@/types/ai';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

interface SemanticSearchProps {
  onResultsChange?: (products: SearchProduct[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SemanticSearch({
  onResultsChange,
  placeholder = 'Search for products...',
  autoFocus = false,
  className,
}: SemanticSearchProps) {
  const { getToken, isSignedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [searchMethod, setSearchMethod] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);

      try {
        const token = isSignedIn ? await getToken() : undefined;

        const response = await semanticSearch(
          {
            query: searchQuery,
            limit: 8,
            minSimilarity: 0.3,
          },
          token || undefined
        );

        if (response.success && response.data) {
          setResults(response.data.products);
          setSearchMethod(response.data.method);
          onResultsChange?.(response.data.products);
        } else {
          setResults([]);
          setSearchMethod('');
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [getToken, isSignedIn, onResultsChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full rounded-lg border bg-white py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-purple-600" />
          )}
          {!isLoading && query && (
            <Sparkles className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-600" />
          )}
        </div>

        {/* Search Method Indicator */}
        {searchMethod && isOpen && (
          <div className="absolute right-2 top-full mt-1 text-xs text-gray-500">
            {searchMethod === 'hybrid' && '✨ AI-powered search'}
            {searchMethod === 'keyword' && '🔍 Keyword search'}
            {searchMethod === 'keyword-fallback' && '⚠️ Fallback search'}
          </div>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-white shadow-xl">
          <div className="max-h-[500px] overflow-y-auto">
            {/* Results Header */}
            <div className="border-b bg-gray-50 px-4 py-2">
              <p className="text-xs font-medium text-gray-700">
                Found {results.length} product{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Results List */}
            <div className="divide-y">
              {results.map((product) => (
                <a
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex gap-3 p-3 transition-colors hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  {/* Product Image */}
                  {product.imageUrls[0] && (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.brand} • {product.category}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-purple-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.similarity && product.similarity > 0.7 && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {Math.round(product.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* View All Link */}
            <div className="border-t bg-gray-50 p-3 text-center">
              <a
                href={`/search?q=${encodeURIComponent(query)}`}
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
                onClick={() => setIsOpen(false)}
              >
                View all results →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border bg-white p-6 text-center shadow-xl">
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-900">No results found</p>
          <p className="mt-1 text-xs text-gray-500">
            Try different keywords or browse our categories
          </p>
        </div>
      )}
    </div>
  );
}
