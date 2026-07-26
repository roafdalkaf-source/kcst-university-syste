import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'KCST Portal', template: '%s | KCST' },
  description: 'Kush College for Science and Technology — University Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors toastOptions={{ className: 'font-arabic text-sm' }} />
      </body>
    </html>
  );
}
