// 브라우저에서 직접 파이썬 코드를 실행하는 모듈 (Pyodide 기반, 서버/설치 불필요)
let pyodideReadyPromise = null;

function ensurePyodide(onStatus) {
  if (!pyodideReadyPromise) {
    if (onStatus) onStatus('⏳ 파이썬 실행 환경을 불러오는 중입니다... (처음 한 번만 시간이 걸려요)');
    pyodideReadyPromise = loadPyodide();
  }
  return pyodideReadyPromise;
}

const ERROR_PATTERNS = [
  {
    re: /SyntaxError/,
    title: '문법 오류 (SyntaxError)',
    what: '코드의 문법(구조) 자체가 파이썬 규칙에 맞지 않아요. 괄호, 콜론( : ), 인용부호가 빠지거나 잘못된 위치에 있을 때 자주 발생해요.',
    approach: ['오류가 표시된 줄과 그 바로 위 줄을 함께 확인하세요.', 'if, for, while, def 문 끝에 콜론( : )이 있는지 확인하세요.', '괄호 ( ), 따옴표 " " 의 개수가 짝이 맞는지 확인하세요.']
  },
  {
    re: /IndentationError/,
    title: '들여쓰기 오류 (IndentationError)',
    what: '파이썬은 들여쓰기로 코드 블록을 구분해요. if/for/while/def 다음 줄은 반드시 일정한 간격으로 들여써야 해요.',
    approach: ['오류가 발생한 줄의 들여쓰기 칸 수를 위/아래 줄과 비교해보세요.', '같은 블록 안에서는 스페이스 개수를 통일하세요(탭과 스페이스를 섞지 마세요).', '에디터에서 보이지 않는 공백을 지우고 다시 들여써보세요.']
  },
  {
    re: /NameError/,
    title: '이름 오류 (NameError)',
    what: '아직 만들어지지 않은(정의되지 않은) 변수나 함수 이름을 사용했어요. 오타인 경우도 많아요.',
    approach: ['오류 메시지에 나온 변수 이름의 철자가 정확한지 확인하세요.', '그 변수를 사용하기 전에 값을 먼저 저장(예: x = 0)했는지 확인하세요.', '변수 이름의 대소문자가 정확히 일치하는지 확인하세요.']
  },
  {
    re: /TypeError/,
    title: '자료형 오류 (TypeError)',
    what: '서로 다른 자료형끼리 연산하려고 할 때 발생해요. 예를 들어 문자열과 숫자를 그냥 더할 수 없어요.',
    approach: ['input()으로 받은 값은 항상 문자열(str)이라는 점을 기억하세요.', '숫자로 계산하려면 int()나 float()로 형변환을 먼저 해보세요.', '연산에 사용된 변수들의 자료형을 print(type(변수))로 확인해보세요.']
  },
  {
    re: /ValueError/,
    title: '값 오류 (ValueError)',
    what: '자료형은 맞지만 변환할 수 없는 값을 변환하려고 할 때 발생해요. 예: int("안녕")',
    approach: ['int()나 float()에 넣는 값이 실제 숫자 형태의 문자열인지 확인하세요.', '사용자 입력값이 비어있거나 숫자가 아닌 경우를 미리 점검해보세요.']
  },
  {
    re: /ZeroDivisionError/,
    title: '0으로 나누기 오류 (ZeroDivisionError)',
    what: '어떤 수를 0으로 나누는 것은 수학적으로 정의되지 않아 오류가 발생해요.',
    approach: ['나누는 값(분모)이 0이 될 수 있는지 확인하세요.', '나누기 전에 if 분모 != 0: 조건으로 미리 점검해보세요.']
  },
  {
    re: /IndexError/,
    title: '인덱스 오류 (IndexError)',
    what: '리스트나 문자열에서 존재하지 않는 위치(인덱스)에 접근하려고 했어요.',
    approach: ['리스트의 길이를 len()으로 확인해보세요.', '인덱스 번호가 0부터 시작한다는 점을 기억하고 범위를 다시 계산해보세요.']
  },
  {
    re: /KeyError/,
    title: '키 오류 (KeyError)',
    what: '딕셔너리(dict)에 존재하지 않는 키로 값을 찾으려고 했어요.',
    approach: ['딕셔너리에 그 키가 실제로 있는지 print(딕셔너리.keys())로 확인해보세요.', '키의 철자나 대소문자가 정확한지 확인하세요.']
  },
  {
    re: /AttributeError/,
    title: '속성 오류 (AttributeError)',
    what: '해당 자료형이 갖고 있지 않은 기능(메서드)을 사용하려고 했어요.',
    approach: ['사용한 변수의 자료형을 print(type(변수))로 확인해보세요.', '메서드 이름의 철자가 정확한지 확인하세요.']
  },
  {
    re: /ModuleNotFoundError|ImportError/,
    title: '모듈 오류 (ModuleNotFoundError)',
    what: '불러오려는 모듈이 이 실습 환경에서 지원되지 않거나 이름이 잘못되었어요.',
    approach: ['이번 차시 실습에서는 별도 모듈 설치 없이 기본 파이썬 문법만으로 해결해보세요.', '모듈 이름의 철자를 다시 확인해보세요.']
  }
];

