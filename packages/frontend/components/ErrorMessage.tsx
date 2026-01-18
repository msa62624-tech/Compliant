import React from 'react';
import Link from 'next/link';

interface ErrorMessageProps {
  message?: string;
  statusCode?: number;
  onRetry?: () => void;
  showBackButton?: boolean;
  showDashboardLink?: boolean;
}

export function ErrorMessage({
  message = 'An error occurred',
  statusCode,
  onRetry,
  showBackButton = true,
  showDashboardLink = true,
}: ErrorMessageProps) {
  // Determine the icon and color based on status code
  const is404 = statusCode === 404;
  const is500 = statusCode && statusCode >= 500;
  
  const icon = is404 ? '🔍' : is500 ? '⚠️' : '❌';
  const title = is404 ? 'Not Found' : is500 ? 'Server Error' : 'Error';
  const bgColor = is404 ? 'bg-blue-50' : is500 ? 'bg-red-50' : 'bg-orange-50';
  const borderColor = is404 ? 'border-blue-400' : is500 ? 'border-red-400' : 'border-orange-400';
  const textColor = is404 ? 'text-blue-700' : is500 ? 'text-red-700' : 'text-orange-700';

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-6 rounded-lg`}>
      <div className="flex items-start">
        <div className="text-4xl mr-4">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {title}
              {statusCode && <span className="text-sm ml-2">({statusCode})</span>}
            </h3>
          </div>
          <p className={`text-sm ${textColor} mb-4`}>{message}</p>
          
          <div className="flex gap-2 flex-wrap">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
              >
                Try Again
              </button>
            )}
            {showBackButton && (
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm font-medium"
              >
                ← Go Back
              </button>
            )}
            {showDashboardLink && (
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm font-medium"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
