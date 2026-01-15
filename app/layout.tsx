import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voice To Excel - نظام إدخال البيانات الصوتي',
  description: 'نظام إدخال بيانات صوتي عربي يعمل Offline - Arabic Offline Data Entry System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary-600">
                  Voice To Excel
                </h1>
                <span className="text-sm text-gray-500">
                  نظام إدخال البيانات الصوتي
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                يعمل بشكل كامل Offline - جميع البيانات تُعالج محلياً
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
