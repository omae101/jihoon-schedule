// Vercel 서버리스 함수 — Claude로 유아·초·중 '학습 적기' 공부 상담
// 클라이언트는 API 키를 보지 못함. 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에 보관.

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "아이 나이·상황 총평 2~3문장(따뜻하게)" },
    rightNow: {
      type: "array",
      description: "지금이 시작/집중 적기인 영역",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string", description: "영역 (예: 한글, 영어, 한자, 수학, 독서)" },
          what: { type: "string", description: "지금 무엇을 어떻게 (구체적)" },
          why: { type: "string", description: "왜 지금이 적기인지 짧게" }
        },
        required: ["area", "what", "why"]
      }
    },
    waitFor: {
      type: "array",
      description: "아직 서두르지 않아도 되는 것 (언제쯤 시작이 적당한지)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string" },
          when: { type: "string", description: "언제쯤 시작이 적당한지 + 이유 한 줄" }
        },
        required: ["area", "when"]
      }
    },
    coreFocus: { type: "array", items: { type: "string" }, description: "이 시기에 꼭 챙길 핵심 3~5개" },
    habits: { type: "array", items: { type: "string" }, description: "이 나이대 공부 습관 팁 2~4개" },
    roadmap: { type: "array", items: { type: "string" }, description: "다음 단계로의 로드맵(시기별) 2~4개" },
    encouragement: { type: "string", description: "부모님께 드리는 따뜻한 응원·관점 (3~4문장)" },
    caution: { type: "string", description: "아이마다 발달 속도가 다르다는 참고 주의 문구" }
  },
  required: ["summary", "rightNow", "waitFor", "coreFocus", "habits", "roadmap", "encouragement", "caution"]
};

