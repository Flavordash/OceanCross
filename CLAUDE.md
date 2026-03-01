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

| Category         | Technology                     | Note                                                 |
| ---------------- | ------------------------------ | ---------------------------------------------------- |
| Framework        | Next.js 15 (App Router)        | TypeScript strict                                    |
| Styling          | Tailwind CSS + shadcn/ui       |                                                      |
| Database         | Supabase (PostgreSQL)          | Drizzle ORM                                          |
| Auth             | Supabase Auth                  | role: admin, instructor, student, mechanic, customer |
| AI               | Vercel AI SDK (@ai-sdk/openai) | function calling                                     |
| Calendar         | FullCalendar (React)           | DB 연동                                              |
| Data Fetching    | TanStack Query (React Query)   | **캐싱 + 자동 재검증**                               |
| Error Monitoring | Sentry (Free tier)             | **에러 자동 수집**                                   |
| Analytics        | Vercel Analytics               | **성능 모니터링**                                    |
| Hosting          | Vercel                         | GitHub 연동                                          |

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
Week 7-8:  Dispatch W&B 체크 + AI 챗봇
Week 9:    퍼블릭 웹사이트
Week 10:   테스트 + 배포
```

## 문서 → JSON 파이프라인 (AI 없음)

### 웹 업로드 Flow

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

## Database Schema (11 Tables)

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

- id, registration (unique), type, model, year
- status (available|in_maintenance|grounded)
- total_hours, empty_weight, max_takeoff_weight
- max_passengers, fuel_capacity_gallons, useful_load

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

## 확장성 + 비용 최적화 (처음부터 적용)

### 1. 데이터 캐싱 — TanStack Query

```typescript
// 모든 API 호출은 TanStack Query로 감싸기
// 자주 안 바뀌는 데이터 (비행기 목록, W&B) → staleTime 길게
const { data: aircraft } = useQuery({
  queryKey: ["aircraft"],
  queryFn: fetchAircraft,
  staleTime: 5 * 60 * 1000, // 5분간 캐시 (DB 호출 안 함)
});

// 자주 바뀌는 데이터 (오늘 스케줄) → staleTime 짧게
const { data: todayEvents } = useQuery({
  queryKey: ["events", "today"],
  queryFn: fetchTodayEvents,
  staleTime: 30 * 1000, // 30초
});
```

**효과:** DB 쿼리 50% 이상 감소. 사용자 늘어도 DB 부하 안 늘어남.

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

### 4. AI 비용 최적화 — 모델 라우터

```typescript
// src/lib/ai/index.ts — 모델 한 곳에서 관리
export const AI_CONFIG = {
  // 복잡한 작업 (스케줄링, W&B 계산 설명) → GPT-4o
  complex: openai("gpt-4o"),
  // 단순 작업 (FAQ, 상태 조회) → 저렴한 모델
  simple: openai("gpt-4o-mini"), // 나중에 groq('llama-3.3-70b')로 교체
};

// 라우터: 작업 복잡도에 따라 모델 자동 선택
export function selectModel(taskType: string) {
  const complexTasks = ["create_booking", "calculate_wb"];
  return complexTasks.includes(taskType) ? AI_CONFIG.complex : AI_CONFIG.simple;
}
```

**효과:** AI 비용 60-70% 절감. 모델 교체 시 이 파일만 수정.

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

### 6. 에러 모니터링 — Sentry

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

## Web Platform Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── services/
│   │   └── contact/
│   ├── (dashboard)/
│   │   ├── dashboard/         # 오늘 비행 + Dispatch 현황
│   │   ├── schedule/
│   │   ├── aircraft/          # W&B 데이터 + 계산기
│   │   │   └── [id]/          # 비행기 상세 + W&B
│   │   ├── students/
│   │   ├── mechanics/
│   │   ├── credentials/
│   │   ├── upload/            # 문서 업로드 → 자동 추출 → 폼
│   │   └── chat/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── schedule/route.ts
│   │   ├── aircraft/route.ts
│   │   ├── credentials/route.ts
│   │   ├── dispatch/route.ts     # Dispatch W&B 계산
│   │   ├── upload/route.ts       # 문서 업로드 + 추출
│   │   └── faa/route.ts          # FAA N-number 조회
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── calendar/
│   ├── chat/
│   ├── aircraft/
│   │   └── wb-calculator.tsx
│   ├── dispatch/
│   │   └── dispatch-card.tsx     # Dispatch 상태 카드
│   ├── upload/
│   │   └── document-upload.tsx   # 업로드 + 자동채우기 폼
│   └── layout/
├── lib/
│   ├── db/
│   ├── ai/
│   │   ├── index.ts              # 모델 라우터 (한 곳에서 관리)
│   │   ├── tools.ts
│   │   └── system-prompt.ts
│   ├── validators/
│   │   ├── credentials.ts
│   │   ├── wb-calculator.ts      # W&B 계산 (Dispatch + 챗봇 공유)
│   │   └── dispatch.ts           # Dispatch 종합 판정
│   ├── parsers/                  # 문서 파싱 (서버사이드)
│   │   ├── pdf-parser.ts         # pdfplumber 래퍼
│   │   ├── ocr-parser.ts         # Tesseract 래퍼
│   │   └── regex-patterns.ts     # 항공 문서 정규식
│   ├── external/
│   │   └── faa-api.ts            # FAA 등록 데이터 조회
│   ├── cache/                    # TanStack Query 설정
│   │   └── query-config.ts
│   ├── monitoring/
│   │   └── sentry.ts
│   └── utils/
└── db/
    ├── schema.ts                 # 인덱스 포함
    └── migrations/
```

