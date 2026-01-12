/**
 * Home Page (Public)
 * Landing page for Vibe Commerce platform
 */

'use client';

import Link from 'next/link';

export default function HomePage() {
  const isSignedIn = false; // Placeholder for authentication state

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vibe Commerce
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600">
              Experience the future of online shopping with our AI-powered,
              edge-optimized e-commerce platform built on Cloudflare.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/sign-in"
                    className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Powered by Cloudflare's global edge network for zero cold starts
              and instant response times.
            </p>
          </div>
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 text-4xl">🔒</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Secure by Default
            </h3>
            <p className="text-gray-600">
              Enterprise-grade security with Clerk authentication and Row Level
              Security for your data.
            </p>
          </div>
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 text-4xl">🤖</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              AI-Powered
            </h3>
            <p className="text-gray-600">
              Intelligent product recommendations powered by Gemini AI and
              semantic search.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to start shopping?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-blue-100">
              Join thousands of satisfied customers experiencing the future of
              e-commerce.
            </p>
            {!isSignedIn && (
              <div className="mt-8">
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-white px-8 py-3 text-base font-medium text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
