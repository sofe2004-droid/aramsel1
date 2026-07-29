# AI 정서지원 기반 학습지원 프로그램 (파이썬 7차시)

특성화고 여학생 대상 파이썬 프로그래밍 7차시 학습지원 웹 앱입니다.
학생용 화면(번호 로그인 → 차시별 정서체크/실습/AI피드백/성찰)과
교사용 실시간 대시보드(30명 진행현황, 정서 위험 신호 알림)로 구성됩니다.

## 실행 방법 (로컬)

```bash
npm install
npm run seed   # 학생 66명, 7차시 커리큘럼 초기 데이터 생성 (최초 1회)
npm start      # 서버 실행 (http://localhost:3000)
```

## 인터넷 배포 (Render)

이 앱은 Node.js 서버가 필요하므로 GitHub Pages로는 실행할 수 없습니다.
무료 Node 호스팅인 **Render**로 배포합니다.

1. 이 저장소를 GitHub에 올립니다.
2. https://render.com 가입 후 → **New ▸ Blueprint** → 이 저장소 선택
   (저장소의 `render.yaml`을 자동으로 읽어 설정합니다)
3. 환경변수 입력 (Render 대시보드에서 직접):
   - `DATABASE_URL` : PostgreSQL 접속 주소 (아래 "데이터베이스" 참고) — **데이터 보존에 필수**
   - `OPENAI_API_KEY` : OpenAI 챗봇 키
   - `ADMIN_PW` : 교사 대시보드 비밀번호
4. 배포 완료 후 `https://<앱이름>.onrender.com` 으로 접속 (태블릿·PC 모두 가능)

## 데이터베이스 (데이터 유실 방지)

`DATABASE_URL` 환경변수가 있으면 파일 대신 **PostgreSQL**에 저장되어,
재배포·자동 절전(sleep)에도 학생 기록이 안전하게 보존됩니다.
설정하지 않으면 로컬 파일(`data.json`)로 동작합니다(개발용).

**무료 PostgreSQL 발급 — Supabase (권장, 데이터 뷰어 제공):**
1. https://supabase.com 가입 → **New project** 생성 (DB 비밀번호를 정해 기록해 둠)
2. 프로젝트 → **Connect**(상단) 또는 Settings ▸ Database → **Connection string**
3. **Session pooler** 탭의 주소를 사용 (Render 같은 상시 서버에 안정적, IPv4):
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - `<password>` 부분을 1번에서 정한 실제 DB 비밀번호로 교체
4. Render 서비스의 환경변수 `DATABASE_URL`에 붙여넣기 → 재배포
5. 서버 로그에 `저장소: PostgreSQL 모드`가 뜨면 성공
6. 데이터 확인: Supabase → **Table Editor**에서 `app_state` 테이블 열람, CSV 내보내기 가능

> Neon 등 다른 PostgreSQL의 Connection string도 그대로 사용 가능합니다.
> 저장 구조는 `app_state` 테이블에 전체 데이터를 JSONB 한 행으로 보관합니다.

> ⚠️ **교사 비밀번호**: 공개 저장소에서는 `server.js`의 기본값(`4110`)이 노출됩니다.
> Render 환경변수 `ADMIN_PW`에 다른 값을 설정하면 그 값이 우선 적용됩니다.

## 태블릿에서 접속하기

1. 서버를 실행한 PC와 태블릿을 같은 Wi-Fi(같은 네트워크)에 연결합니다.
2. PC의 IP주소를 확인합니다. (Windows: `ipconfig` → IPv4 주소, 보통 `192.168.x.x`)
3. 태블릿 브라우저에서 `http://192.168.x.x:3000` 으로 접속합니다.
4. 학생은 "학생" 탭에서 본인 학번 5자리를 입력해 입장합니다.
5. 교사는 "교사" 탭에서 관리자 ID `admin`을 입력해 대시보드로 이동합니다.

## 기본 세팅

