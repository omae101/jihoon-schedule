// Vercel 서버리스 함수 — Claude(Opus)로 대학입시 전형분석(조언형)
// 클라이언트는 API 키를 보지 못함. 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에 보관.

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "학생 상황 총평 2~3문장" },
    recommendedTracks: {
      type: "array",
      description: "유리한 전형 (학생부교과/학생부종합/논술/정시 등)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "전형 이름" },
          fit: { type: "string", description: "적합도: 높음/보통/낮음" },
          reason: { type: "string", description: "이유 한두 문장" }
        },
        required: ["name", "fit", "reason"]
      }
    },
    targetBands: {
      type: "array",
      description: "지원 전략 — 대학 수준대(권역/수준)로만, 구체 대학명 단정 금지",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          band: { type: "string", description: "상향/적정/안정" },
          desc: { type: "string", description: "어느 수준대(예: 인서울 중상위권, 지방거점국립 등)와 학과 방향" }
        },
        required: ["band", "desc"]
      }
    },
    strengths: { type: "array", items: { type: "string" }, description: "강점" },
    improvements: { type: "array", items: { type: "string" }, description: "보완점" },
    roadmap: { type: "array", items: { type: "string" }, description: "지금부터 시기별 준비 로드맵" },
    encouragement: { type: "string", description: "끝까지 포기하지 않는 성실함과 회복탄력성을 강조하는 따뜻한 응원 메시지 (3~5문장)" },
    caution: { type: "string", description: "실제 입시는 매년 변동된다는 참고용 주의 문구" }
  },
  required: ["summary", "recommendedTracks", "targetBands", "strengths", "improvements", "roadmap", "encouragement", "caution"]
};

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
    if (b.grade) lines.push(`학년: ${b.grade}`);
    if (b.hsType) lines.push(`고교 유형: ${b.hsType}`);
    if (b.naesin) lines.push(`내신 평균 등급: ${b.naesin}등급`);
    if (b.mock) lines.push(`모의고사 평균 등급: ${b.mock}등급`);
    if (b.track) lines.push(`희망 계열: ${b.track}`);
    if (b.wish) lines.push(`희망 대학·학과: ${b.wish}`);
    if (b.recordSummary) lines.push(`성적 기록 요약: ${b.recordSummary}`);
    if (!lines.length) return res.status(400).json({ error: "분석할 정보가 없어요." });

    const payload = {
      model: "claude-opus-4-8",
      max_tokens: 3000,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: SCHEMA }
      },
      system:
        "당신은 한국 대학입시 전문 컨설턴트입니다. 학생의 내신·모의고사 등급, 고교 유형, 희망 계열을 바탕으로 " +
        "학생부교과·학생부종합·논술·정시 등 어떤 전형이 유리한지, 어느 수준대의 대학을 상향/적정/안정으로 노릴 수 있는지 " +
        "현실적으로 조언하세요. 구체적인 대학명을 단정하지 말고 '인서울 중상위권', '지방거점국립대', '의약계열' 같은 권역·수준으로 안내하세요. " +
        "내신과 모의고사 등급 차이로 수시/정시 유불리를 판단하고, 고교 유형 특성도 반영하세요. " +
        "정보가 부족하면 합리적인 일반 조언을 하되 단정은 피하세요. 모든 답변은 한국어, 학부모·학생이 이해하기 쉽게 작성하세요.\n\n" +
        "【가장 중요한 톤·철학】 분석 전체를 따뜻하고 격려하는 태도로 작성하세요. 한국 입시는 끝까지 가는 멘탈 싸움이고 회복탄력성이 핵심입니다. 다음을 자연스럽게 담으세요: " +
        "①내신은 1·2·3학년이 1:1:1 비율로 반영되니 한 번 성적이 안 나와도 끝까지 절대 포기하면 안 된다. " +
        "②모의고사나 내신이 잘 안 나온다고 학생부종합전형(학종)을 섣불리 버리지 말고, 생활기록부(생기부)를 끝까지 충실히 챙겨야 한다. " +
        "③어느 것 하나 포기하지 않는 성실함이 가장 큰 무기이며, '끝까지 남는 사람이 진짜 성공하는 사람'이다. " +
        "성적이 낮거나 불리한 학생일수록 좌절시키지 말고, 남은 가능성과 구체적 전략을 함께 제시해 희망을 주세요. encouragement 필드에는 이 메시지를 진심 어린 응원으로 담으세요.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "다음 학생의 대학입시 전형 분석을 스키마에 맞는 JSON으로만 답하세요.\n\n" + lines.join("\n") }
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
      return res.status(502).json({ error: "분석 요청이 실패했어요.", detail: t.slice(0, 400) });
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
