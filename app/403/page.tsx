import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-6xl font-black text-gray-200 mb-2">403</h1>
        <h2 className="text-lg font-bold text-gray-800 mb-2">غير مصرح بالوصول</h2>
        <p className="text-sm text-gray-500 mb-8">
          ليس لديك صلاحية الوصول لهذه الصفحة.
          إذا كنت تعتقد أن هذا خطأ، تواصل مع المدير.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            الصفحة الرئيسية
          </Link>
          <Link href="/join-request" className="btn-secondary">
            طلب صلاحية
          </Link>
        </div>
      </div>
    </div>
  );
}
