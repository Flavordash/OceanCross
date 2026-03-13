# OceanCross — AI-Powered Aviation Scheduling Platform

# Project folder: OceanCross/

## Project Overview

Florida 기반 항공 훈련 + 정비(MRO) 회사를 위한 AI 스케줄링 플랫폼.
학생, 교관, 정비사, 비행기, 파츠를 AI가 자동 조율하는 시스템.

## 핵심 원칙

- **데이터 먼저** — 플랫폼보다 데이터 파이프라인을 먼저 구축. 데이터 없으면 빈 껍데기.
- **자체 캘린더** — DB 기반. Google Calendar 아님.
- **AI는 API 호출** — Vercel AI SDK. 모델 교체 쉽게. 한 곳에서 관리.
- **파일럿 자격 검증** — 만료 시 예약 차단.
- **Dispatch W&B 체크** — 비행 전 탑승자 체중 + 연료 + CG 자동 계산/경고.
- **문서 → JSON** — PDF/PNG 업로드 → 정규식 추출 → 폼 자동채우기 → 확인 → DB. AI 불필요.
- **처음부터 확장 대비** — 캐싱, 인덱싱, 모델 라우터, 에러 모니터링 기본 탑재.

## Tech Stack

### 웹 플랫폼

| Category         | Technology                           | Note                                                          |
| ---------------- | ------------------------------------ | ------------------------------------------------------------- |
| Framework        | Next.js 16.1 (App Router)           | TypeScript strict                                             |
| Styling          | Tailwind CSS 4 + shadcn/ui          |                                                               |
| Database         | Supabase (PostgreSQL)                | Drizzle ORM                                                   |
| Auth             | Supabase Auth                        | role: admin, instructor, student, mechanic, customer, client  |
| AI               | Vercel AI SDK (@ai-sdk/deepseek)     | DeepSeek Chat, function calling, streaming                    |
| Calendar         | FullCalendar (React)                 | DB 연동                                                       |
| Animation        | Framer Motion                        | 페이지 전환 + UI 애니메이션                                   |
| Document Extract | pdfjs-dist + tesseract.js            | 웹에서 직접 PDF/OCR 처리                                      |
| Weather          | Aviation Weather API                 | METAR/TAF, 비행 카테고리 자동 판정                            |
| Data Fetching    | TanStack Query (React Query)         | **미구현 — 향후 추가 예정**                                   |
| Error Monitoring | Sentry (Free tier)                   | **미구현 — 향후 추가 예정**                                   |
| Hosting          | Vercel                               | GitHub 연동                                                   |

### 문서 처리 (Python, AI 없음)

| Category   | Technology    | Note                   |
| ---------- | ------------- | ---------------------- |
| PDF 파싱   | pdfplumber    | 텍스트 + 테이블 추출   |
| 이미지 OCR | Tesseract OCR | PNG/JPG 텍스트 인식    |
| 패턴 매칭  | Python regex  | 필드 추출 (AI 대신)    |
| 검증       | Pydantic      | JSON 스키마 검증       |
| **비용**   | **$0**        | **전부 로컬, AI 없음** |

## 개발 순서

### Phase 1-A: 데이터 파이프라인 (Week 1-4)

데이터가 없으면 플랫폼은 빈 껍데기. 데이터부터.

```
Week 1-2: 문서 추출기 (Python)
  - PDF/PNG → 텍스트 추출 (pdfplumber, Tesseract)
  - 정규식으로 필드 매칭 → JSON 출력
  - 비행기 W&B, 파일럿 서류, 파츠 영수증

Week 3: 웹 연동
  - 업로드 UI + 자동 폼 채우기 + DB 저장
  - N-number → FAA API로 기본 정보 자동 조회

Week 4: 실 데이터 투입
  - 의뢰인 fleet 자료 전부 추출 → DB
  - W&B 계산 검증
```

### Phase 1-B: 플랫폼 (Week 5-10)

실 데이터 위에 기능 구축.

```
Week 5-6:  Auth + 대시보드 + 스케줄링 + 자격검증
Week 7-8:  Aircraft 전체 (상세 5탭, W&B 계산기) + Dispatch 체크
Week 9:    AI 챗봇 + Students/Mechanics + 퍼블릭 웹사이트
Week 10:   테스트 + 배포
```

## 문서 → JSON 파이프라인 (듀얼 모드)

### 모드 1: 정규식 추출 (무료, /api/upload)

