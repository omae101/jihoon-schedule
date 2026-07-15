// Vercel 서버리스 함수 — 토스페이먼츠 결제 승인(confirm)
// 클라이언트가 결제창에서 결제 성공 후 받은 paymentKey/orderId/amount 를
// 토스 서버에 확인해 실제 결제를 '확정'한다. 이 단계까지 성공해야 진짜 결제 완료.
// 시크릿 키는 절대 클라이언트에 노출하지 않음 → Vercel 환경변수 TOSS_SECRET_KEY 에 보관.
// (환경변수가 없으면 토스 공개 테스트 키로 동작 = 실제 청구 안 됨)

// 상품별 정가(서버 기준). 클라이언트가 금액을 조작해 보내도 여기서 막는다.
// orderId 앞부분(prefix)으로 어떤 상품인지 판별한다. 예: "AI-1736900000abcd"
const PRODUCTS = {
  AI:  { amount: 990,   unlockKey: '__premium' },    // AI 정밀분석
  ADM: { amount: 49000, unlockKey: '__admission' },  // 대학입시 전형분석
  CNS: { amount: 490,   unlockKey: '__counsel' },    // 공부 상담(재상담)
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST만 허용돼요.' });
  }
  try {
    const body = req.body || {};
    const paymentKey = body.paymentKey;
    const orderId = body.orderId;
    const amount = body.amount;
    if (!paymentKey || !orderId || amount == null) {
      return res.status(400).json({ ok: false, error: '결제 정보가 부족해요.' });
    }

    // 상품 판별 + 금액 검증(서버가 기준)
    const prefix = String(orderId).split('-')[0];
    const product = PRODUCTS[prefix];
    if (!product) {
      return res.status(400).json({ ok: false, error: '알 수 없는 상품이에요.' });
    }
    if (Number(amount) !== product.amount) {
      return res.status(400).json({ ok: false, error: '결제 금액이 올바르지 않아요.' });
    }

    // 토스 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const auth = Buffer.from(secretKey + ':').toString('base64');
    const r = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: (data && data.message) || '결제 승인에 실패했어요.',
        code: data && data.code,
      });
    }

    // 승인 성공 → 어떤 이용권을 열어줄지 알려준다
    return res.status(200).json({
      ok: true,
      unlockKey: product.unlockKey,
      orderId: orderId,
      method: data.method,
      approvedAt: data.approvedAt,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: '서버 오류: ' + (e && e.message) });
  }
};
