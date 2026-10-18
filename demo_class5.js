// 1학년 5반 데모 데이터 생성 (차시별 과제에 맞는 코드 + 다건 AI 정서지원/성찰)
// 대시보드 수치(이미지 기준)는 그대로 유지하면서 콘텐츠만 현실적으로 다양화한다.

const POSITIVE_EMOTIONS = ['기대됨', '자신있음', '편안함', '성취감', '즐거움'];
const NEGATIVE_EMOTIONS = ['답답함', '짜증남', '좌절감', '포기하고싶음', '당황스러움', '걱정됨'];

// 학생별 프로필(1차시 변수/자료형 과제용)
const PROFILES = [
  { name: '서연', age: 16, hobby: '음악 감상', food: '떡볶이' },
  { name: '민지', age: 17, hobby: '독서', food: '마라탕' },
  { name: '지우', age: 16, hobby: '웹툰 보기', food: '초밥' },
  { name: '하은', age: 17, hobby: '그림 그리기', food: '피자' },
  { name: '수빈', age: 16, hobby: '배드민턴', food: '치킨' },
  { name: '예은', age: 17, hobby: '영화 감상', food: '파스타' },
  { name: '지민', age: 16, hobby: '베이킹', food: '김밥' },
  { name: '채원', age: 17, hobby: '사진 찍기', food: '라면' },
  { name: '유진', age: 16, hobby: '댄스', food: '햄버거' },
  { name: '소율', age: 17, hobby: '러닝', food: '곱창' },
  { name: '다은', age: 16, hobby: '뜨개질', food: '타코' },
  { name: '가은', age: 17, hobby: '피아노', food: '삼겹살' },
  { name: '나윤', age: 16, hobby: 'K-POP', food: '비빔밥' },
  { name: '도은', age: 17, hobby: '여행', food: '우동' },
  { name: '시은', age: 16, hobby: '요리', food: '샐러드' }
];

