// 초기 데이터 시딩: 실험집단 학생 30명(번호 1~30) + 7차시 교육과정
const { load, save } = require('./store');

const SESSIONS = [
  {
    no: 1,
    title: '데이터와 나를 연결하기',
    standard: '[프그 02-01] 변수와 자료형의 개념과 특징을 이해하고, 구분하여 지정할 수 있으며, 이들을 사용한 프로그램을 작성할 수 있다.',
    goal: '변수와 자료형의 개념을 이해하고, 개인 데이터를 변수에 저장하여 출력하는 코드를 작성할 수 있다.',
    competencies: ['프로그래밍 학습 준비 역량', '정서 인식 역량', '프로그래밍 자료 처리 역량'],
    concept: '변수(variable)와 파이썬의 주요 자료형(str, int, float, bool)의 개념을 학습합니다. 변수는 데이터를 저장하는 상자와 같으며, 자료형에 따라 저장할 수 있는 값의 종류가 달라집니다.',
    example: 'name = "홍길동"\nage = 17\nheight = 162.5\nis_student = True\nprint(name, age, height, is_student)',
    task: '친구들에게 자신을 소개하는 "나만의 프로필 카드"를 만들어야 합니다. 이름, 나이, 학교, 관심사, 좋아하는 음식 다섯 가지를 변수에 저장하고 화면에 출력하는 프로그램을 완성하세요.',
    taskTemplate: '# TODO ① ~ ⑤ : 본인의 정보를 알맞은 자료형으로 저장해보세요\nname = "?"      # TODO ① 이름을 문자열로 저장하세요\nage = 0          # TODO ② 나이를 정수로 저장하세요\nschool = "?"    # TODO ③ 학교 이름을 문자열로 저장하세요\nhobby = "?"     # TODO ④ 관심사를 문자열로 저장하세요\nfood = "?"      # TODO ⑤ 좋아하는 음식을 문자열로 저장하세요\n\n# 아래 출력 코드는 이미 완성되어 있어요. 수정하지 않아도 됩니다.\nprint("이름:", name)\nprint("나이:", age)\nprint("학교:", school)\nprint("관심사:", hobby)\nprint("좋아하는 음식:", food)\n'
  },
  {
    no: 2,
    title: '입력받은 데이터 다루기',
    standard: '[프그 02-02] 입력과 출력의 기능을 이해하고, 형식을 지정하여 데이터를 입력하고 출력할 수 있다.',
    goal: 'input(), print(), int(), float(), str() 함수를 활용하여 사용자 입력값을 처리하는 프로그램을 작성할 수 있다.',
    competencies: ['프로그래밍 자료 처리 역량', '학습지원 피드백 활용 역량'],
    concept: 'input() 함수는 항상 문자열(str)을 반환합니다. 숫자로 계산하려면 int()나 float()로 형변환(캐스팅)을 해야 합니다.',
    example: 'age = input("나이를 입력하세요: ")\nage = int(age)\nprint("내년 나이는", age + 1, "살입니다.")',
    task: '이름과 나이를 입력받아 "안녕하세요 ○○님! 내년에는 ○살이 됩니다."를 출력하는 프로그램을 완성하세요. input()으로 받은 나이는 문자열이므로, 계산하려면 반드시 형변환이 필요합니다.',
    taskTemplate: '# 아래 입력 코드는 이미 작성되어 있어요\nname = input("이름을 입력하세요: ")\nage = input("나이를 입력하세요: ")\n\n# TODO ① age는 현재 문자열(str)이에요. 계산할 수 있도록 정수로 형변환해보세요.\nage = age\n\n# TODO ② 빈 칸을 채워 "안녕하세요 OO님! 내년에는 OO살이 됩니다."를 출력하세요.\nprint(f"안녕하세요 {name}님! 내년에는 ?살이 됩니다.")\n'
  },
  {
    no: 3,
    title: '계산하고 비교하여 조건 만들기',
    standard: '[프그 02-03] 산술, 비교, 논리 등의 여러 종류의 연산자 의미를 알고 프로그래밍에 적절하게 사용할 수 있다.',
    goal: '산술, 비교, 논리 연산자를 활용하여 계산식과 조건식을 올바르게 작성할 수 있다.',
    competencies: ['프로그래밍 논리 구성 역량', '과제 지속 역량'],
    concept: '산술연산자(+ - * / // % **), 비교연산자(== != >= > < <=), 논리연산자(and or not)를 사용하여 조건을 표현할 수 있습니다.',
    example: 'age = 17\nis_teen = age >= 13 and age <= 19\nprint(is_teen)',
    task: '영화관에서 나이를 입력받아 청소년 요금 대상(13세 이상 19세 이하)인지 판별하는 프로그램을 완성하세요.',
    taskTemplate: '# 아래 입력 코드는 이미 작성되어 있어요\nage = int(input("나이를 입력하세요: "))\n\n# TODO 비교연산자(>=, <=)와 논리연산자(and)를 사용해\n# "13세 이상이고 19세 이하인지"를 판별하는 식을 완성하세요\nis_teen = ?\n\nprint("청소년 요금 대상 여부:", is_teen)   # 이미 작성되어 있어요\n'
  },
  {
    no: 4,
    title: '조건에 따라 다르게 실행하기',
    standard: '[프그 02-04] 순차, 선택, 반복의 제어 구조를 이해하고, 문제 상황에 알맞은 제어 구조를 선택하여 이를 적용한 프로그램을 작성할 수 있다.',
    goal: 'if, elif, else 구조를 활용하여 상황에 따라 다른 결과를 출력하는 프로그램을 작성할 수 있다.',
    competencies: ['조건 구조 활용 문제해결 역량', '프로그램 구현·디버깅 역량'],
    concept: 'if, elif, else 구조를 사용하면 조건에 따라 서로 다른 코드를 실행할 수 있습니다. 들여쓰기(indentation)에 유의해야 합니다.',
    example: 'score = 85\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelse:\n    grade = "C"\nprint(grade)',
    task: '점수를 입력받아 학점을 출력하는 프로그램을 완성하세요. (90점 이상 A, 80점 이상 B, 70점 이상 C, 그 외 F)',
    taskTemplate: '# 아래 입력 코드는 이미 작성되어 있어요\nscore = int(input("점수를 입력하세요: "))\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif ?:                  # TODO ① 70점 이상인 조건을 완성하세요\n    grade = "C"\nelse:\n    grade = ?              # TODO ② 나머지 경우의 학점을 입력하세요\n\nprint("학점:", grade)     # 이미 작성되어 있어요\n'
  },
  {
    no: 5,
    title: '반복 구조로 문제 해결하기',
    standard: '[프그 02-04] 순차, 선택, 반복의 제어 구조를 이해하고, 문제 상황에 알맞은 제어 구조를 선택하여 이를 적용한 프로그램을 작성할 수 있다.',
    goal: 'for문과 while문을 활용하여 반복 출력, 누적 합계, 종료 조건이 포함된 프로그램을 작성할 수 있다.',
    competencies: ['반복 구조 활용 문제해결 역량', '과제 지속 역량'],
    concept: 'for문은 정해진 횟수나 리스트를 순회할 때, while문은 조건이 참인 동안 반복할 때 사용합니다. break와 continue로 흐름을 제어할 수 있습니다.',
    example: 'total = 0\nfor i in range(1, 11):\n    total += i\nprint(total)',
    task: "문제① 1부터 n까지의 누적 합계를 구하는 프로그램을 완성하세요. 문제② 사용자가 'stop'을 입력할 때까지 단어를 계속 입력받는 프로그램을 완성하세요.",
    taskTemplate: '# 문제① 1부터 n까지의 합 구하기 (아래 입력/누적 코드는 이미 작성되어 있어요)\nn = int(input("n을 입력하세요: "))\ntotal = 0\nfor i in range(1, ?):     # TODO ① n까지 포함되도록 범위를 완성하세요\n    total += i\nprint("1부터", n, "까지의 합:", total)\n\n\n# 문제② \'stop\'을 입력하면 멈추는 프로그램 완성하기\nwhile True:\n    word = input("단어를 입력하세요 (멈추려면 stop): ")\n    if word == ?:          # TODO ② 멈추는 조건을 완성하세요\n        break\n    print("입력한 단어:", word)\n'
  },
  {
    no: 6,
    title: '일상생활 문제를 프로그램으로 설계하기',
    standard: '[프그 03-02] 산업 현장에서 필요로 하는 프로그램의 구조를 설계하여 기본 개발 설계서를 작성한 후, 설계된 프로그램의 알고리즘을 작성할 수 있다.',
    goal: '일상생활에서 반복, 계산, 판단이 필요한 문제를 선정하여 입력-처리-출력 구조로 정리할 수 있다.',
    competencies: ['문제 정의 역량', '알고리즘 설계 역량', '학습지원 피드백 활용 역량'],
    concept: '문제를 해결하기 전, 입력값과 처리 과정, 출력값을 먼저 정리하고 순서도나 글로 알고리즘을 표현하는 것이 중요합니다.',
    example: '예: BMI 계산기\n입력: 키, 몸무게\n처리: BMI = 몸무게 / (키*키)\n출력: BMI 값과 비만도 분류',
    task: '자신이 해결하고 싶은 일상생활 문제를 선정하고, 입력-처리-출력 구조와 알고리즘(순서도 또는 글)을 작성하세요.',
    taskTemplate: '# 문제 정의서\n# 문제: \n# 입력: \n# 처리: \n# 출력: \n\n# 알고리즘(순서대로 적어보기)\n# 1.\n# 2.\n# 3.\n'
  },
  {
    no: 7,
    title: '문제 해결 프로그램 구현하기',
    standard: '[프그 03-03] 작성된 설계 프로그램을 프로그래밍 언어를 사용하여 구현할 수 있다.',
    goal: '설계한 일상생활 문제 해결 프로그램을 파이썬으로 구현하고 실행 결과를 확인할 수 있다.',
    competencies: ['프로그램 구현·디버깅 역량', '학습 성찰 역량'],
    concept: '6차시에서 설계한 알고리즘을 실제 파이썬 코드로 옮겨 구현합니다. 변수, 자료형, 연산자, 조건문, 반복문 중 필요한 요소를 조합하여 작성합니다.',
    example: '6차시에서 설계한 입력-처리-출력 구조를 바탕으로 코드를 단계적으로 작성해 봅니다.',
    task: '6차시에 설계한 문제 해결 프로그램을 파이썬 코드로 완성하고 실행 결과를 확인하세요.',
    taskTemplate: '# 6차시에 설계한 알고리즘을 바탕으로 코드를 작성하세요\n\n'
  }
];

