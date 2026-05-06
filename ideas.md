# PromptGuard 디자인 브레인스토밍

## 프로젝트 개요
AI 악성 프롬프트 탐지 서비스 Open API 플랫폼. OpenRouter와 유사한 다크 테마 기반의 개발자 친화적 인터페이스.

---

<response>
<idea>

## 아이디어 1: Cyberpunk Terminal Noir

**Design Movement**: 사이버펑크 + 터미널 미학 (Cyberpunk Terminal Noir)

**Core Principles**:
- 어두운 배경에 네온 그린/사이안 액센트로 "보안 터미널" 분위기 연출
- 모노스페이스 폰트와 세리프 폰트의 대비로 기술적 권위감 표현
- 스캔라인 효과와 글리치 애니메이션으로 사이버 보안 테마 강조
- 코드 블록과 터미널 UI 요소를 전면에 배치

**Color Philosophy**:
- 배경: #0a0a0f (거의 검은 네이비)
- 주 액센트: #00ff88 (네온 그린 - 보안 통과)
- 경고 액센트: #ff3366 (네온 레드 - 위협 감지)
- 보조: #00ccff (사이안 - 정보)
- 텍스트: #e0e0e0

**Layout Paradigm**: 좌측 사이드바 + 터미널 스타일 메인 콘텐츠 영역. 비대칭 레이아웃으로 기술적 복잡성 암시.

**Signature Elements**:
- 스캔라인 오버레이 효과
- 타이핑 커서 애니메이션
- 16진수 패턴 배경 텍스처

**Interaction Philosophy**: 모든 인터랙션이 "시스템 응답"처럼 느껴지도록. 클릭 시 터미널 출력 효과.

**Animation**: 텍스트 타이핑 효과, 스캔 진행 바, 글리치 전환 효과

**Typography System**: JetBrains Mono (코드/헤더) + IBM Plex Sans (본문)

</idea>
<probability>0.07</probability>
</response>

---

<response>
<idea>

## 아이디어 2: Obsidian Precision (선택됨)

**Design Movement**: 미니멀 다크 테크 (Obsidian Precision) - OpenRouter 스타일에 가장 근접

**Core Principles**:
- 깊은 다크 배경에 정밀한 경계선과 미묘한 그라디언트로 깊이감 표현
- 보안/탐지 테마를 색상이 아닌 형태와 공간으로 전달
- 개발자 친화적 레이아웃: 코드 예시, 명확한 계층구조
- OpenRouter처럼 깔끔하고 전문적인 SaaS 느낌

**Color Philosophy**:
- 배경: oklch(0.10 0.005 260) - 매우 어두운 청회색
- 카드: oklch(0.15 0.006 260) - 약간 밝은 다크
- 주 액센트: oklch(0.65 0.20 260) - 보라-파랑 계열 (신뢰, 기술)
- 위험 표시: oklch(0.65 0.22 25) - 따뜻한 레드-오렌지
- 안전 표시: oklch(0.65 0.18 145) - 에메랄드 그린
- 텍스트: oklch(0.92 0.005 260)

**Layout Paradigm**: 
- 상단 고정 네비게이션 바 (OpenRouter 스타일)
- 히어로 섹션: 중앙 정렬 대형 타이포그래피 + 프롬프트 입력창
- 피처 카드 그리드 (4열)
- 비대칭 통계 섹션

**Signature Elements**:
- 미묘한 그리드 패턴 배경 (점선 격자)
- 카드 호버 시 상단 테두리 컬러 액센트 효과
- 탐지 결과 시각화 (위험도 게이지)

**Interaction Philosophy**: 
- 즉각적이고 정밀한 피드백
- 호버 시 미묘한 배경 밝기 변화
- 프롬프트 분석 시 진행 상태 표시

**Animation**: 
- 페이지 진입 시 fade-up 효과
- 숫자 카운트업 애니메이션 (통계)
- 탐지 결과 슬라이드인

**Typography System**: 
- Geist (헤더/UI) + Inter (본문) - 개발자 도구 느낌
- 코드 블록: Geist Mono

</idea>
<probability>0.09</probability>
</response>

---

<response>
<idea>

## 아이디어 3: Brutalist Security Dashboard

**Design Movement**: 신브루탈리즘 + 보안 대시보드 (Brutalist Security)

**Core Principles**:
- 강한 타이포그래피 대비와 두꺼운 경계선으로 권위감 표현
- 경고/위험 상태를 적극적인 색상으로 시각화
- 정보 밀도를 높여 전문 보안 도구 느낌 강조
- 그리드 기반 레이아웃에 의도적인 비대칭 요소 추가

**Color Philosophy**:
- 배경: #f5f0e8 (크림 화이트 - 종이 느낌)
- 주 액센트: #1a1a2e (딥 네이비)
- 위험: #dc2626 (강렬한 레드)
- 안전: #16a34a (강한 그린)
- 경계선: #1a1a2e (두꺼운 검정 테두리)

**Layout Paradigm**: 신문 레이아웃 스타일. 비균일 그리드, 강한 타이포그래피 계층.

**Signature Elements**:
- 두꺼운 검정 테두리 카드
- 대형 산세리프 헤드라인
- 위험도 표시 바 (빨강/노랑/초록)

**Interaction Philosophy**: 직접적이고 명확한 상태 표시. 모호함 없이 즉각적인 피드백.

**Animation**: 최소한의 애니메이션. 상태 변화 시 색상 전환만.

**Typography System**: Space Grotesk (헤더) + DM Sans (본문)

</idea>
<probability>0.06</probability>
</response>

---

## 선택: 아이디어 2 - Obsidian Precision

OpenRouter와 가장 유사한 다크 테마 SaaS 디자인으로, 개발자 친화적이고 전문적인 느낌을 줍니다.
Geist + Inter 폰트 조합, 보라-파랑 계열 액센트, 미묘한 그리드 배경 패턴을 사용합니다.
