/**
 * AI Demo Page
 * Demonstrates all Phase 3 AI features
 */

import { AIChat, SemanticSearch, ProductRecommendations } from '@/components/ai';

export default function AIDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            AI-Powered Shopping Experience
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover our intelligent features powered by Gemini AI
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-12">
          {/* Semantic Search Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🔍 Semantic Search
              </h2>
              <p className="mt-2 text-gray-600">
                Search using natural language. Try: "wireless headphones with noise cancelling"
              </p>
            </div>
            <SemanticSearch
              placeholder="Try: 'comfortable running shoes' or 'gifts for tech lovers'"
              className="max-w-2xl"
            />
          </section>

          {/* AI Recommendations Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                ✨ Personalized Recommendations
              </h2>
              <p className="mt-2 text-gray-600">
                Get AI-powered product suggestions based on your browsing history
              </p>
            </div>
            <ProductRecommendations limit={4} />
          </section>

          {/* AI Chat Section */}
          <section className="rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                💬 AI Shopping Assistant
              </h2>
              <p className="mt-2 text-gray-600">
                Click the chat button in the bottom-right corner to start a conversation
                with our AI assistant
              </p>
            </div>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="mx-auto max-w-md">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-4">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600">
                  Look for the floating chat button in the bottom-right corner
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Ask questions like:
                  <br />
                  "What are your best-selling products?"
                  <br />
                  "I need a gift for my friend who loves tech"
                </p>
              </div>
            </div>
          </section>

          {/* Features List */}
          <section className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-bold">🚀 Phase 3 Features</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Vector Search</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Semantic understanding of product queries
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Streaming Chat</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Real-time AI responses with SSE
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Personalization</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Recommendations based on your preferences
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Rate Limiting</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Protected API endpoints with quotas
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Context Aware</h3>
                <p className="mt-1 text-sm text-purple-100">
                  AI remembers conversation history
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="font-semibold">Edge Optimized</h3>
                <p className="mt-1 text-sm text-purple-100">
                  Fast execution on Cloudflare Workers
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* AI Chat Widget (Floating) */}
      <AIChat />
    </div>
  );
}
