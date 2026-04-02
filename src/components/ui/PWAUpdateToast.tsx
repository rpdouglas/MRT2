/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const PWAUpdateToast: React.FC = () => {
  // Note: offlineReady is intentionally omitted to avoid strict linting errors
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // SW Registration successful (unused args omitted to satisfy strict linter)
    },
    onRegisterError(_error: Error) {
      console.error('SW registration error', _error);
    },
  });

  const handleUpdate = (): void => {
    // Setting true bypasses cache and reloads the active window
    updateServiceWorker(true);
  };

  const handleClose = (): void => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-fade-in-up">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-4 border border-blue-100 flex items-start space-x-4 max-w-sm">
        <div className="flex-shrink-0">
          <div className="bg-blue-50 p-2 rounded-full">
            <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin-slow" />
          </div>
        </div>
        <div className="flex-1 pt-1">
          <h3 className="text-sm font-semibold text-gray-900">Update Available</h3>
          <p className="text-sm text-gray-500 mt-1">
            A new version of MRT has been deployed. Update now to get the latest features and fixes.
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleUpdate}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleClose}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <div className="flex-shrink-0 flex">
          <button
            onClick={handleClose}
            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
