'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[GlobalError]', error); }, [error]);
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">حدث خطأ</h1>
          <p className="text-sm text-gray-500 mb-2">حدث خطأ غير متوقع. نعتذر عن هذا الإزعاج.</p>
          {error?.digest && (
            <p className="text-xs text-gray-400 font-mono mb-6">رمز الخطأ: {error.digest}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="btn-primary py-2.5 px-5">
              <RefreshCw className="w-4 h-4"/> إعادة المحاولة
            </button>
            <Link href="/" className="btn-secondary py-2.5 px-5">
              <Home className="w-4 h-4"/> الرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
