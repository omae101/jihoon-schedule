// 임시 진단용 — 키 값은 절대 노출하지 않고, 존재 여부/길이/접두사만 확인. 진단 후 삭제 예정.
module.exports = async (req, res) => {
  const k = process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    hasKey: !!k,
    length: k ? k.length : 0,
    startsWithSkAnt: k ? k.slice(0, 7) === "sk-ant-" : false,
    trimmedDiffersFromRaw: k ? (k.trim().length !== k.length) : false,
    commit: "f395149-envcheck"
  });
};

// redeploy 122152