function matchPattern(errType) {
  return ERROR_PATTERNS.find(p => p.re.test(errType)) || {
    title: `${errType || '알 수 없는'} 오류`,
    what: '예상치 못한 오류가 발생했어요. 아래 원본 오류 메시지의 마지막 줄에 오류 종류와 이유가 나와 있어요.',
    approach: ['원본 오류 메시지의 마지막 줄(오류 종류: 설명)을 천천히 읽어보세요.', '오류가 발생한 줄과 그 위/아래 줄을 함께 점검해보세요.', '오른쪽 코딩 도우미 챗봇에게 오류 메시지를 붙여넣어 물어보세요.']
  };
}

// 파이썬 traceback 마지막 줄(예: "NameError: name 'x' is not defined") 추출
function lastTracebackLine(tbText) {
  const lines = (tbText || '').trim().split('\n').filter(l => l.trim() !== '');
  return lines.length ? lines[lines.length - 1].trim() : '';
}

// 실행 래퍼(<exec>) 프레임을 걸러내고 <string>을 "내 코드"로 바꿔 학생이 보기 쉽게 정리
function cleanTraceback(tbText) {
  if (!tbText) return '';
  const cleaned = tbText.split('\n')
    // 래퍼 exec() 프레임(File "<exec>" 한 줄)은 제거
    .filter(line => !/File "<exec>"/.test(line))
    // 학생 코드 프레임 <string> 은 "내 코드"로 표기
    .map(line => line.replace(/File "<string>"/g, 'File "내 코드"'));
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function runStudentCode(code, outEl) {
  outEl.innerHTML = '';
  outEl.className = 'run-result';
  const status = document.createElement('div');
  status.className = 'muted';
  status.textContent = '⏳ 코드를 실행하는 중입니다...';
  outEl.appendChild(status);

  let pyodide;
  try {
    pyodide = await ensurePyodide(msg => { status.textContent = msg; });
  } catch (e) {
    outEl.innerHTML = '<div class="run-box run-fail">파이썬 실행 환경을 불러오지 못했습니다. 인터넷 연결 상태를 확인하고 다시 시도해주세요.</div>';
    return null;
  }

  // 파이썬 내부에서 traceback을 직접 캡처하여 오류 종류·줄번호·원문을 정확히 받아온다
  pyodide.globals.set('_USER_CODE', code);
  pyodide.runPython([
    'import sys, io, traceback as _tb, builtins as _bi, js as _js',
    '_g = {"__name__": "__main__"}',
    '_saved_stdout = sys.stdout',
    'sys.stdout = io.StringIO()',
    // input() -> 브라우저 입력창(prompt)으로 연결하고, 입력값을 출력에도 표시
    'def _browser_input(prompt=""):',
    '    _p = str(prompt)',
    '    sys.stdout.write(_p)',
    '    _v = _js.window.prompt(_p)',
    '    _v = "" if _v is None else str(_v)',
    '    sys.stdout.write(_v + "\\n")',
    '    return _v',
    '_bi.input = _browser_input',
    '_result = {"err": None, "type": None, "line": None, "msg": None, "out": ""}',
    'try:',
    '    exec(_USER_CODE, _g)',
    'except SyntaxError as _e:',
    '    _result["err"] = _tb.format_exc()',
    '    _result["type"] = type(_e).__name__',
    '    _result["line"] = _e.lineno',
    '    _result["msg"] = str(_e)',
    'except BaseException as _e:',
    '    _result["err"] = _tb.format_exc()',
    '    _result["type"] = type(_e).__name__',
    '    _result["msg"] = str(_e)',
    '    _t = _e.__traceback__',
    '    while _t is not None and _t.tb_next is not None:',
    '        _t = _t.tb_next',
    '    _result["line"] = _t.tb_lineno if _t is not None else None',
    '_result["out"] = sys.stdout.getvalue()',
    'sys.stdout = _saved_stdout'
  ].join('\n'));

  const proxy = pyodide.globals.get('_result');
  const result = proxy.toJs({ dict_converter: Object.fromEntries });
  proxy.destroy();

  const stdout = result.out || '';

  if (!result.err) {
    outEl.innerHTML = `
      <div class="run-box run-ok">
        <div class="run-box-title">✅ 실행 결과</div>
        <pre class="run-output">${escapeForOutput(stdout) || '(출력 결과가 없습니다)'}</pre>
      </div>`;
    return { success: true, stdout };
  }

  const codeLines = code.split('\n');
  const errType = result.type || 'Error';
  const lineNo = result.line || null;
  const rawTraceback = cleanTraceback(result.err || '');
  const lastLine = lastTracebackLine(rawTraceback);
  const pattern = matchPattern(errType);
  const codeLine = lineNo && codeLines[lineNo - 1] !== undefined ? codeLines[lineNo - 1] : null;

  outEl.innerHTML = `
    <div class="run-box run-fail">
      <div class="run-box-title">❌ 오류가 발생했어요</div>
      ${stdout ? `<div class="muted" style="margin-bottom:4px;">오류 전까지 출력된 내용</div><pre class="run-output">${escapeForOutput(stdout)}</pre>` : ''}
      <div class="error-detail">
        <div style="margin-bottom:6px;">
          <span class="badge" style="background:#ffe3e9;color:#d6336c;">${lineNo ? lineNo + '번째 줄' : '줄 번호 미확인'}</span>
          <strong>${pattern.title}</strong>
        </div>
        ${codeLine ? `<div class="muted">문제가 된 코드</div><pre class="example" style="margin:4px 0 10px;">${escapeForOutput(codeLine.trim())}</pre>` : ''}

        <div class="muted">📄 원본 오류 메시지 (파이썬 원문)</div>
        <pre class="run-output" style="background:#3a1420;color:#ffd9e0;">${escapeForOutput(rawTraceback)}</pre>

        <p style="margin-top:10px;"><strong>❓ 왜 이런 오류가 나나요?</strong><br>${pattern.what}</p>
        <p style="margin-bottom:4px;"><strong>🔧 해결 방법</strong></p>
        <ul>${pattern.approach.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
    </div>`;

  return {
    success: false,
    lineNo,
    codeLine: codeLine ? codeLine.trim() : null,
    errorType: errType,
    errorTitle: pattern.title,
    rawError: lastLine,
    rawTraceback
  };
}

function escapeForOutput(str) {
  return (str || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