```
유저가 PDF/PNG 업로드
    ↓
서버 API route에서 처리:
  - PDF → pdfplumber로 텍스트/테이블 추출
  - PNG → Tesseract OCR로 텍스트 추출
    ↓
정규식 패턴 매칭:
  r"Empty Weight[:\s]+(\d+[\.,]?\d*)\s*(lbs|pounds)"
  r"Max Takeoff[:\s]+(\d+[\.,]?\d*)\s*(lbs|pounds)"
  r"Fuel Capacity[:\s]+(\d+[\.,]?\d*)\s*(gal)"
    ↓
추출 결과 → 폼에 자동 채움
    ↓
유저 확인/수정 → 저장 클릭
    ↓
DB 저장 + 대시보드 실시간 반영
```

### 모드 2: Vision AI 추출 (/api/extract)

```
유저가 PDF/PNG 업로드
    ↓
PDF → 페이지별 이미지 변환 (최대 5페이지)
    ↓
GPT-4o-mini Vision으로 구조화 추출
  - Zod 스키마로 결과 검증
  - aircraft / credential / parts 자동 분류
    ↓
추출 결과 → 폼에 자동 채움 → 유저 확인 → DB 저장
```

정규식으로 안 잡히는 복잡한 문서는 Vision AI로 폴백. 비용은 페이지당 ~$0.01.

### 지원 문서

- 비행기 W&B (PDF/PNG) → aircraft + aircraft_wb_stations
- 파일럿 Medical Certificate → pilot_credentials 만료일
- Renter's Insurance → pilot_credentials 보험 만료일
- 파츠 영수증 → parts_orders

### 비행기 추가 방법 3가지

1. **수동 입력** — 폼에 직접 타이핑. 항상 가능.
2. **파일 업로드** — PDF/PNG → 자동 추출 → 폼 채움 → 확인 → 저장. AI 없음, $0.
3. **N-number 조회** — FAA API로 기본 정보 로드. AI 없음, $0.

### Python 프로젝트 구조

```
tools/
├── document_ai/
│   ├── main.py                # CLI 진입점
│   ├── parsers/
│   │   ├── pdf_parser.py      # pdfplumber
│   │   └── ocr_parser.py      # Tesseract
│   ├── extractors/
│   │   ├── aircraft_extractor.py   # W&B → AircraftData
│   │   ├── credential_extractor.py # Medical/Insurance → CredentialData
│   │   └── parts_extractor.py      # 영수증 → PartsOrderData
│   ├── schemas/
│   │   ├── aircraft.py        # Pydantic
│   │   ├── credential.py
│   │   └── parts_order.py
│   ├── output/
│   └── requirements.txt       # pdfplumber, pytesseract, pydantic, pdf2image, Pillow, requests
```

## Dispatch Pre-Flight Check 시스템

비행 예약이 확정되면 자동으로 W&B + 자격 체크:

```
비행 예약 (schedule_events)
    ↓
자동 계산:
  - 파일럿 체중 (profiles.weight_lbs)
  - 학생 체중 (profiles.weight_lbs)
  - 비행기 W&B (aircraft + aircraft_wb_stations)
    ↓
결과:
  - 총 탑승 무게 = 파일럿 + 학생 + 추가 승객
  - Useful Load = MTOW - Empty Weight
  - 남은 적재량 = Useful Load - 탑승 무게
  - 최대 연료 = 남은 적재량 ÷ 6.0 (lbs/gal)
  - CG = Σ(weight × arm) ÷ Σ(weight) → envelope 검증
    ↓
경고:
  ✅ CLEARED — 전부 정상
  ⚠️ LIMITED FUEL — 연료 제한, 비행시간 주의
  ❌ OVER MTOW — 최대 이륙중량 초과, 비행 불가
  ❌ CG OUT OF RANGE — 무게 재배치 필요
```

### 대시보드 표시

```
[오늘의 비행]
✈️ 09:00 - N12345 Cessna 172S
   Instructor: Kim (180 lbs) | Student: Park (165 lbs)
   Fuel: 42 gal available (max 56) | CG: 42.3 in ✅
   Status: ✅ CLEARED FOR DISPATCH

✈️ 11:00 - N67890 Cessna 150
   Instructor: Lee (195 lbs) | Student: Choi (210 lbs)
   Fuel: 12 gal ⚠️ (~1.5hr) | CG: 39.1 in ✅
   Status: ⚠️ LIMITED FUEL — REVIEW BEFORE DISPATCH
```

