/**
 * ApiKeys.tsx - API Key Management page
 * Design: Obsidian Precision - Dark tech SaaS
 * Features: List keys, create new key, revoke key, usage stats
 * Auth: Requires login (redirects to /login if not authenticated)
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Shield,
  Lock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
  monthlyLimit: number;
  status: 'active' | 'revoked';
  permissions: string[];
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'pg-sk-';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function maskKey(key: string): string {
  const prefix = key.substring(0, 10);
  const suffix = key.substring(key.length - 4);
  return `${prefix}${'•'.repeat(20)}${suffix}`;
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: 'key_001',
    name: 'Production API Key',
    key: 'pg-sk-prod1234567890abcdefghijklmnopqrstuvwxyz1234',
    maskedKey: 'pg-sk-prod1•••••••••••••••••••••1234',
    createdAt: '2025-01-10T09:00:00Z',
    lastUsed: '2025-01-15T14:32:00Z',
    usageCount: 48291,
    monthlyLimit: 100000,
    status: 'active',
    permissions: ['detect', 'batch', 'models'],
  },
  {
    id: 'key_002',
    name: 'Development Key',
    key: 'pg-sk-dev1234567890abcdefghijklmnopqrstuvwxyz5678',
    maskedKey: 'pg-sk-dev12•••••••••••••••••••••5678',
    createdAt: '2025-01-12T11:00:00Z',
    lastUsed: '2025-01-15T10:15:00Z',
    usageCount: 1247,
    monthlyLimit: 10000,
    status: 'active',
    permissions: ['detect'],
  },
];

const USAGE_STATS = [
  { label: '오늘 요청', value: '2,847', change: '+12%', positive: true },
  { label: '이번 달 요청', value: '49,538', change: '+8%', positive: true },
  { label: '평균 응답시간', value: '87ms', change: '-5ms', positive: true },
  { label: '탐지 성공률', value: '99.7%', change: '+0.1%', positive: true },
];

export default function ApiKeys() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('pg_api_keys');
      if (stored) {
        setKeys(JSON.parse(stored));
      } else {
        setKeys(INITIAL_KEYS);
        localStorage.setItem('pg_api_keys', JSON.stringify(INITIAL_KEYS));
      }
    }
  }, [isAuthenticated]);

  const saveKeys = (newKeys: ApiKey[]) => {
    setKeys(newKeys);
    localStorage.setItem('pg_api_keys', JSON.stringify(newKeys));
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('API 키 이름을 입력해주세요.');
      return;
    }
    setIsCreating(true);
    await new Promise(r => setTimeout(r, 800));

    const newKey = generateApiKey();
    const keyObj: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: newKey,
      maskedKey: maskKey(newKey),
      createdAt: new Date().toISOString(),
      lastUsed: null,
      usageCount: 0,
      monthlyLimit: user?.plan === 'pro' ? 100000 : 10000,
      status: 'active',
      permissions: ['detect', 'batch', 'models'],
    };

    saveKeys([...keys, keyObj]);
    setNewKeyValue(newKey);
    setShowCreateDialog(false);
    setShowNewKeyDialog(true);
    setNewKeyName('');
    setIsCreating(false);
  };

  const handleRevokeKey = (keyId: string) => {
    const updated = keys.map(k =>
      k.id === keyId ? { ...k, status: 'revoked' as const } : k
    );
    saveKeys(updated);
    setDeleteKeyId(null);
    toast.success('API 키가 비활성화되었습니다.');
  };

  const handleDeleteKey = (keyId: string) => {
    const updated = keys.filter(k => k.id !== keyId);
    saveKeys(updated);
    setDeleteKeyId(null);
    toast.success('API 키가 삭제되었습니다.');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API 키가 클립보드에 복사되었습니다.');
  };

  const toggleReveal = (keyId: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getUsagePercent = (used: number, limit: number) => Math.min(100, (used / limit) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeKeys = keys.filter(k => k.status === 'active');

  return (
    <div className="container py-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">API 키 관리</h1>
          <p className="text-sm text-muted-foreground">
            API 키를 생성하고 관리하세요. 키는 안전하게 보관하고 외부에 노출하지 마세요.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 flex-shrink-0"
          style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          새 API 키 생성
        </Button>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {USAGE_STATS.map((stat, i) => (
          <div key={i} className="pg-card">
            <div className="text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className={`text-xs font-medium ${stat.positive ? 'text-emerald-500' : 'text-red-400'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Plan info */}
      <div className="pg-card mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'oklch(0.62 0.22 264 / 0.15)' }}>
            <Shield className="w-5 h-5" style={{ color: 'oklch(0.75 0.18 264)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{user?.plan?.toUpperCase()} 플랜</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ background: 'oklch(0.62 0.22 264 / 0.15)', color: 'oklch(0.75 0.18 264)' }}>
                {user?.plan === 'pro' ? '월 100,000 요청' : '월 10,000 요청'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeKeys.length}개의 활성 API 키 · 최대 {user?.plan === 'pro' ? '10' : '3'}개
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          플랜 업그레이드
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* API Keys list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          활성 API 키 ({activeKeys.length})
        </h2>

        {activeKeys.length === 0 ? (
          <div className="pg-card text-center py-12">
            <Key className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">아직 API 키가 없습니다.</p>
            <Button onClick={() => setShowCreateDialog(true)} size="sm"
              style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}>
              <Plus className="w-4 h-4 mr-1.5" />
              첫 번째 API 키 생성
            </Button>
          </div>
        ) : (
          activeKeys.map(apiKey => (
            <div key={apiKey.id} className="pg-card pg-card-accent">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Key name & status */}
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm">{apiKey.name}</span>
                    <span className="pg-badge-safe text-xs">활성</span>
                  </div>

                  {/* Key value */}
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-xs font-mono text-muted-foreground bg-secondary px-2.5 py-1.5 rounded-md flex-1 truncate">
                      {revealedKeys.has(apiKey.id) ? apiKey.key : apiKey.maskedKey}
                    </code>
                    <button
                      onClick={() => toggleReveal(apiKey.id)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                      title={revealedKeys.has(apiKey.id) ? '숨기기' : '보기'}
                    >
                      {revealedKeys.has(apiKey.id)
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="복사"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Usage bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        이번 달 사용량
                      </span>
                      <span>
                        {apiKey.usageCount.toLocaleString()} / {apiKey.monthlyLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'oklch(1 0 0 / 0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getUsagePercent(apiKey.usageCount, apiKey.monthlyLimit)}%`,
                          background: getUsagePercent(apiKey.usageCount, apiKey.monthlyLimit) > 80
                            ? 'oklch(0.65 0.22 25)'
                            : 'oklch(0.62 0.22 264)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>생성일: {formatDate(apiKey.createdAt)}</span>
                    <span>마지막 사용: {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : '없음'}</span>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {apiKey.permissions.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteKeyId(apiKey.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Revoked keys */}
        {keys.filter(k => k.status === 'revoked').length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6">
              비활성 API 키
            </h2>
            {keys.filter(k => k.status === 'revoked').map(apiKey => (
              <div key={apiKey.id} className="pg-card opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{apiKey.name}</span>
                    <span className="pg-badge-danger text-xs">비활성</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(apiKey.id)}
                    className="text-muted-foreground hover:text-destructive gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Security tips */}
      <div className="mt-8 pg-card"
        style={{ borderColor: 'oklch(0.62 0.22 264 / 0.2)', background: 'oklch(0.62 0.22 264 / 0.05)' }}>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'oklch(0.62 0.22 264)' }} />
          보안 권장사항
        </h3>
        <ul className="space-y-2">
          {[
            'API 키를 환경 변수로 관리하고 코드에 직접 입력하지 마세요.',
            '프로덕션과 개발 환경에 별도의 API 키를 사용하세요.',
            '사용하지 않는 API 키는 즉시 삭제하세요.',
            '키가 노출되었다면 즉시 삭제하고 새 키를 생성하세요.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4" style={{ color: 'oklch(0.62 0.22 264)' }} />
              새 API 키 생성
            </DialogTitle>
            <DialogDescription>
              API 키에 식별하기 쉬운 이름을 지정하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">키 이름</Label>
              <Input
                id="key-name"
                placeholder="예: Production API Key"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateKey()}
              />
            </div>
            <div className="rounded-lg border border-border/60 p-3"
              style={{ background: 'oklch(0.12 0.008 264)' }}>
              <p className="text-xs text-muted-foreground">
                생성된 API 키는 한 번만 표시됩니다. 안전한 곳에 복사해두세요.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>취소</Button>
            <Button onClick={handleCreateKey} disabled={isCreating}
              style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}>
              {isCreating ? (
                <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />생성 중...</>
              ) : (
                <><Plus className="w-4 h-4 mr-1.5" />생성하기</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              API 키가 생성되었습니다
            </DialogTitle>
            <DialogDescription>
              아래 API 키를 지금 복사하세요. 이 창을 닫으면 다시 볼 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-3 flex items-center gap-2"
              style={{ background: 'oklch(0.12 0.008 264)', borderColor: 'oklch(0.65 0.18 145 / 0.3)' }}>
              <code className="text-xs font-mono text-foreground flex-1 break-all">{newKeyValue}</code>
              <button
                onClick={() => handleCopyKey(newKeyValue)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 p-3"
              style={{ background: 'oklch(0.75 0.18 80 / 0.05)' }}>
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                이 키는 다시 표시되지 않습니다. 지금 바로 안전한 곳에 저장하세요.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { handleCopyKey(newKeyValue); setShowNewKeyDialog(false); }}
              style={{ background: 'oklch(0.62 0.22 264)', color: 'white' }}>
              <Copy className="w-4 h-4 mr-1.5" />
              복사하고 닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              API 키 삭제
            </AlertDialogTitle>
            <AlertDialogDescription>
              이 API 키를 삭제하면 해당 키를 사용하는 모든 애플리케이션이 즉시 작동을 멈춥니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && handleDeleteKey(deleteKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
