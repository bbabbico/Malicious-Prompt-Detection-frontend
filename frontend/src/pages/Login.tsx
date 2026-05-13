/**
 * Login.tsx - Login page
 * Design: Obsidian Precision - Dark tech SaaS
 * Auth: JWT-based login form
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/keys');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('로그인되었습니다.');
      navigate('/keys');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@promptguard.ai');
    setPassword('demo1234');
    setIsLoading(true);
    setError('');
    try {
      await login('demo@promptguard.ai', 'demo1234');
      toast.success('데모 계정으로 로그인되었습니다.');
      navigate('/keys');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex">
      {/* Left panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 264), oklch(0.55 0.20 300))' }}>
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold">PromptGuard</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1">다시 오셨군요</h1>
          <p className="text-sm text-muted-foreground mb-8">
            계정에 로그인하여 API 키를 관리하세요.
          </p>

          {/* Demo login button */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all mb-6"
            style={{ background: '#F9FAFB' }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'oklch(0.62 0.22 264 / 0.2)', color: 'oklch(0.75 0.18 264)' }}>
              D
            </span>
            데모 계정으로 체험하기
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border/60"></div>
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border/60"></div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: 'oklch(0.65 0.22 25 / 0.1)', border: '1px solid oklch(0.65 0.22 25 / 0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.22 25)' }} />
              <span style={{ color: 'oklch(0.80 0.18 25)' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">비밀번호</Label>
                <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  비밀번호 찾기
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 gap-2 font-medium"
              style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            계정이 없으신가요?{' '}
            <Link href="/register">
              <span className="text-primary hover:underline font-medium">회원가입</span>
            </Link>
          </p>

          {/* JWT info */}
          <div className="mt-8 p-3 rounded-lg border border-border text-xs text-muted-foreground"
            style={{ background: '#F9FAFB' }}>
            <p className="font-medium text-foreground/80 mb-1">보안 안내</p>
            <p>로그인 시 JWT 토큰이 발급되며 브라우저에 안전하게 저장됩니다. 7일 후 자동 만료됩니다.</p>
          </div>
        </div>
      </div>

      {/* Right panel - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #EFF6FF 100%)' }}>
        <div className="absolute inset-0 pg-dot-grid opacity-60" />

        <div className="relative z-10 flex flex-col justify-center px-12 py-12">
          <div className="max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 text-xs text-indigo-700 mb-6"
              style={{ background: 'rgba(255,255,255,0.8)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              실시간 보호 활성화
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              AI 애플리케이션을<br />안전하게 보호하세요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              PromptGuard는 프롬프트 인젝션, 탈옥 시도, 역할 조작 등 모든 AI 보안 위협을 실시간으로 차단합니다.
            </p>

            {/* Stats */}
            <div className="space-y-3">
              {[
                { label: '월간 탐지 건수', value: '50M+', color: '#4F46E5' },
                { label: '탐지 정확도', value: '99.7%', color: '#10B981' },
                { label: '평균 응답시간', value: '<100ms', color: '#0EA5E9' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-indigo-100">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-semibold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