// 6·7차시용 서로 다른 실생활 문제(설계 + 구현)
const PROBLEMS = [
  {
    title: 'BMI 계산기',
    design: '# 문제 정의서\n# 문제: 키와 몸무게로 BMI를 계산하고 비만도를 분류한다\n# 입력: 키(cm), 몸무게(kg)\n# 처리: BMI = 몸무게 / (키/100)**2\n# 출력: BMI 값과 저체중/정상/과체중\n# 알고리즘\n# 1. 키, 몸무게를 입력받는다\n# 2. BMI를 계산한다\n# 3. 기준과 비교하여 분류를 출력한다',
    code: 'height = float(input("키(cm): "))\nweight = float(input("몸무게(kg): "))\nbmi = weight / (height/100)**2\nprint("BMI:", round(bmi, 1))\nif bmi < 18.5:\n    print("저체중")\nelif bmi < 23:\n    print("정상")\nelse:\n    print("과체중")'
  },
  {
    title: '용돈 관리 프로그램',
    design: '# 문제 정의서\n# 문제: 이번 달 용돈에서 지출을 빼 남은 금액을 알려준다\n# 입력: 용돈, 사용한 금액\n# 처리: 남은 돈 = 용돈 - 사용한 금액\n# 출력: 남은 용돈과 초과 여부\n# 알고리즘\n# 1. 용돈과 지출을 입력받는다\n# 2. 남은 금액을 계산한다\n# 3. 음수면 초과 경고를 출력한다',
    code: 'allowance = int(input("이번 달 용돈: "))\nspent = int(input("지금까지 쓴 돈: "))\nleft = allowance - spent\nprint("남은 용돈:", left, "원")\nif left < 0:\n    print("용돈을 초과했어요!")\nelse:\n    print("남은 용돈으로 아껴 쓰세요.")'
  },
  {
    title: '세 과목 평균 계산기',
    design: '# 문제 정의서\n# 문제: 국어·영어·수학 점수로 평균과 합격 여부를 판정\n# 입력: 세 과목 점수\n# 처리: 평균 = (국+영+수)/3\n# 출력: 평균과 합격/불합격\n# 알고리즘\n# 1. 세 점수를 입력받는다\n# 2. 평균을 계산한다\n# 3. 60점 이상이면 합격을 출력한다',
    code: 'kor = int(input("국어: "))\neng = int(input("영어: "))\nmath = int(input("수학: "))\navg = (kor + eng + math) / 3\nprint("평균:", round(avg, 1))\nif avg >= 60:\n    print("합격")\nelse:\n    print("불합격")'
  },
  {
    title: '할인가 계산기',
    design: '# 문제 정의서\n# 문제: 원래 가격과 할인율로 할인가를 계산\n# 입력: 가격, 할인율(%)\n# 처리: 할인가 = 가격 * (100-할인율) / 100\n# 출력: 최종 할인가\n# 알고리즘\n# 1. 가격과 할인율을 입력받는다\n# 2. 할인가를 계산한다\n# 3. 결과를 출력한다',
    code: 'price = int(input("원래 가격: "))\nrate = int(input("할인율(%): "))\nfinal = price * (100 - rate) // 100\nprint("할인가:", final, "원")\nprint("절약 금액:", price - final, "원")'
  },
  {
    title: '구구단 출력기',
    design: '# 문제 정의서\n# 문제: 입력한 단의 구구단을 출력\n# 입력: 출력할 단\n# 처리: 1~9를 반복하며 곱셈\n# 출력: 구구단 한 단\n# 알고리즘\n# 1. 단을 입력받는다\n# 2. 1부터 9까지 반복한다\n# 3. 곱셈 결과를 출력한다',
    code: 'dan = int(input("출력할 단: "))\nfor i in range(1, 10):\n    print(dan, "x", i, "=", dan * i)'
  },
  {
    title: '짝수의 합 구하기',
    design: '# 문제 정의서\n# 문제: 1부터 n까지 짝수의 합을 구한다\n# 입력: n\n# 처리: 반복하며 짝수만 누적\n# 출력: 짝수의 합\n# 알고리즘\n# 1. n을 입력받는다\n# 2. 1~n을 반복하며 짝수를 더한다\n# 3. 합을 출력한다',
    code: 'n = int(input("n을 입력하세요: "))\ntotal = 0\nfor i in range(1, n + 1):\n    if i % 2 == 0:\n        total += i\nprint("1부터", n, "까지 짝수의 합:", total)'
  },
  {
    title: '윤년 판별기',
    design: '# 문제 정의서\n# 문제: 입력한 연도가 윤년인지 판별\n# 입력: 연도\n# 처리: 4의 배수이고 100의 배수가 아니거나 400의 배수\n# 출력: 윤년/평년\n# 알고리즘\n# 1. 연도를 입력받는다\n# 2. 윤년 조건을 검사한다\n# 3. 결과를 출력한다',
    code: 'year = int(input("연도: "))\nif (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:\n    print(year, "년은 윤년입니다.")\nelse:\n    print(year, "년은 평년입니다.")'
  },
  {
    title: '섭씨-화씨 변환기',
    design: '# 문제 정의서\n# 문제: 섭씨 온도를 화씨로 변환\n# 입력: 섭씨 온도\n# 처리: 화씨 = 섭씨 * 9/5 + 32\n# 출력: 화씨 온도\n# 알고리즘\n# 1. 섭씨를 입력받는다\n# 2. 변환식을 적용한다\n# 3. 화씨를 출력한다',
    code: 'c = float(input("섭씨 온도: "))\nf = c * 9 / 5 + 32\nprint(c, "도는 화씨", round(f, 1), "도 입니다.")'
  },
  {
    title: '환율 계산기(원→달러)',
    design: '# 문제 정의서\n# 문제: 원화를 달러로 환산\n# 입력: 원화 금액\n# 처리: 달러 = 원화 / 환율\n# 출력: 달러 금액\n# 알고리즘\n# 1. 원화를 입력받는다\n# 2. 환율로 나눈다\n# 3. 달러를 출력한다',
    code: 'won = int(input("원화 금액: "))\nrate = 1350\ndollar = won / rate\nprint(won, "원은", round(dollar, 2), "달러입니다.")'
  },
  {
    title: '세 수 중 최댓값 찾기',
    design: '# 문제 정의서\n# 문제: 세 개의 수 중 가장 큰 수를 찾는다\n# 입력: 세 개의 정수\n# 처리: 비교하며 최댓값 갱신\n# 출력: 가장 큰 수\n# 알고리즘\n# 1. 세 수를 입력받는다\n# 2. 조건문으로 비교한다\n# 3. 최댓값을 출력한다',
    code: 'a = int(input("첫 번째 수: "))\nb = int(input("두 번째 수: "))\nc = int(input("세 번째 수: "))\nbiggest = a\nif b > biggest:\n    biggest = b\nif c > biggest:\n    biggest = c\nprint("가장 큰 수:", biggest)'
  },
  {
    title: '소수 판별기',
    design: '# 문제 정의서\n# 문제: 입력한 수가 소수인지 판별\n# 입력: 정수\n# 처리: 2부터 n-1까지 나눠떨어지는지 검사\n# 출력: 소수 여부\n# 알고리즘\n# 1. 숫자를 입력받는다\n# 2. 약수가 있는지 반복 검사한다\n# 3. 소수 여부를 출력한다',
    code: 'num = int(input("숫자: "))\nis_prime = True\nif num < 2:\n    is_prime = False\nfor i in range(2, num):\n    if num % i == 0:\n        is_prime = False\n        break\nprint(num, "소수 여부:", is_prime)'
  },
  {
    title: '단어 뒤집기',
    design: '# 문제 정의서\n# 문제: 입력한 단어를 거꾸로 출력\n# 입력: 단어\n# 처리: 문자열 슬라이싱으로 뒤집기\n# 출력: 뒤집힌 단어\n# 알고리즘\n# 1. 단어를 입력받는다\n# 2. [::-1]로 뒤집는다\n# 3. 결과를 출력한다',
    code: 'word = input("단어: ")\nreversed_word = word[::-1]\nprint("뒤집은 단어:", reversed_word)\nif word == reversed_word:\n    print("회문(앞뒤가 같은 단어)이에요!")'
  },
  {
    title: '별 삼각형 출력',
    design: '# 문제 정의서\n# 문제: 입력한 줄 수만큼 별 삼각형을 출력\n# 입력: 줄 수\n# 처리: 반복문으로 줄마다 별 개수 증가\n# 출력: 별 삼각형\n# 알고리즘\n# 1. 줄 수를 입력받는다\n# 2. 1~n 반복하며 별을 출력한다',
    code: 'n = int(input("줄 수: "))\nfor i in range(1, n + 1):\n    print("*" * i)'
  },
  {
    title: '거스름돈 동전 계산기',
    design: '# 문제 정의서\n# 문제: 거스름돈을 동전 개수로 나눠 알려준다\n# 입력: 거스름돈 금액\n# 처리: 큰 동전부터 나눗셈과 나머지\n# 출력: 동전별 개수\n# 알고리즘\n# 1. 거스름돈을 입력받는다\n# 2. 500,100,50,10원 순으로 나눈다\n# 3. 각 동전 개수를 출력한다',
    code: 'change = int(input("거스름돈: "))\nfor coin in [500, 100, 50, 10]:\n    print(coin, "원:", change // coin, "개")\n    change = change % coin'
  },
  {
    title: '점수 등급 판정기',
    design: '# 문제 정의서\n# 문제: 점수에 따라 등급과 코멘트를 출력\n# 입력: 점수\n# 처리: 조건문으로 등급 분류\n# 출력: 등급과 코멘트\n# 알고리즘\n# 1. 점수를 입력받는다\n# 2. 범위별로 등급을 판정한다\n# 3. 등급과 코멘트를 출력한다',
    code: 'score = int(input("점수: "))\nif score >= 90:\n    print("A등급 - 아주 우수해요!")\nelif score >= 70:\n    print("B등급 - 잘했어요!")\nelse:\n    print("C등급 - 조금 더 힘내요!")'
  }
];