## Database Schema (16+ Tables, Drizzle ORM)

### profiles

- id, email, full_name, role, phone, avatar_url
- **weight_lbs** (float, nullable) — Dispatch W&B 계산용. 본인이 프로필에서 입력.

### pilot_credentials

- id, profile_id (FK)
- tsa_clearance_status, tsa_clearance_expiry
- last_flight_review_date, renters_insurance_expiry
- medical_class, medical_expiry
- certificate_type, certificate_number

### pilot_checkouts

- id, pilot_id (FK), aircraft_id (FK)
- checkout_date, expires_at, status

### aircraft

- id, registration (unique), type (single_engine|multi_engine|helicopter), model, year
- status (available|in_maintenance|grounded)
- total_hours, empty_weight, max_takeoff_weight, useful_load (자동계산 가능)
- max_passengers, luggage_capacity_lbs
- fuel_capacity_gallons (총 연료), fuel_usable_gallons (사용 가능 연료)
- fuel_weight_lbs (연료 무게), fuel_per_wing_gallons
- oil_capacity_quarts
- max_endurance_hours (최대 비행시간, not leaned 기준)
- v_speeds (JSONB) — {Vr, Vx, Vy, Va, Vs, Vso, Vfe, Vno, Vne, best_glide, climb, max_crosswind}
- notes (text) — 비행기별 메모
- **V-Speeds는 비행기 타입마다 항목이 다를 수 있어서 JSONB로 유연하게 저장**

### aircraft_wb_stations

- id, aircraft_id (FK)
- station_name, arm, min_weight, max_weight

### schedule_events

- id, title, type, start_time, end_time
- aircraft_id, instructor_id, student_id, status
- **dispatch_status** (pending|cleared|limited|rejected) — W&B 체크 결과
- **dispatch_data** (JSONB) — 계산 결과 스냅샷

### maintenance_jobs

- id, aircraft_id, description, status
- mechanic_id, bay, estimated_start, estimated_end

### parts_orders

- id, job_id (FK), part_name, supplier
- order_date, estimated_arrival, actual_arrival, status

### chat_messages

- id, user_id, role, content, metadata (JSONB), created_at

### notifications

- id, user_id, type, message, channel, sent_at, read

### documents

- id, profile_id or aircraft_id, type
- file_url, uploaded_at, expires_at
- extracted_data (JSONB) — 추출 결과 저장

### aircraft_reminders (추가됨)

- id, aircraft_id (FK), type (100hr|annual|oil_change|custom 등)
- due_date, due_hours, current_hours, status
- description, notes

### dispatch_logs (추가됨)

- id, event_id (FK), aircraft_id (FK), pilot_id, student_id
- hobbs_out, hobbs_in, tach_out, tach_in
- fuel_gallons, preflight_status, weather_data (JSONB)
- dispatched_at, returned_at, status, notes

### invoices + invoice_items (추가됨)

- invoices: id, invoice_number, client_id, dispatch_log_id, status (draft|sent|paid|void)
- invoices: subtotal, tax_rate, tax_amount, total, previous_balance, amount_due
- invoice_items: id, invoice_id (FK), description, quantity, rate, amount

### client_details + client_tags + client_ledger (추가됨)

- client_details: profile_id (FK), address, emergency_contact, notes
- client_tags: id, name, color — 클라이언트 분류 태그
- client_ledger: id, client_id, type (charge|payment|credit|refund), amount, description

### pilot_info + pilot_courses (추가됨)

- pilot_info: profile_id, certificate_type, certificate_number, ratings, medical_class 등
- pilot_courses: id, pilot_id, course_name, status, start_date, completion_date

### instructor_specialties + instructor_settings (추가됨)

- instructor_specialties: id, name, hourly_rate
- instructor_settings: profile_id, cfi_number, cfi_expiry, ground_rate, flight_rate

## 확장성 + 비용 최적화 (처음부터 적용)

### 1. 데이터 캐싱 — TanStack Query (미구현, 향후 작업)

**현재 상태:** 패키지 미설치. 모든 데이터는 직접 fetch 호출.

