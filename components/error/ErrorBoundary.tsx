'use client';
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500"/>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">حدث خطأ غير متوقع</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-xs">
            {this.state.error?.message ?? 'تعذّر تحميل هذا القسم'}
          </p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4"/> إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