// 1~5차시 과제에 맞는 코드 생성(세션별로 다른 코드)
function codeForSession(no, profile, problem) {
  switch (no) {
    case 1:
      return {
        type: 'code',
        content: `# 나만의 프로필 카드\nname = "${profile.name}"\nage = ${profile.age}\nschool = "대전여자고등학교"\nhobby = "${profile.hobby}"\nfood = "${profile.food}"\nprint("이름:", name)\nprint("나이:", age)\nprint("학교:", school)\nprint("관심사:", hobby)\nprint("좋아하는 음식:", food)`
      };
    case 2:
      return {
        type: 'code',
        content: `name = input("이름을 입력하세요: ")\nage = int(input("나이를 입력하세요: "))\nprint(f"안녕하세요 {name}님! 내년에는 {age + 1}살이 됩니다.")`
      };
    case 3:
      return {
        type: 'code',
        content: `age = int(input("나이를 입력하세요: "))\nis_teen = age >= 13 and age <= 19\nprint("청소년 요금 대상 여부:", is_teen)`
      };
    case 4:
      return {
        type: 'code',
        content: `score = int(input("점수를 입력하세요: "))\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\nprint("학점:", grade)`
      };
    case 5:
      return {
        type: 'code',
        content: `n = int(input("n을 입력하세요: "))\ntotal = 0\nfor i in range(1, n + 1):\n    total += i\nprint("1부터", n, "까지의 합:", total)\n\nwhile True:\n    word = input("단어 입력(stop 종료): ")\n    if word == "stop":\n        break\n    print("입력한 단어:", word)`
      };
    case 6:
      return { type: 'code', content: `# 주제: ${problem.title}\n${problem.design}` };
    case 7:
      return { type: 'final', content: `# ${problem.title} 구현\n${problem.code}` };
    default:
      return { type: 'code', content: '# 코드' };
  }
}