도입 시 적용할 설정:
```typescript
// 자주 안 바뀌는 데이터 (비행기 목록, W&B) → staleTime 길게
const { data: aircraft } = useQuery({
  queryKey: ["aircraft"],
  queryFn: fetchAircraft,
  staleTime: 5 * 60 * 1000, // 5분간 캐시
});

// 자주 바뀌는 데이터 (오늘 스케줄) → staleTime 짧게
const { data: todayEvents } = useQuery({
  queryKey: ["events", "today"],
  queryFn: fetchTodayEvents,
  staleTime: 30 * 1000, // 30초
});
```

**기대 효과:** DB 쿼리 50% 이상 감소.

### 2. DB 인덱싱 — Drizzle 스키마에 포함

```
schedule_events: start_time, aircraft_id, instructor_id, student_id
maintenance_jobs: aircraft_id, status
parts_orders: job_id, status
pilot_credentials: profile_id, medical_expiry
pilot_checkouts: pilot_id, aircraft_id
```

**효과:** 쿼리 속도 10배. 사용자 500명이어도 응답 < 100ms.

### 3. 페이지네이션 — 무한 로딩 아님

- 캘린더: 현재 보이는 날짜 범위만 로드
- 채팅 기록: 최근 50개만, 스크롤 시 추가 로드
- 학생/비행기 목록: 페이지당 20개

### 4. AI 비용 최적화 — 모델 라우터 (부분 구현)

**현재 상태:** DeepSeek Chat 단일 모델 사용. 라우터 미구현.

향후 적용할 설계:
```typescript
// src/lib/ai/index.ts — 모델 한 곳에서 관리
export const AI_CONFIG = {
  complex: deepseek("deepseek-chat"),     // 복잡한 작업
  simple: openai("gpt-4o-mini"),          // 단순 작업
};

export function selectModel(taskType: string) {
  const complexTasks = ["create_booking", "calculate_wb"];
  return complexTasks.includes(taskType) ? AI_CONFIG.complex : AI_CONFIG.simple;
}
```

**기대 효과:** AI 비용 60-70% 절감.

### 5. 자주 묻는 질문 — AI 안 거침

```typescript
// 정적 답변 가능한 질문은 AI 호출 안 함
const FAQ_RESPONSES: Record<string, string> = {
  영업시간: "월-금 8:00 AM - 6:00 PM, 토 9:00 AM - 3:00 PM",
  "business hours": "Mon-Fri 8 AM - 6 PM, Sat 9 AM - 3 PM",
  // ...
};
```

**효과:** FAQ 트래픽의 AI 비용 $0.

### 6. 에러 모니터링 — Sentry (미구현, 향후 작업)

도입 시:
```typescript
// src/lib/sentry.ts — 에러 자동 수집
// 유저가 에러를 만나면 → 개발자에게 알림
// 어떤 페이지, 어떤 유저, 어떤 에러인지 자동 기록
```

### 7. 환경 분리

```
.env.local          → 개발 (내 Supabase, 테스트 데이터)
.env.staging        → 스테이징 (테스트 서버)
.env.production     → 프로덕션 (클라이언트 Supabase, 실 데이터)
```

**효과:** 디버깅 시 프로덕션 데이터 절대 안 건드림.

### 비용 예상

| 단계              | 유저     | 월 비용   | 수입        |
| ----------------- | -------- | --------- | ----------- |
| Phase 1 (1개사)   | 10-50명  | ~$50      | 개발비      |
| Phase 2 (2-3개사) | 50-200명 | ~$150     | $400-600/월 |
| Phase 3 (SaaS)    | 500명+   | ~$300-500 | $2,000+/월  |

