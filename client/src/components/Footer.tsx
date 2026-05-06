/**
 * Footer - Site footer
 * Design: Obsidian Precision - Minimal dark footer with links
 */

import { Link } from 'wouter';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 264), oklch(0.55 0.20 300))' }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">PromptGuard</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI 기반 악성 프롬프트 탐지 API 서비스. 실시간으로 프롬프트 인젝션과 유해 콘텐츠를 탐지합니다.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">제품</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: '홈' },
                { href: '/docs', label: 'API 문서' },
                { href: '/keys', label: 'API 키 관리' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">개발자</h4>
            <ul className="space-y-2">
              {[
                { href: '/docs', label: 'API 레퍼런스' },
                { href: '/docs#quickstart', label: '빠른 시작' },
                { href: '/docs#sdks', label: 'SDK' },
                { href: '/docs#examples', label: '예제' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-3">회사</h4>
            <ul className="space-y-2">
              {[
                { href: '#', label: '소개' },
                { href: '#', label: '블로그' },
                { href: '#', label: '개인정보처리방침' },
                { href: '#', label: '이용약관' },
              ].map(item => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2025 PromptGuard. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
