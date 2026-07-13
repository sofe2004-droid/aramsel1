// 프로그래밍 학습 전용 챗봇 (규칙 기반, 외부 API 키 불필요)
// 욕설/비속어 및 프로그래밍과 무관한 질문은 차단 메시지를 반환합니다.

const PROFANITY = [
  '씨발', '시발', 'ㅅㅂ', '개새끼', '병신', 'ㅄ', '지랄', '꺼져', '죽어',
  '미친놈', '미친년', '새끼', '좆', '자식아', '닥쳐', '걸레', '쓰레기야'
];

function containsProfanity(text) {
  const norm = text.replace(/\s+/g, '');
  return PROFANITY.some(w => norm.includes(w));
}

const TOPIC_KEYWORDS = [
  '파이썬', 'python', '코드', '코딩', '프로그램', '프로그래밍', '변수', '자료형',
  '입력', '출력', 'input', 'print', '연산자', '조건문', 'if', 'elif', 'else',
  '반복문', 'for', 'while', '함수', 'def', '리스트', 'list', '딕셔너리', 'dict',
  '문자열', 'string', 'str', '정수', 'int', '실수', 'float', '불린', 'bool',
  '형변환', '들여쓰기', 'indent', '오류', '에러', 'error', '디버깅', 'debug',
  '알고리즘', 'range', 'break', 'continue', 'true', 'false', '변수명', '문법',
  'syntax', '주석', '결과값', '실행', '예외'
];