## Web Platform Structure (실제 구현 기준)

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx               # 홈 (Hero + 기능 소개) ✅
│   │   ├── services/page.tsx      # 서비스 소개 ✅
│   │   └── contact/page.tsx       # 연락처 폼 ✅
│   ├── (auth)/
│   │   ├── login/page.tsx         # 로그인 ✅
│   │   └── signup/page.tsx        # 회원가입 ✅
│   ├── (dashboard)/
│   │   ├── layout.tsx             # 사이드바 레이아웃 ✅
│   │   └── dashboard/
│   │       ├── page.tsx           # 대시보드 (오늘 비행 + 통계) ✅
│   │       ├── schedule/page.tsx  # FullCalendar 스케줄 ✅
│   │       ├── aircraft/
│   │       │   ├── page.tsx       # 비행기 목록 ✅
│   │       │   └── [id]/page.tsx  # 비행기 상세 ✅
│   │       ├── clients/
│   │       │   ├── page.tsx       # 클라이언트 목록 (태그, 검색) ✅
│   │       │   └── [id]/
│   │       │       ├── page.tsx       # 클라이언트 상세 (원장, 예약) ✅
│   │       │       └── pilot-tab.tsx  # 파일럿 정보 탭 ✅
│   │       ├── instructors/
│   │       │   ├── page.tsx       # 교관 목록 ✅
│   │       │   └── [id]/
│   │       │       ├── page.tsx        # 교관 상세 ✅
│   │       │       └── settings-tab.tsx # 교관 설정 (요금, CFI) ✅
│   │       ├── mechanics/
│   │       │   ├── page.tsx       # 정비사 목록 ✅
│   │       │   └── [id]/page.tsx  # 정비사 상세 ✅
│   │       ├── dispatch/
│   │       │   ├── page.tsx       # Dispatch 목록 ✅
│   │       │   └── [id]/page.tsx  # Dispatch 상세 ✅
│   │       ├── invoices/
│   │       │   ├── page.tsx       # 인보이스 목록 ✅
│   │       │   └── [id]/page.tsx  # 인보이스 상세 ✅
│   │       ├── inventory/page.tsx # 파츠/재고 관리 ✅
│   │       ├── chat/page.tsx      # AI 챗봇 ✅
│   │       └── settings/page.tsx  # 설정 ✅
│   ├── print/                     # 인쇄용 레이아웃 ✅
│   │   ├── dispatch/[id]/page.tsx
│   │   └── invoices/[id]/page.tsx
│   └── api/
│       ├── chat/route.ts          # AI 챗봇 (streaming + 7 tools) ✅
│       ├── schedule/route.ts      # 스케줄 CRUD + 충돌 감지 ✅
│       ├── aircraft/
│       │   ├── route.ts           # Aircraft CRUD ✅
│       │   └── reminders/route.ts # 정비 리마인더 ✅
│       ├── clients/
│       │   ├── route.ts           # Client CRUD ✅
│       │   ├── details/route.ts   # 상세 정보 ✅
│       │   ├── tags/route.ts      # 태그 관리 ✅
│       │   ├── ledger/route.ts    # 원장 (충전/결제) ✅
│       │   └── pilot/             # 파일럿 정보 ✅
│       ├── instructors/
│       │   ├── route.ts           # Instructor CRUD ✅
│       │   ├── specialties/route.ts  # 전문 분야 ✅
│       │   ├── settings/route.ts  # 요금/CFI 설정 ✅
│       │   └── assignments/route.ts  # 배정 ✅
│       ├── mechanics/route.ts     # Mechanic CRUD ✅
│       ├── dispatch/
│       │   ├── route.ts           # Dispatch 생성/반납/이력 ✅
│       │   └── detail/route.ts    # Dispatch 상세 조회 ✅
│       ├── invoices/
│       │   ├── route.ts           # Invoice CRUD ✅
│       │   └── [id]/route.ts      # Invoice 상세 ✅
│       ├── inventory/route.ts     # 파츠 주문 관리 ✅
│       ├── maintenance/route.ts   # 정비 작업 ✅
│       ├── upload/route.ts        # 문서 업로드 (정규식 추출) ✅
│       ├── extract/route.ts       # 문서 추출 (Vision AI) ✅
│       ├── documents/route.ts     # 문서 목록 ✅
│       ├── faa/route.ts           # FAA N-number 조회 ✅
│       └── weather/route.ts       # METAR/TAF 조회 ✅
├── components/
│   ├── ui/                        # shadcn/ui 컴포넌트 ✅
│   ├── layout/
│   │   └── sidebar-nav.tsx        # 대시보드 사이드바 ✅
│   ├── aircraft/
│   │   ├── aircraft-form-dialog.tsx   # 비행기 추가/수정 ✅
│   │   ├── reminder-form-dialog.tsx   # 리마인더 추가 ✅
│   │   ├── reminder-progress-bar.tsx  # 리마인더 진행률 ✅
│   │   └── reminders-table.tsx        # 리마인더 테이블 ✅
│   ├── dispatch/
│   │   ├── dispatch-modal.tsx     # Dispatch 모달 (W&B + 날씨) ✅
│   │   └── return-modal.tsx       # 반납 모달 (Hobbs/Tach) ✅
│   ├── schedule/
│   │   └── resource-timeline.tsx  # 리소스 타임라인 ✅
│   └── feature-scroll.tsx         # 홈 기능 스크롤 ✅
├── lib/
│   ├── db/
│   │   ├── index.ts               # Drizzle 클라이언트 ✅
│   │   ├── aircraft.ts            # Aircraft 쿼리 ✅
│   │   ├── schedule.ts            # Schedule 쿼리 ✅
│   │   ├── dispatch.ts            # Dispatch 쿼리 ✅
│   │   ├── profiles.ts            # Profile 쿼리 ✅
│   │   ├── pilot-info.ts          # Pilot 정보 쿼리 ✅
│   │   ├── instructors.ts         # Instructor 쿼리 ✅
│   │   ├── client-details.ts      # Client 상세 쿼리 ✅
│   │   ├── client-ledger.ts       # Client 원장 쿼리 ✅
│   │   ├── invoices.ts            # Invoice 쿼리 ✅
│   │   ├── inventory.ts           # Inventory 쿼리 ✅
│   │   ├── documents.ts           # Document 쿼리 ✅
│   │   ├── reminders.ts           # Reminder 쿼리 ✅
│   │   └── chat.ts                # Chat 기록 쿼리 ✅
│   ├── ai/
│   │   ├── index.ts               # DeepSeek 모델 설정 ✅
│   │   ├── tools.ts               # 7개 AI tools ✅
│   │   └── system-prompt.ts       # 시스템 프롬프트 ✅
│   ├── parsers/
│   │   ├── pdf-parser.ts          # pdfjs-dist 래퍼 ✅
│   │   ├── ocr-parser.ts          # tesseract.js 래퍼 ✅
│   │   └── regex-patterns.ts      # 항공 문서 정규식 ✅
│   ├── external/
│   │   └── weather-api.ts         # Aviation Weather API ✅
│   ├── supabase/
│   │   ├── client.ts              # 브라우저 클라이언트 ✅
│   │   └── server.ts              # 서버 클라이언트 ✅
│   ├── auth.ts                    # 인증 헬퍼 ✅
│   └── utils.ts                   # cn() 등 유틸 ✅
└── db/
    └── schema.ts                  # 16+ 테이블, enum, 인덱스 ✅
