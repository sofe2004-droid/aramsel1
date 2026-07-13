// AI 정서지원 + 학습지원 피드백 생성기 (규칙 기반)
// 외부 API 키 없이 동작하도록 설계. OPENAI_API_KEY 환경변수가 설정되면
// 추후 generateFeedback을 교체하여 생성형 AI로 확장 가능.

const EMOTION_RESPONSES = {
  '기대됨': '새로운 내용을 배우는 것에 대한 기대감이 느껴지네요! 그 마음 그대로 오늘 활동을 시작해 볼까요? 😊',
  '자신있음': '자신감 있는 태도 좋아요! 어려운 부분이 나오더라도 지금의 자신감을 잘 기억해두세요.',
  '편안함': '편안한 마음으로 시작하는 것 좋습니다. 차분하게 한 단계씩 진행해봐요.',
  '걱정됨': '새로운 내용에 대한 걱정이 드는 건 자연스러운 감정이에요. 모르는 부분은 AI와 선생님이 함께 도와줄게요. 천천히 해봐요.',
  '당황스러움': '예상치 못한 결과에 당황했군요. 잠깐 멈추고 코드를 한 줄씩 다시 읽어보면 실마리를 찾을 수 있어요.',
  '답답함': '답답한 마음이 드는 건 그만큼 열심히 시도하고 있다는 뜻이에요. 오류 메시지를 함께 천천히 살펴볼까요?',
  '짜증남': '같은 문제가 반복되면 짜증이 날 수 있어요. 잠깐 숨을 고르고, 코드를 처음부터 다시 한 줄씩 점검해봐요. 충분히 잘하고 있어요.',
  '좌절감': '좌절감이 느껴지는 순간이군요. 지금까지 작성한 코드만으로도 이미 많은 것을 시도한 거예요. 작은 단위로 나눠서 다시 도전해봐요.',
  '포기하고싶음': '포기하고 싶은 마음, 충분히 이해돼요. 지금 잠깐 쉬어가도 괜찮아요. 대신 딱 한 줄만 같이 점검해볼까요? 할 수 있어요.',
  '성취감': '코드가 잘 실행되어 성취감을 느꼈다니 정말 멋져요! 이 경험을 기억하고 다음 단계도 자신있게 진행해봐요.',
  '즐거움': '즐겁게 학습하고 있다니 좋습니다! 이 흐름을 이어서 다음 활동도 진행해볼까요?'
};

const CODE_PATTERNS = [
  { re: /SyntaxError/i, tag: '문법오류', hint: 'SyntaxError(문법 오류)가 발생했어요. 괄호, 콜론( : ), 들여쓰기가 모두 올바른지 줄 단위로 확인해보세요.' },
  { re: /IndentationError|들여쓰기/i, tag: '들여쓰기오류', hint: 'IndentationError(들여쓰기 오류)예요. if, for, while, def 다음 줄은 반드시 같은 만큼 들여써야 해요. 스페이스와 탭을 섞어 쓰지 않았는지도 확인해보세요.' },
  { re: /NameError|정의되지 않음|not defined/i, tag: '이름오류', hint: 'NameError가 발생했네요. 변수를 사용하기 전에 값을 먼저 저장(선언)했는지, 이름의 철자가 정확한지 확인해보세요.' },
  { re: /TypeError|자료형/i, tag: '자료형오류', hint: 'TypeError일 가능성이 높아요. 문자열과 숫자를 함께 연산하려면 int(), float(), str()로 자료형을 변환해야 해요.' },
  { re: /ZeroDivisionError|0으로 나누/i, tag: '0으로나누기', hint: 'ZeroDivisionError예요. 나누는 값이 0이 되는 경우가 있는지 조건문으로 미리 점검해보면 좋아요.' },
  { re: /IndexError|인덱스/i, tag: '인덱스오류', hint: 'IndexError예요. 리스트의 범위를 벗어난 위치에 접근하지 않았는지 인덱스 값을 확인해보세요.' },
  { re: /무한루프|멈추지 않/i, tag: '무한루프', hint: '반복문이 멈추지 않는 것 같아요. while문의 조건이 언젠가 거짓(False)이 되는지, 반복 안에서 조건에 영향을 주는 변수가 변하고 있는지 확인해보세요.' },
  { re: /조건문|if/i, tag: '조건문', hint: '조건문을 점검할 때는 비교연산자(==, >=, <=)를 정확히 썼는지, elif와 else의 들여쓰기가 if와 같은 위치인지 확인해보세요.' },
  { re: /반복문|for|while/i, tag: '반복문', hint: '반복문을 점검할 때는 range()의 시작/끝 값, 들여쓰기, 누적 변수의 초기값(예: total = 0)을 다시 살펴보세요.' },
  { re: /출력.*안.*되|결과.*없/i, tag: '출력없음', hint: 'print() 함수가 들여쓰기 블록 안에 잘못 들어가 있어서 실행되지 않을 수 있어요. 들여쓰기 위치를 확인해보세요.' }
];

function pickEmotionMessage(emotion) {
  return EMOTION_RESPONSES[emotion] || '지금 느끼는 감정을 솔직하게 입력해줘서 고마워요. 그 마음을 가지고 차근차근 진행해봐요.';
}

function pickCodeHints(text) {
  if (!text) return [];
  const hints = [];
  for (const p of CODE_PATTERNS) {
    if (p.re.test(text)) hints.push({ tag: p.tag, hint: p.hint });
  }
  return hints;
}

function generateFeedback({ emotion, intensity, errorNote, code, sessionNo }) {
  const emotionMsg = pickEmotionMessage(emotion);
  const combinedText = `${errorNote || ''}\n${code || ''}`;
  const codeHints = pickCodeHints(combinedText);

  let strategy = '문제를 작은 단위로 나누어 한 줄씩 실행 결과를 확인하며 진행해보세요.';
  if (intensity >= 4) {
    strategy = '지금은 잠깐 한 호흡 쉬어가도 좋아요. 그 다음 오류가 발생한 줄 바로 위까지만 다시 실행해보면서 어디서부터 잘못되었는지 좁혀가봐요.';
  } else if (intensity <= 2) {
    strategy = '좋은 흐름이에요. 이 속도를 유지하면서 다음 단계로 진행해봐요.';
  }

  const hintText = codeHints.length
    ? codeHints.map(h => `• ${h.hint}`).join('\n')
    : '• 아직 구체적인 오류 메시지가 없다면, 코드를 한 줄씩 실행하며 어디까지 정상 동작하는지 확인해보세요.';

  const feedbackText =
    `[정서지원]\n${emotionMsg}\n\n` +
    `[학습전략 제안]\n${strategy}\n\n` +
    `[오류/힌트 분석] (${sessionNo}차시)\n${hintText}`;

  return {
    feedbackText,
    tags: codeHints.map(h => h.tag),
    emotionMessage: emotionMsg,
    strategy
  };
}

module.exports = { generateFeedback };