function isOnTopic(text) {
  const lower = text.toLowerCase();
  return TOPIC_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

const FAQ = [
  {
    keywords: ['변수', '자료형'],
    answer: '변수는 데이터를 저장하는 상자예요. 예) name = "홍길동" 처럼 = 기호로 값을 저장해요. 자료형은 str(문자열), int(정수), float(실수), bool(참/거짓) 등이 있어요.'
  },
  {
    keywords: ['input', '입력'],
    answer: 'input()으로 받은 값은 항상 문자열(str)이에요! 숫자로 계산하려면 int(input(...)) 처럼 형변환을 함께 해줘야 해요.'
  },
  {
    keywords: ['형변환', 'int(', 'str(', 'float('],
    answer: '형변환은 int(), float(), str() 함수로 할 수 있어요. 예) age = int("17") → 정수 17로 바뀌어요. 숫자가 아닌 문자를 int()에 넣으면 ValueError가 나니 주의하세요.'
  },
  {
    keywords: ['연산자', '비교연산자', '==', '!='],
    answer: '산술연산자: + - * / // % **  /  비교연산자: == != > < >= <= (참/거짓 반환) / 논리연산자: and or not 을 사용해요.'
  },
  {
    keywords: ['조건문', 'if', 'elif', 'else'],
    answer: 'if 조건: 으로 시작하고, 그 다음 줄은 반드시 들여써야 해요. 여러 조건은 elif로, 나머지는 else로 처리해요. 예)\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"'
  },
  {
    keywords: ['반복문', 'for', 'while', 'range'],
    answer: 'for문은 정해진 범위를 반복할 때(예: for i in range(1, 11):), while문은 조건이 참인 동안 반복할 때 사용해요. while문은 조건이 언젠가 거짓이 되어야 무한루프에 빠지지 않아요.'
  },
  {
    keywords: ['무한루프', '멈추지', '안 멈'],
    answer: '무한루프는 while문의 조건이 절대 거짓이 되지 않을 때 발생해요. 반복 안에서 조건과 관련된 변수가 변하고 있는지(예: i += 1) 확인해보세요.'
  },
  {
    keywords: ['들여쓰기', 'indentationerror', 'indent'],
    answer: '파이썬은 들여쓰기로 코드 블록을 구분해요. if/for/while/def 다음 줄은 같은 만큼 들여써야 하고, 스페이스와 탭을 섞어 쓰면 오류가 날 수 있어요.'
  },
  {
    keywords: ['syntaxerror', '문법오류', '문법 오류'],
    answer: 'SyntaxError는 코드 구조 자체가 잘못된 거예요. 콜론( : ), 괄호, 따옴표가 빠지지 않았는지 줄 단위로 확인해보세요.'
  },
  {
    keywords: ['nameerror'],
    answer: 'NameError는 정의되지 않은 변수를 사용했을 때 발생해요. 변수를 쓰기 전에 값을 먼저 저장했는지, 이름의 철자가 정확한지 확인해보세요.'
  },
  {
    keywords: ['typeerror'],
    answer: 'TypeError는 서로 다른 자료형끼리 연산할 때 발생해요. 문자열과 숫자를 더하려면 숫자를 str()로 바꾸거나, 문자열을 int()/float()로 바꿔야 해요.'
  },
  {
    keywords: ['zerodivisionerror', '0으로 나누'],
    answer: 'ZeroDivisionError는 어떤 수를 0으로 나눌 때 발생해요. 나누기 전에 분모가 0인지 if문으로 먼저 확인해보세요.'
  },
  {
    keywords: ['indexerror', '인덱스'],
    answer: 'IndexError는 리스트의 범위를 벗어난 위치에 접근할 때 발생해요. len()으로 리스트 길이를 확인하고 인덱스가 0부터 시작한다는 점을 기억하세요.'
  },
  {
    keywords: ['리스트', 'list'],
    answer: '리스트는 여러 값을 순서대로 담는 자료구조예요. 예) fruits = ["사과", "바나나"]  fruits[0]은 "사과"예요. 추가는 append(), 길이는 len()으로 확인해요.'
  },
  {
    keywords: ['함수', 'def'],
    answer: '함수는 def 함수이름(매개변수): 형태로 만들어요. 반복해서 쓰는 코드를 함수로 만들면 코드가 훨씬 간단해져요. 예)\ndef greet(name):\n    print("안녕,", name)'
  },
  {
    keywords: ['디버깅', 'debug', '오류 찾는 방법', '에러 찾는 방법'],
    answer: '디버깅 팁: ① 오류 메시지의 마지막 줄(오류 종류)을 먼저 읽기 ② 오류가 발생한 줄 번호 확인하기 ③ print()로 변수 값을 중간중간 출력해 어디까지 정상인지 좁혀가기.'
  },
  {
    keywords: ['알고리즘', '설계'],
    answer: '알고리즘 설계는 문제를 입력 → 처리 → 출력 순서로 정리하는 것부터 시작해요. 먼저 어떤 값이 들어오고(입력), 어떤 계산/판단을 하고(처리), 무엇을 보여줄지(출력) 글로 적어보세요.'
  }
];

function findFaqAnswer(text) {
  const lower = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const item of FAQ) {
    const score = item.keywords.filter(k => lower.includes(k.toLowerCase())).length;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? best.answer : null;
}

// FAQ 기반 폴백 답변 (API 키가 없거나 호출 실패 시 사용)
function fallbackAnswer(text) {
  const faqAnswer = findFaqAnswer(text);
  if (faqAnswer) return faqAnswer;
  return '좋은 질문이에요! 조금 더 구체적으로 설명해주면 더 정확히 도와줄 수 있어요. 예를 들어 어떤 코드, 어떤 오류 메시지인지 알려줄래요? 😊';
}

// OpenAI 생성형 AI 호출 (Node 18+ 내장 fetch 사용, 별도 패키지 불필요)
const SYSTEM_PROMPT = [
  '당신은 특성화고 여학생을 위한 파이썬 프로그래밍 학습 도우미 챗봇입니다.',
  '다음 원칙을 반드시 지키세요:',
  '1) 항상 한국어로, 따뜻하고 친근한 반말~존댓말 섞인 다정한 말투로 답합니다.',
  '2) 파이썬/프로그래밍 학습과 관련된 질문에만 답합니다. 그 외 주제(연예인, 게임, 개인적 고민 등)는 정중히 거절하고 프로그래밍 질문을 유도하세요.',
  '3) 정답 코드를 통째로 주기보다, 학생이 스스로 생각할 수 있도록 힌트와 접근 방법 위주로 안내합니다.',
  '4) 오류 질문이면 어떤 종류의 오류인지, 왜 발생하는지, 어떻게 점검하면 되는지 단계적으로 설명합니다.',
  '5) 답변은 3~6문장 이내로 간결하게, 어려운 전문용어는 풀어서 설명합니다.',
  '6) 욕설이나 부적절한 표현에는 응하지 말고 예의를 갖춰 달라고 안내하세요.'
].join('\n');

async function callOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null; // 키 없으면 폴백 사용
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('OpenAI API 오류:', res.status, errText.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    return answer || null;
  } catch (e) {
    console.error('OpenAI 호출 실패:', e.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function answerChat(message) {
  const text = (message || '').trim();
  if (!text) return { answer: '질문을 입력해주세요!', blocked: false };

  // 1단계: 욕설 필터 (API 호출 전 차단하여 비용/악용 방지)
  if (containsProfanity(text)) {
    return {
      answer: '⚠️ 욕설이나 비속어가 포함된 표현에는 답변할 수 없어요. 예의를 갖춰 다시 질문해주면 성심껏 도와드릴게요.',
      blocked: true, reason: 'profanity'
    };
  }
  // 2단계: 비주제 필터 (프로그래밍 무관 질문은 API 호출 전 차단)
  if (!isOnTopic(text)) {
    return {
      answer: '저는 파이썬/프로그래밍 학습을 돕는 챗봇이에요. 프로그래밍과 관련 없는 질문에는 답변하기 어려워요. 변수, 조건문, 반복문, 오류 해결 등 수업 내용과 관련된 질문을 해보세요! 🐍',
      blocked: true, reason: 'offtopic'
    };
  }

  // 3단계: OpenAI 생성형 AI 호출 (실패 시 FAQ 폴백)
  const aiAnswer = await callOpenAI(text);
  if (aiAnswer) {
    return { answer: aiAnswer, blocked: false, source: 'openai' };
  }
  return { answer: fallbackAnswer(text), blocked: false, source: 'fallback' };
}

module.exports = { answerChat };