// 학습 적기(適期) 지식 — 발달 단계별 일반 원리(에버그린). AI에 '우선 근거'로 전달.
const KB = `
[유아·초·중 학습 적기 가이드 — 일반 원리]

■ 큰 원칙
- 발달 적기 존중: 너무 이른 선행은 흥미·정서를 해칠 수 있음. '할 수 있다'와 '지금이 좋다'는 다름.
- 문해력(읽기)이 모든 공부의 토대: 어느 나이든 '책 읽어주기/스스로 읽기'가 1순위.
- 언어 노출은 일찍, 규칙(문법·급수)은 나중: 소리·노래·그림책으로 친해진 뒤 글자·규칙.
- 수학은 위계 학문: 이전 단계 구멍을 메우는 게 선행보다 중요.
- 습관 > 분량: 매일 짧게 꾸준히가 길게 몰아치기보다 낫다.
- 아이마다 속도가 다르다: 또래·형제와 비교 금지. 흥미와 정서가 먼저.

■ 만 3~5세(유아·미취학)
- 놀이·오감·바깥활동 중심. 정서·사회성·기본생활습관이 학습보다 우선.
- 한글: 강요 X. 통글자·환경 속 글자 노출, 읽어주기로 흥미. 떼기 압박 금지.
- 영어: '소리 노출'(노래·영상·짧은 그림책). 알파벳 쓰기/문법 X.
- 수: 일상 속 수 세기·많다/적다·모양·크기 감각.
- 한자: 아직 이르다. 굳이 안 해도 됨.
- 핵심: 매일 책 읽어주기, 손놀이(소근육), 대화로 어휘 늘리기.

■ 만 6~7세(초1 전후)
- 한글 완성·읽기 독립이 최우선 목표.
- 영어: 파닉스(소리-글자 대응) 시작 가능 + 쉬운 리더스 듣기/따라읽기.
- 수학: 10 가르기·모으기, 한 자리 덧·뺄셈, 수 개념 탄탄히.
- 한자: 본격 X(이름·아주 쉬운 글자 정도).
- 습관: 책상에 10~20분 앉기, 연필 바르게 잡기, 매일 같은 시간 루틴.

■ 초등 저학년(2~3학년)
- 읽기 유창성→독해, 어휘 확장(교과 한자어 등장).
- 영어: 파닉스 마무리→리딩·듣기, 사이트워드.
- 수학: 두 자리 연산, 구구단(2~3학년), 받아올림/내림 정확성.
- 한자: 적기 시작(초2~3). 부수·생활한자·교과 한자어 이해 목적(급수 욕심보다 어휘·문해력).
- 핵심: 독서 습관 정착, 받아쓰기·일기로 쓰기 시작.

■ 초등 고학년(4~6학년)
- 독해·요약·글쓰기 본격, 어휘력이 성적 가른다.
- 영어: 리딩 확장 + 기초 문법 시작(보통 5~6학년), 어휘 누적.
- 수학: 분수·소수·비와 비율, 개념 이해 + 서술형. 여기서 구멍 나면 중등이 힘듦.
- 사회·과학: 교과 어휘(한자어) 이해가 관건.
- 습관: 자기주도(계획표·복습), 오답 다시 보기 시작.

■ 중학생(중1~3)
- 영어: 문법·어휘 본격, 독해 지문 길어짐.
- 수학: 개념 위계가 핵심(중등 수학이 고등의 토대). 진도보다 '구멍 없이'.
- 국어: 비문학 독해·어휘, 문학 기초.
- 과학·사회: 개념 이해 위주, 암기보다 원리.
- 시험 공부법(계획·오답노트) 익히기, 자유학기(중1) 때 진로 탐색·독서.
- 진로: 이때부터 관심 분야 탐색 시작(고등 학종·세특의 씨앗).

■ 자주 묻는 적기
- 영어 알파벳/파닉스: 한글을 어느 정도 뗀 뒤(보통 6~7세~초1). 단, 소리·영상 노출은 더 일찍도 좋음.
- 한자: 초2~3부터 생활·교과 한자어 중심(급수 시험은 동기부여용 정도).
- 수학 선행: 현행을 깊고 정확히가 우선. 1학기~1년 정도 예습은 무방하나, 이해 없는 과한 선행은 역효과.
- 독서: 전 연령 1순위. 흥미 책부터, 읽어주기→스스로 읽기.

[전문가 인사이트 — 학습 적기 (이 앱 운영 입시전문가 제공, 목표·기질에 맞춰 calibrate)]
- 성향 우선(대전제): 모든 조언은 아이의 사주·MBTI 성향(이 앱의 '성향 분석' 결과)에 맞춰 강도·방식을 조절한다. 기질·흥미에 안 맞는 획일적 적용은 금지. 부모를 불안하게 하지 말 것.
- 한자(문해력 핵심): 중1부터 교과 어휘가 급증해 문해력·어휘력이 성적을 가른다. 그래서 초등 때 '한자 4~5급' 정도를 따두면 중등 문해력에 큰 도움. (급수 자체가 목적이 아니라 어휘·독해 목적)
- 초등 수학: 사칙연산을 '철저히'(정확성+속도) 반복 숙달. 5~6학년 '분수' 개념이 나오는 단계부터는 '심화'로 철저히 다진다 — 여기가 중등 수학의 갈림길.
- 한국사·통합사회(고등 내신 대비 미리): 2028 고등 내신에서 한국사 8학점·통합사회 8학점으로 국·영·수에 못지않게 비중이 크다. 그래서 초·중등 때 '한국사를 재미있게' 익혀두면 고등 내신에 유리하니 미리미리 흥미를 붙인다.
- 영어(상위권·특목 목표일 때): 외대부고 등 최상위를 목표로 한다면 영어를 일찍 깊게(영어유치원 수준의 노출처럼), '6학년까지 영어책(원서)을 읽을 수 있는 수준'을 목표로 한다. 파닉스는 5~6세에 시작(한글도 병행). ※ 일반 목표라면 무리한 조기 영어는 권하지 않고 흥미·노출 위주로.
- 과학: 초등에는 '실험 위주'로 흥미·호기심을 돋우는 게 핵심. 본격적인 개념 학습은 6학년 겨울방학부터 충분히 돌리면 좋다.
- 톤: 적기를 놓치지 않게 안내하되 아이 기질·흥미를 해치지 않는 선에서. 가정의 목표 수준(상위권 지향 vs 즐겁게)에 따라 조언 강도를 맞춘다.
`;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용돼요." });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았어요." });
  }
  try {
    const b = req.body || {};
    const lines = [];
    if (b.age) lines.push(`자녀 나이(만): ${b.age}세`);
    if (b.stage) lines.push(`현재 단계: ${b.stage}`);
    if (b.concern) lines.push(`부모 관심·고민: ${b.concern}`);
    if (b.current) lines.push(`지금 하는 공부: ${b.current}`);
    if (b.tendency) lines.push(`자녀 성향(이 앱의 사주·MBTI 분석 결과): ${b.tendency}`);
    if (!lines.length) return res.status(400).json({ error: "자녀 나이나 단계를 알려주세요." });

    const payload = {
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      output_config: {
        format: { type: "json_schema", schema: SCHEMA }
      },
      system:
        "당신은 유아·초등·중등 자녀의 '학습 적기(適期)'를 조언하는 따뜻하고 신뢰감 있는 교육 상담가입니다. " +
        "부모가 '우리 아이, 한자는 언제? 영어는 언제 시작? 한글은? 수학 선행은?'처럼 묻는 타이밍 고민에, 아이 나이·단계에 맞춰 " +
        "①지금이 적기인 것 ②아직 기다려도 되는 것 ③이 시기 핵심 ④공부 습관 ⑤다음 단계 로드맵을 구체적으로 안내하세요. " +
        "아래 [참고 지식]을 우선 근거로 삼되, 발달은 아이마다 다르므로 단정·불안 조장은 피하고 흥미·정서·문해력(독서)을 늘 강조하세요. " +
        "과한 선행이나 또래 비교를 부추기지 말고, 부모를 안심시키며 현실적이고 실천 가능한 조언을 주세요. " +
        "자녀 성향(사주·MBTI 분석) 정보가 주어지면, 그 아이의 강점 영역(수리·문해·집중·창의·성실)과 MBTI 학습 스타일, 아침형/밤형 생활리듬에 맞춰 학습 방식·과목 접근·공부 시간대를 구체적으로 개인화하세요. 성향에 맞지 않는 획일적 조언은 피하세요. " +
        "모든 답변은 한국어, 부모가 이해하기 쉽게.\n\n" +
        "[참고 지식]\n" + KB,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "다음 자녀의 학습 적기 상담을 스키마에 맞는 JSON으로만 답하세요.\n\n[자녀 정보]\n" + lines.join("\n") }
          ]
        }
      ]
    };

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "상담 요청이 실패했어요.", detail: t.slice(0, 400) });
    }

    const data = await r.json();
    const textBlock = (data.content || []).find((x) => x.type === "text");
    let result = null;
    if (textBlock) {
      try { result = JSON.parse(textBlock.text); } catch (e) { /* leave null */ }
    }
    return res.status(200).json({ result, raw: textBlock ? textBlock.text : null, usage: data.usage || null });
  } catch (e) {
    return res.status(500).json({ error: e.message || "알 수 없는 오류" });
  }
};