const FEEDBACK_POS = [
  '[정서지원]\n코드가 잘 실행되어서 뿌듯했죠? 그 성취감이 다음 도전의 힘이 돼요.\n\n[학습전략 제안]\n방금 완성한 코드를 소리내어 설명해보면 개념이 더 단단해져요.\n\n[단계적 힌트]\n• 변수 이름만 보고도 역할이 떠오르는지 확인해보세요.\n• 조금 더 어려운 값으로도 실행해보며 결과를 예측해보세요.',
  '[정서지원]\n오늘 편안하게 잘 따라왔네요! 꾸준함이 가장 큰 실력이에요.\n\n[학습전략 제안]\n이번 개념이 다음 차시와 어떻게 연결될지 미리 떠올려보세요.\n\n[단계적 힌트]\n• 출력 형식을 바꿔 다양한 결과를 만들어보세요.\n• 주석으로 각 줄의 역할을 적어두면 복습에 좋아요.',
  '[정서지원]\n스스로 해결해내는 모습이 멋져요. 자신감을 가져도 좋아요!\n\n[학습전략 제안]\n비슷한 문제를 하나 더 만들어 풀어보면 응용력이 늘어요.\n\n[단계적 힌트]\n• 입력값이 이상할 때는 어떻게 될지 생각해보세요.\n• 코드를 더 짧게 줄일 수 있는지 고민해보세요.'
];
const FEEDBACK_NEG = [
  '[정서지원]\n막히는 부분에서 답답했죠? 그 마음은 열심히 하고 있다는 증거예요. 천천히 함께 봐요.\n\n[학습전략 제안]\n오류 메시지의 마지막 줄부터 읽고, 문제가 된 줄의 위아래를 비교해보세요.\n\n[단계적 힌트]\n• 들여쓰기와 콜론(:)이 빠지지 않았는지 확인해보세요.\n• print()로 중간 값을 출력해 어디까지 정상인지 좁혀보세요.',
  '[정서지원]\n생각대로 안 되어 당황스러웠겠어요. 오류는 누구나 겪는 자연스러운 과정이에요.\n\n[학습전략 제안]\n한 번에 다 고치려 하지 말고, 한 줄씩 실행하며 결과를 확인해보세요.\n\n[단계적 힌트]\n• input()으로 받은 값은 문자열이에요. 계산하려면 int()로 바꿔보세요.\n• 변수 이름의 철자가 정확한지 확인해보세요.',
  '[정서지원]\n포기하고 싶은 순간이 와도, 여기까지 온 것만으로 충분히 잘하고 있어요. 딱 한 줄만 같이 볼까요?\n\n[학습전략 제안]\n문제를 작은 단위로 쪼개서 가장 쉬운 부분부터 해결해보세요.\n\n[단계적 힌트]\n• 조건문은 비교연산자(>=, ==)를 정확히 썼는지 확인하세요.\n• 반복문은 종료 조건이 언젠가 참이 되는지 점검하세요.'
];
const REFLECTIONS = [
  '{t} 활동을 하며 처음엔 헷갈렸지만 직접 코드를 고치면서 이해가 됐다.',
  '{t}에서 오류가 났을 때 AI 피드백을 보고 어디가 틀렸는지 알 수 있었다.',
  '{t}을(를) 끝까지 완성하니 뿌듯했고 다음 차시도 해보고 싶어졌다.',
  '{t} 과제를 하며 변수와 조건을 더 잘 다루게 된 것 같다.',
  '{t}에서 친구들과 결과를 비교하며 더 나은 방법을 찾을 수 있었다.'
];

