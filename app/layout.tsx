import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-text">
        <header className="border-b border-border">
          <div className="container h-14 flex items-center justify-between">
            <nav className="flex gap-4 text-sm">
              <a href="/dashboard" className="hover:text-primary">概览</a>
              <a href="/assets" className="hover:text-primary">资产</a>
              <a href="/liabilities" className="hover:text-primary">负债</a>
              <a href="/types" className="hover:text-primary">类型管理</a>
            </nav>
            <a href="/login" className="text-sm hover:text-primary">登录</a>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}