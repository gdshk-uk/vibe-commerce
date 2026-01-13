/**
 * Dashboard Page (Protected)
 * Accessible only to authenticated users with AI-powered features
 */

'use client';

import { SemanticSearch, ProductRecommendations } from '@/components/ai';

export default function DashboardPage() {
  const user = { firstName: 'User', emailAddresses: [{ emailAddress: 'user@example.com' }], createdAt: new Date() };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.firstName || 'User'}!
          </p>
        </div>

        {/* AI Search */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            🔍 Search Products
          </h2>
          <SemanticSearch
            placeholder="Try: 'wireless headphones' or 'fitness tracker'"
            className="max-w-2xl"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Pending Orders
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Total Spent
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mb-8">
          <ProductRecommendations
            title="Recommended for You"
            limit={4}
          />
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Recent Orders
          </h2>
          <p className="text-gray-500">No orders yet. Start shopping!</p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            User Information
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span>{' '}
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Member Since:</span>{' '}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
