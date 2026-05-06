import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background pg-dot-grid">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: 'oklch(0.62 0.22 264 / 0.1)', border: '1px solid oklch(0.62 0.22 264 / 0.3)' }}>
          <Shield className="w-8 h-8" style={{ color: 'oklch(0.62 0.22 264)' }} />
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-3 pg-gradient-text">404</h1>
        <h2 className="text-xl font-semibold mb-2">페이지를 찾을 수 없습니다</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link href="/">
          <Button className="gap-2" style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}>
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
