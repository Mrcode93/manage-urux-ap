import React from 'react';
import { toast } from 'react-hot-toast';
import type { Toast } from 'react-hot-toast';

interface ConfirmOptions {
  message: string;
  confirmText?: string;
  cancelText?: string;
  duration?: number;
}

export function confirm(options: string | ConfirmOptions): Promise<boolean> {
  const {
    message,
    confirmText = 'نعم، حذف',
    cancelText = 'إلغاء',
    duration = 10000
  } = typeof options === 'string' ? { message: options } : options;

  return new Promise((resolve) => {
    toast.custom(
      (t: Toast) => (
        <div 
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          role="alertdialog"
          aria-labelledby="confirm-message"
          aria-modal="true"
        >
          <div id="confirm-message" className="text-gray-800 dark:text-gray-200 mb-4">
            {message}
          </div>
          <div className="flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              autoFocus
            >
              {cancelText}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration,
        position: 'top-center',
        ariaProps: {
          role: 'alert',
          'aria-live': 'assertive',
        },
      }
    );
  });
}