## Phase 1-A: 주차별 작업 (데이터 파이프라인)

### Week 1-2: 문서 추출기

- [ ] Python: pdfplumber PDF 파서
- [ ] Python: Tesseract OCR 이미지 파서
- [ ] 정규식 패턴: W&B 필드 (empty_weight, mtow, fuel, arm 등)
- [ ] 정규식 패턴: Medical/Insurance 만료일
- [ ] Pydantic 스키마 검증
- [ ] CLI: `python main.py --type aircraft --input sample.pdf`
- [ ] 의뢰인 W&B PDF로 테스트 → 추출 정확도 확인

### Week 3: 웹 연동 + DB

- [ ] Next.js 프로젝트 + Supabase + Drizzle ORM
- [ ] 11개 테이블 스키마 + 인덱스 + 마이그레이션
- [ ] 문서 업로드 API route (PDF → 추출 → JSON 응답)
- [ ] 업로드 UI: 파일 드롭 → 자동 폼 채우기 → 확인 → 저장
- [ ] FAA API N-number 조회 연동

### Week 4: 실 데이터

- [ ] 의뢰인 fleet 자료 전부 추출 → DB 투입
- [ ] W&B 계산 검증 (실제 데이터로)
- [ ] 샘플 파일럿/학생 데이터 시드

## Phase 1-B: 주차별 작업 (플랫폼)

### Week 5-6: Auth + 스케줄링 + 자격검증

- [ ] Auth (login/signup, 역할별 리다이렉트)
- [ ] TanStack Query 셋업 (캐시 설정)
- [ ] Sentry 연동
- [ ] 대시보드 레이아웃 + 오늘 비행 요약
- [ ] FullCalendar + 이벤트 CRUD
- [ ] 예약 시 자격 검증 + 충돌 감지
- [ ] Credentials 관리 페이지

### Week 7-8: Dispatch + AI 챗봇

- [ ] Dispatch W&B 자동 계산 (예약 생성/수정 시)
- [ ] Dispatch 카드 (대시보드에 경고 표시)
- [ ] Aircraft 관리 + W&B 계산기
- [ ] AI 챗봇 (streaming, 7개 tools)
- [ ] AI 모델 라우터 (복잡/단순 분리)
- [ ] FAQ 정적 응답

### Week 9: 웹사이트

- [ ] 홈, Services, Contact
- [ ] 모바일 반응형 + SEO

### Week 10: 배포

- [ ] 전체 테스트 + Vercel 배포
- [ ] Supabase RLS
- [ ] 환경 분리 (.env.production)

## AI Agent 설계 원칙

- AI는 절대 직접 행동하지 않음. 항상 사용자 확인.
- AI가 DB 직접 조회.
- 예약 시 자격 검증 + Dispatch W&B 체크 통과 필수.
- 모델 라우터로 비용 최적화 (복잡=GPT-4o, 단순=GPT-4o-mini).
- FAQ는 AI 안 거침.

## 코딩 규칙

- TypeScript strict mode (웹), Python type hints (추출기)
- **모든 API 호출은 TanStack Query로 감싸기** (캐싱 필수)
- DB 쿼리 → lib/db/ 분리
- 자격/W&B 검증 → lib/validators/ 분리 (API + AI tools 공유)
- 문서 파싱 → lib/parsers/ 분리
- AI 모델 설정 → lib/ai/index.ts 한 곳에서만
- **DB 인덱스는 schema.ts에 같이 정의**
- Server Component 우선, "use client" 최소화
- env 변수는 .env.local에만
- 커밋: "feat:", "fix:", "refactor:" prefix

## 현재 상태

- Phase: **Phase 1-A 시작 전**
- 폴더: OceanCross/
- 보유 자료: 비행기 fleet 목록, W&B 문서 (PDF)
- 다음 작업: Week 1 — 문서 추출기 (Python)
