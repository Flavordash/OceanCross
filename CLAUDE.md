# Crossocean Flight — AI-Powered Aviation Scheduling Platform

## Project Overview
Florida 기반 항공 훈련 + 정비(MRO) 회사를 위한 AI 스케줄링 플랫폼.
학생, 교관, 정비사, 비행기, 파츠를 AI가 자동 조율하는 시스템.

## 핵심 원칙
- **자체 캘린더 시스템** — Google Calendar 연동 아님. DB 기반 자체 캘린더. 선택적 Google Calendar export는 나중에 추가 가능.
- **AI는 API 호출** — 자체 AI 모델 아님. Vercel AI SDK로 OpenAI/Claude/Llama 호출. 모델 교체 쉽게 설계.
- **Phase 단계 개발** — 현재 Phase 1 (MVP). Phase 2 (Smart Engine + Notifications), Phase 3 (SaaS + Mobile)은 나중에.

## Tech Stack
| Category | Technology | Note |
|----------|-----------|------|
| Framework | Next.js 15 (App Router) | TypeScript 필수 |
| Styling | Tailwind CSS + shadcn/ui | 모든 UI 컴포넌트는 shadcn 기반 |
| Database | Supabase (PostgreSQL) | Drizzle ORM 사용 |
| ORM | Drizzle ORM | schema.ts에서 스키마 정의 |
| Auth | Supabase Auth | 역할: admin, instructor, student, mechanic, customer |
| AI | Vercel AI SDK (@ai-sdk/openai) | function calling (tools) 사용 |
| Calendar UI | FullCalendar (React) | 자체 캘린더, DB 연동 |
| Hosting | Vercel | GitHub 연동 자동 배포 |

## Database Schema (7 Tables)

### profiles
- id, email, full_name, role (admin|instructor|student|mechanic|customer), phone, avatar_url
- Supabase Auth 확장. RLS 적용.

### aircraft
- id, registration (N number), type, model, status (available|in_maintenance|grounded), total_hours
- 각 비행기별 파츠 주문 및 정비 이력 추적

### schedule_events
- id, title, type (flight_training|maintenance|exam|ground_school), start_time, end_time
- aircraft_id, instructor_id, student_id, status (scheduled|completed|cancelled)
- 메인 캘린더 테이블. 모든 일정이 여기에.

### maintenance_jobs
- id, aircraft_id, description, status (pending_parts|scheduled|in_progress|completed)
- mechanic_id, bay, estimated_start, estimated_end
- parts_orders와 연결

### parts_orders
- id, job_id (FK→maintenance_jobs), part_name, supplier, order_date
- estimated_arrival, actual_arrival, status (ordered|shipped|delivered)
- Phase 2에서 AI가 영수증 읽어서 estimated_arrival 자동 입력

### chat_messages
- id, user_id, role (user|assistant), content, metadata (JSON), created_at
- AI 대화 기록 저장

### notifications
- id, user_id, type, message, channel (email|sms|push), sent_at, read
- Phase 2에서 Twilio/Resend 연동

## Project Structure
```
src/
├── app/
│   ├── (public)/              # 퍼블릭 웹사이트
│   │   ├── page.tsx           # 홈페이지
│   │   ├── services/
│   │   └── contact/
│   ├── (dashboard)/           # 로그인 필요 (protected)
│   │   ├── dashboard/
│   │   ├── schedule/          # 캘린더 뷰
│   │   ├── aircraft/
│   │   ├── students/
│   │   ├── mechanics/
│   │   └── chat/              # AI 챗봇
│   ├── api/
│   │   ├── chat/route.ts      # AI 채팅 엔드포인트
│   │   ├── schedule/route.ts
│   │   └── aircraft/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn 컴포넌트
│   ├── calendar/
│   ├── chat/
│   └── layout/                # Nav, Sidebar, Footer
├── lib/
│   ├── db/                    # DB 클라이언트 & 쿼리 함수
│   ├── ai/                    # AI 에이전트 설정 & tools
│   └── utils/
└── db/
    ├── schema.ts              # Drizzle 스키마
    └── migrations/
```

## Phase 1 MVP — 주차별 작업

### Week 1-2: Foundation
- [ ] Next.js 프로젝트 생성 (TS, Tailwind, App Router)
- [ ] Supabase 프로젝트 연결, Drizzle ORM 설정
- [ ] 7개 테이블 스키마 생성 + 마이그레이션
- [ ] Supabase Auth (이메일/비밀번호) + 역할별 리다이렉트
- [ ] Protected route 미들웨어
- [ ] GitHub repo 첫 커밋

### Week 3-4: Scheduling
- [ ] FullCalendar 대시보드 (일/주/월 뷰)
- [ ] 이벤트 생성 모달 (type, aircraft, instructor, student, time)
- [ ] 이벤트 수정/삭제
- [ ] 충돌 감지 (교관/비행기/학생 중복 예약 방지)
- [ ] 이벤트 타입별 색상 (flight=blue, maintenance=orange, ground=green)
- [ ] 역할별 필터링 (학생은 자기 이벤트만)
- [ ] Aircraft 관리 페이지
- [ ] Student/Mechanic 목록 페이지

### Week 5-6: AI Chatbot
- [ ] Vercel AI SDK 채팅 페이지 (streaming)
- [ ] System prompt: Crossocean Flight 스케줄링 어시스턴트
- [ ] AI Tools (function calling):
  - check_availability(date_range, type)
  - create_booking(date, time, instructor, aircraft, student)
  - get_my_schedule(user_id)
  - cancel_booking(event_id)
- [ ] Tools → 실제 DB 쿼리 연결
- [ ] 대화 기록 저장/로드

### Week 7-8: Website
- [ ] 홈페이지 (Hero, Services, CTA)
- [ ] Services 페이지
- [ ] Contact 페이지 (폼)
- [ ] 모바일 반응형
- [ ] SEO 메타 태그

### Week 9-10: Deploy
- [ ] 전체 테스트 (데스크톱 + 모바일)
- [ ] Vercel 배포 + 도메인 연결
- [ ] Supabase RLS 활성화
- [ ] 실 데이터 시드 (비행기, 교관)

## AI Agent 설계 원칙
- AI는 **절대 직접 행동하지 않음**. 항상 사용자 확인 후 실행.
- AI가 DB를 직접 조회 (Google Calendar API 아님 → 빠름, 단순함)
- 모델 교체 가능하게 설계: lib/ai/에서 모델 config 한 곳에서 관리
- Phase 2에서 단순 쿼리는 Llama/Mistral (Groq API)로 전환 예정

## 코딩 규칙
- TypeScript strict mode
- 모든 DB 쿼리는 lib/db/ 아래 함수로 분리
- API route에서 직접 SQL 쓰지 않음 → lib/db 함수 호출
- 컴포넌트는 가능한 Server Component, 인터랙션 필요시만 "use client"
- env 변수는 .env.local에만. 절대 하드코딩 안 함
- 커밋 메시지: "feat:", "fix:", "refactor:" prefix 사용

## 현재 상태
- Phase: **Phase 1 MVP 시작 전**
- 다음 작업: Week 1 — 프로젝트 초기 세팅