function generate(db, genId) {
  const pad2 = n => String(n).padStart(2, '0');
  const targetNumbers = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const targetIds = targetNumbers.map(n => `105${pad2(n)}`);
  const targetSet = new Set(targetIds);

  // 1) 로스터 정리(15명)
  const removedIds = db.students
    .filter(s => s.grade === 1 && s.classNo === 5 && !targetSet.has(s.studentId))
    .map(s => s.studentId);
  db.students = db.students.filter(s => !(s.grade === 1 && s.classNo === 5 && !targetSet.has(s.studentId)));
  for (const id of targetIds) {
    if (!db.students.find(s => s.studentId === id)) {
      const num = Number(id.slice(3));
      db.students.push({ studentId: id, grade: 1, classNo: 5, number: num,
        name: `1학년 5반 ${num}번`, group: '실험집단', password: id, mustChangePassword: true });
    }
  }
  db.students.sort((a, b) => a.studentId.localeCompare(b.studentId));

  // 2) 기존 기록 제거(멱등)
  const clearIds = new Set([...targetIds, ...removedIds]);
  const keep = r => !clearIds.has(r.studentId);
  db.emotionChecks = db.emotionChecks.filter(keep);
  db.activities = db.activities.filter(keep);
  db.feedbacks = db.feedbacks.filter(keep);
  db.reflections = db.reflections.filter(keep);
  db.progress = db.progress.filter(keep);
  db.chatLogs = db.chatLogs.filter(keep);

  // 3) 세션 스펙(이미지 수치 유지)
  const SPEC = [
    { no: 1, pos: 15, neg: 0, avg: 3.6, skip: null },
    { no: 2, pos: 13, neg: 2, avg: 3.7, skip: null },
    { no: 3, pos: 12, neg: 2, avg: 3.5, skip: '10515' },
    { no: 4, pos: 12, neg: 3, avg: 3.4, skip: null },
    { no: 5, pos: 11, neg: 3, avg: 3.5, skip: '10516' },
    { no: 6, pos: 9, neg: 6, avg: 3.1, skip: null },
    { no: 7, pos: 10, neg: 5, avg: 3.2, skip: null }
  ];
  const POS = ['성취감', '즐거움', '편안함', '자신있음'];
  const NEG = ['답답함', '당황스러움'];
  const base = Date.now() - 21 * 24 * 3600 * 1000;
  const ts = (no, off) => new Date(base + no * 24 * 3600 * 1000 + off * 3600 * 1000).toISOString();

  const completedBySession = {};
  const valence = {}; // id -> {sessionNo: 'pos'|'neg'}
  targetIds.forEach(id => { completedBySession[id] = []; valence[id] = {}; });

  // 정서 기록 생성
  for (const sp of SPEC) {
    const completers = targetIds.filter(id => id !== sp.skip);
    const total = sp.pos + sp.neg;
    const targetSum = Math.round(sp.avg * total);
    let plus = targetSum - 3 * total;
    completers.forEach((id, idx) => {
      const isPos = idx < sp.pos;
      let intensity = 3;
      if (isPos && plus > 0) { intensity = 4; plus--; }
      const emotion = isPos ? POS[idx % POS.length] : NEG[(idx - sp.pos) % NEG.length];
      db.emotionChecks.push({ id: genId(), studentId: id, sessionNo: sp.no, phase: 'pre',
        emotion: idx % 2 ? '기대됨' : '편안함', intensity: 3, note: '', mode: 'learn',
        reviewRound: null, reviewLabel: null, createdAt: ts(sp.no, 0) });
      db.emotionChecks.push({ id: genId(), studentId: id, sessionNo: sp.no, phase: 'post',
        emotion, intensity, note: '', mode: 'learn',
        reviewRound: null, reviewLabel: null, createdAt: ts(sp.no, 1) });
      completedBySession[id].push(sp.no);
      valence[id][sp.no] = isPos ? 'pos' : 'neg';
    });
  }

  const sessionTitles = {
    1: '데이터와 나를 연결하기', 2: '입력받은 데이터 다루기', 3: '계산하고 비교하여 조건 만들기',
    4: '조건에 따라 다르게 실행하기', 5: '반복 구조로 문제 해결하기',
    6: '일상생활 문제를 프로그램으로 설계하기', 7: '문제 해결 프로그램 구현하기'
  };

  let codeCount = 0, feedbackCount = 0, reflectionCount = 0;
  targetIds.forEach((id, i) => {
    const profile = PROFILES[i % PROFILES.length];
    const problem = PROBLEMS[i % PROBLEMS.length];
    const done = completedBySession[id];

    // 코드: 완료 세션 중 6개(항상 6·7차시 포함) — 총 90건 유지
    let codeSessions;
    if (done.length === 7) {
      const skipEarly = [1, 2, 3, 4, 5][i % 5];
      codeSessions = done.filter(s => s !== skipEarly);
    } else {
      codeSessions = done.slice();
    }
    for (const no of codeSessions) {
      const c = codeForSession(no, profile, problem);
      db.activities.push({ id: genId(), studentId: id, sessionNo: no, type: c.type,
        content: c.content, createdAt: ts(no, 2) });
      codeCount++;
    }

    // 차시별 AI 정서지원 피드백 + 성찰 + 진행상태
    done.forEach((no, k) => {
      const neg = valence[id][no] === 'neg';
      const fb = neg ? FEEDBACK_NEG[(i + k) % FEEDBACK_NEG.length] : FEEDBACK_POS[(i + k) % FEEDBACK_POS.length];
      db.feedbacks.push({ id: genId(), studentId: id, sessionNo: no,
        sourceText: '', feedbackText: fb, tags: [], source: 'llm', createdAt: ts(no, 2) });
      feedbackCount++;

      const rt = REFLECTIONS[(i + k) % REFLECTIONS.length].replace('{t}', sessionTitles[no]);
      db.reflections.push({ id: genId(), studentId: id, sessionNo: no, content: rt, createdAt: ts(no, 3) });
      reflectionCount++;

      db.progress.push({ studentId: id, sessionNo: no,
        steps: ['emotion_pre', 'activity', 'feedback', 'emotion_post'], updatedAt: ts(no, 3) });
    });
  });

  return { removed: removedIds, students: targetIds.length, codeActivities: codeCount,
           feedbacks: feedbackCount, reflections: reflectionCount,
           emotionChecks: db.emotionChecks.filter(e => targetSet.has(e.studentId)).length };
}

module.exports = { generate };
