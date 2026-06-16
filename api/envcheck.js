// 임시 진단용 — 키 값은 절대 노출하지 않고, 존재 여부/길이/배포 식별만 확인. 진단 후 삭제 예정.
module.exports = async (req, res) => {
  const k = process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    hasKey: !!k,
    length: k ? k.length : 0,
    startsWithSkAnt: k ? k.slice(0, 7) === "sk-ant-" : false,
    deployUrl: process.env.VERCEL_URL || null,
    commitSha: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
    repo: process.env.VERCEL_GIT_REPO_SLUG || null,
    marker: "envcheck-v2"
  });
};

// redeploy check 123608

// final check 130223

// new key check 130621
