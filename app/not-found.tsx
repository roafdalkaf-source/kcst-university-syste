// app/not-found.tsx
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-6xl font-black text-gray-200 mb-2">404</h1>
        <h2 className="text-lg font-bold text-gray-800 mb-2">الصفحة غير موجودة</h2>
        <p className="text-sm text-gray-500 mb-8">
          الرابط الذي طلبته غير موجود أو تم نقله.
        </p>
        <Link href="/" className="btn-primary">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