// 학번 = 학년(1) + 반(2) + 번호(2) => 예) 2학년 1반 1번 = 20101
// 반 구성: {반번호: 인원수}
const CLASS_CONFIG = [
  { cls: 1, count: 15 },   // 2학년 1반 (20101~20115)
  { cls: 2, count: 15 },   // 2학년 2반 (20201~20215)
  { cls: 6, count: 18 },   // 2학년 6반 (20601~20618)
  { cls: 7, count: 18 }    // 2학년 7반 (20701~20718)
];

function buildStudents() {
  const students = [];
  const grade = 2;
  for (const { cls, count } of CLASS_CONFIG) {
    for (let num = 1; num <= count; num++) {
      const studentId = `${grade}${String(cls).padStart(2, '0')}${String(num).padStart(2, '0')}`;
      students.push({
        studentId,
        grade,
        classNo: cls,
        number: num,
        name: `${grade}학년 ${cls}반 ${num}번`,
        group: '실험집단',
        password: studentId,        // 초기 비밀번호 = 학번
        mustChangePassword: true    // 첫 로그인 시 생년월일 8자리로 변경 강제
      });
    }
  }
  return students;
}

function seed(force) {
  const db = load();
  if (db.students.length > 0 && !force) {
    console.log('이미 시드 데이터가 존재합니다. (force=true로 재시드 가능)');
    return db;
  }
  db.students = buildStudents();
  db.sessions = SESSIONS;
  if (force) {
    db.emotionChecks = [];
    db.activities = [];
    db.feedbacks = [];
    db.reflections = [];
    db.progress = [];
    db.chatLogs = [];
  }
  save();
  console.log(`시드 완료: 학생 ${db.students.length}명, 차시 ${db.sessions.length}개`);
  return db;
}

if (require.main === module) {
  seed(process.argv.includes('--force'));
}

module.exports = { seed, SESSIONS, buildStudents };
