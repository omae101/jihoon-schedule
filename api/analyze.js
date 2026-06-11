// Vercel 서버리스 함수 — Claude(Opus) 비전으로 성적표/학습 이미지를 분석
// 클라이언트는 절대 API 키를 보지 못함. 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에 보관.

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    docType: { type: "string", description: "이미지 종류 (예: 성적표, 생활기록부, 모의고사 성적, 기타)" },
    summary: { type: "string", description: "한두 문장 요약" },
    subjects: {
      type: "array",
      description: "과목별 정보 (보이는 것만)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          score: { type: "string", description: "점수/원점수 (없으면 빈 문자열)" },
          grade: { type: "string", description: "등급/석차 (없으면 빈 문자열)" },
          note: { type: "string", description: "특이사항 (없으면 빈 문자열)" }
        },
        required: ["name", "score", "grade", "note"]
      }
    },
    strengths: { type: "array", items: { type: "string" }, description: "강점" },
    weaknesses: { type: "array", items: { type: "string" }, description: "약점/보완점" },
    patterns: { type: "array", items: { type: "string" }, description: "읽어낸 경향/패턴" },
    advice: { type: "string", description: "학습 조언" }
  },
  required: ["docType", "summary", "subjects", "strengths", "weaknesses", "patterns", "advice"]
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
    const body = req.body || {};
    const image = body.image;
    const mediaType = body.mediaType || "image/jpeg";
    if (!image) return res.status(400).json({ error: "이미지가 없어요." });

    const payload = {
      model: "claude-opus-4-8",
      max_tokens: 2000,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA }
      },
      system:
        "당신은 학생의 성적표·생활기록부·모의고사 결과 등 다양한 학습 관련 이미지를 읽고 분석하는 한국 입시 전문가입니다. " +
        "이미지에 실제로 보이는 정보만 정확히 추출하세요. 보이지 않거나 확실하지 않은 값은 추측하지 말고 빈 문자열로 두세요. " +
        "추출한 데이터를 바탕으로 과목별 성취, 강점·약점, 학습 경향(패턴), 구체적 조언을 한국어로 작성하세요.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: "이 이미지를 분석해 스키마에 맞는 JSON으로만 답하세요." }
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
    const textBlock = (data.content || []).find((b) => b.type === "text");
    let result = null;
    if (textBlock) {
      try { result = JSON.parse(textBlock.text); } catch (e) { /* leave null */ }
    }
    return res.status(200).json({ result, raw: textBlock ? textBlock.text : null, usage: data.usage || null });
  } catch (e) {
    return res.status(500).json({ error: e.message || "알 수 없는 오류" });
  }
};
