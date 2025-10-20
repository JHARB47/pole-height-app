import React from 'react';
import SafeLink from './SafeLink.jsx';

/**
 * 404 Not Found page component
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <SafeLink
            to="/"
            className="inline-block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Launch PolePlan Pro
          </SafeLink>
          
          <SafeLink
            to="/home"
            className="inline-block w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Homepage
          </SafeLink>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            If you believe this is an error, please{' '}
            <a href="mailto:support@poleplanpro.com" className="text-blue-600 hover:text-blue-800">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}