- 학번 체계: 학년(1자리) + 반(2자리) + 번호(2자리) = 5자리. 예) 2학년 1반 1번 → `20101`
- 2학년 1반(1~15번: `20101`~`20115`), 2학년 2반(1~15번: `20201`~`20215`) 총 30명이 기본값으로 등록되어 있습니다.
- 교사 로그인 ID는 `admin`입니다(별도 비밀번호 없음, 학교 내부망 사용을 전제로 한 프로토타입입니다).
- 학생 정보는 `seed.js`의 `buildStudents()`에서 수정 후 `npm run seed -- --force`로 재시드할 수 있습니다(재시드 시 기존 정서/코드/피드백 기록은 초기화됩니다).

## 7차시 구성 (논문 Ⅲ장 반영)

1. 데이터와 나를 연결하기 (변수·자료형)
2. 입력받은 데이터 다루기 (input/print/형변환)
3. 계산하고 비교하여 조건 만들기 (연산자)
4. 조건에 따라 다르게 실행하기 (if/elif/else)
5. 반복 구조로 문제 해결하기 (for/while)
6. 일상생활 문제를 프로그램으로 설계하기 (문제정의·알고리즘)
7. 문제 해결 프로그램 완성하기 (구현·디버깅·성찰)

각 차시는 ① 학습 전 정서체크 → ② 핵심 개념 학습 → ③ 코딩 실습 →
④ 오류/어려움 입력 → ⑤ AI 피드백 → ⑥ 코드 수정 → ⑦ 성찰 및 학습 후
정서체크 순서로 진행되며, 논문의 "차시별 공통 운영 절차"를 그대로 구현했습니다.

## AI 피드백 방식

현재는 외부 API 키 없이 동작하는 **규칙 기반 AI 피드백 엔진**(`ai.js`)을 사용합니다.
입력된 감정과 오류 메시지의 키워드(SyntaxError, IndentationError, NameError 등)를
분석하여 정서지원 메시지 + 학습전략 + 디버깅 힌트를 생성합니다.

추후 ChatGPT/Claude 등 생성형 AI API를 연결하려면 `ai.js`의 `generateFeedback` 함수만
교체하면 됩니다(서버 구조는 변경할 필요가 없습니다).

## 코딩 도우미 챗봇 (OpenAI 연동)

우측 챗봇은 **OpenAI 생성형 AI**로 답변합니다. API 키가 설정되지 않은 경우
자동으로 규칙 기반(FAQ) 답변으로 폴백하므로 키 없이도 동작합니다.

### OpenAI 키 설정 방법

1. https://platform.openai.com/api-keys 에서 API 키를 발급받습니다.
2. 프로젝트 폴더의 `.env.example` 파일을 복사해 `.env` 로 이름을 바꿉니다.
3. `.env` 파일을 열어 본인의 키를 붙여넣습니다:
   ```
   OPENAI_API_KEY=sk-....................
   OPENAI_MODEL=gpt-4o-mini
   ```
4. 서버를 재시작하면 콘솔에 `챗봇: OpenAI 생성형 AI 모드`가 표시됩니다.

- 욕설·프로그래밍 무관 질문은 **API 호출 전에** 서버에서 먼저 차단하여
  불필요한 비용과 악용을 방지합니다(정상 질문만 OpenAI로 전송).
- `.env` 파일은 `.gitignore`에 포함되어 있어 실수로 키가 공유되지 않습니다.
- 챗봇의 성격/규칙은 `chatbot.js`의 `SYSTEM_PROMPT`에서 조정할 수 있습니다.
- 기본 모델 `gpt-4o-mini`는 저렴하고 빠릅니다. 품질을 높이려면 `gpt-4o` 등으로 변경하세요.

## 데이터 저장

별도 DB 설치 없이 `data.json` 파일에 모든 기록(정서체크, 코드, 피드백, 성찰)이 저장됩니다.
연구 종료 후 `data.json`을 열어 학생별 사전·사후 데이터를 추출할 수 있습니다.
