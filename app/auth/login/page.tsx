import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';
import { GraduationCap } from 'lucide-react';
export const metadata: Metadata = { title: 'تسجيل الدخول' };
export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-24 -start-24 w-96 h-96 rounded-full bg-white/5"/>
        <div className="absolute -bottom-16 -end-16 w-80 h-80 rounded-full bg-white/5"/>
        <div className="relative z-10 text-center space-y-7 max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto">
            <GraduationCap className="w-10 h-10 text-accent-400"/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white leading-snug">كلية كوش للعلوم<br/><span className="text-accent-400">والتكنولوجيا</span></h1>
            <p className="text-white/50 text-sm mt-3">منصة إدارة متكاملة للعمليات الأكاديمية والإدارية</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[{n:'٥٠٠٠+',l:'طالب'},{n:'٢٠٠',l:'أستاذ'},{n:'٦',l:'كليات'}].map(s=>(
              <div key={s.l} className="text-center">
                <p className="text-xl font-bold text-accent-400">{s.n}</p>
                <p className="text-xs text-white/40">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-raised">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-500"/>
            </div>
            <p className="font-bold text-gray-800 text-sm">كلية كوش للعلوم والتكنولوجيا</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">مرحباً بعودتك</h2>
          <p className="text-gray-500 text-sm mb-8">ادخل بياناتك للوصول إلى منصة الكلية</p>
          <LoginForm/>
        </div>
      </div>
    </div>
  );
}