```

## Phase 1-A: 주차별 작업 (데이터 파이프라인) — ✅ 완료

### Week 1-2: 문서 추출기

- [x] Python: pdfplumber PDF 파서
- [x] Python: Tesseract OCR 이미지 파서
- [x] 정규식 패턴: W&B 필드 (empty_weight, mtow, fuel, arm 등)
- [x] 정규식 패턴: Medical/Insurance 만료일
- [x] Pydantic 스키마 검증
- [x] CLI: `python main.py --type aircraft --input sample.pdf`
- [x] 웹용 듀얼 모드 추가 (정규식 + Vision AI GPT-4o-mini)

### Week 3: 웹 연동 + DB

- [x] Next.js 프로젝트 + Supabase + Drizzle ORM
- [x] 16+ 테이블 스키마 + 인덱스 (원래 11개 → 확장됨)
- [x] 문서 업로드 API route (PDF → 추출 → JSON 응답) — 듀얼 모드
- [x] FAA API N-number 조회 연동

### Week 4: 실 데이터

- [ ] 의뢰인 fleet 자료 전부 추출 → DB 투입
- [ ] W&B 계산 검증 (실제 데이터로)
- [ ] 샘플 파일럿/학생 데이터 시드

## Phase 1-B: 주차별 작업 (플랫폼) — 🔧 진행 중 (~90%)

### Week 5-6: Auth + 스케줄링 + 자격검증

- [x] Auth (login/signup, 역할별 리다이렉트)
- [ ] TanStack Query 셋업 (캐시 설정) — **미구현, 패키지도 미설치**
- [ ] Sentry 연동 — **미구현**
- [x] 대시보드 레이아웃 + 오늘 비행 요약
- [x] FullCalendar + 이벤트 CRUD
- [x] 예약 시 충돌 감지

### Week 7-8: Aircraft 전체 + Dispatch

- [x] Aircraft 목록 + 추가/수정 Dialog
- [x] Aircraft 상세 페이지
- [x] Aircraft 정비 리마인더 시스템 (추가 기능)
- [x] Dispatch 생성/반납/이력 (Hobbs/Tach 추적)
- [x] Dispatch 날씨 연동 (METAR/TAF)
- [x] Dispatch 인쇄 기능

### Week 9: AI 챗봇 + 인원관리 + 웹사이트

- [x] AI 챗봇 (DeepSeek, streaming, 7개 tools)
- [x] Clients 목록 + 상세 (태그, 원장, 파일럿 정보)
- [x] Instructors 목록 + 상세 (전문분야, 요금, CFI)
- [x] Mechanics 목록 + 상세
- [x] 홈, Services, Contact
- [x] Invoice 시스템 (추가 기능 — CRUD + 인쇄)
- [x] Inventory/파츠 관리 (추가 기능)

### Week 10: 배포 + 최적화

- [ ] TanStack Query 도입 (클라이언트 캐싱)
- [ ] Sentry 에러 모니터링 연동
- [ ] lib/validators/ 중앙화 (현재 로직이 분산됨)
- [ ] 모델 라우터 구현 (현재 DeepSeek 단일 → 복잡도별 분기)
- [ ] FAQ 정적 응답 (AI 비용 절감)
- [ ] Supabase RLS 정책
- [ ] 전체 테스트
- [ ] Vercel 배포
- [ ] 환경 분리 (.env.production)

## AI Agent 설계 원칙

- AI는 절대 직접 행동하지 않음. 항상 사용자 확인.
- AI가 DB 직접 조회 (7개 tools 구현됨).
- 현재 모델: DeepSeek Chat (단일). 향후 복잡도별 라우터 추가 예정.
- 구현된 tools: check_availability, create_booking, get_my_schedule, cancel_booking, get_aircraft_reminders, get_aircraft_status 등
- FAQ 정적 응답: 향후 추가 예정 (현재는 모든 질문이 AI 거침).

## 코딩 규칙

- TypeScript strict mode (웹), Python type hints (추출기)
- DB 쿼리 → lib/db/ 분리 ✅ (14개 파일)
- 문서 파싱 → lib/parsers/ 분리 ✅
- AI 모델 설정 → lib/ai/index.ts 한 곳에서만 ✅
- **DB 인덱스는 schema.ts에 같이 정의** ✅
- Server Component 우선, "use client" 최소화
- env 변수는 .env.local에만
- 커밋: "feat:", "fix:", "refactor:" prefix
- **TODO:** TanStack Query 도입 시 모든 API 호출 감싸기
- **TODO:** lib/validators/ 중앙화 (현재 검증 로직이 API route에 분산)

## 현재 상태 (2026-03-13 업데이트)

- Phase: **Phase 1-B 거의 완료 (~90%)**
- Phase 1-A (데이터 파이프라인): ✅ 완료
- Phase 1-B (플랫폼): 🔧 핵심 기능 전부 구현, 최적화/배포 남음
- 커밋 수: 6개 (initial setup → AI extraction까지)
- AI 모델: DeepSeek Chat (Vercel AI SDK)

### 구현 완료

- Auth + 역할 기반 접근 제어
- 대시보드 (오늘 비행, 통계, 알림)
- FullCalendar 스케줄링 (CRUD + 충돌 감지)
- Aircraft 관리 (CRUD + 리마인더)
- Dispatch 시스템 (W&B + 날씨 + Hobbs/Tach + 인쇄)
- AI 챗봇 (7 tools, streaming)
- Clients 관리 (태그, 원장, 파일럿 정보)
- Instructors 관리 (전문분야, 요금, CFI)
- Mechanics 관리
- Invoice 시스템 (CRUD + 인쇄)
- Inventory/파츠 관리
- 문서 추출 (듀얼: 정규식 무료 + Vision AI)
- FAA N-number 조회
- Weather API (METAR/TAF)
- 퍼블릭 웹사이트 (홈, Services, Contact)

### 남은 작업 (우선순위 순)

1. **실 데이터 투입** — 의뢰인 fleet/파일럿 데이터 추출 → DB
2. **TanStack Query 도입** — 클라이언트 캐싱 (패키지 설치부터)
3. **lib/validators/ 중앙화** — W&B 계산, 자격검증 로직 분리
4. **모델 라우터** — 복잡도별 모델 분기 (DeepSeek + GPT-4o)
5. **FAQ 정적 응답** — AI 비용 절감
6. **Sentry 에러 모니터링**
7. **Supabase RLS** — 행 수준 보안 정책
8. **전체 테스트 + Vercel 배포**
