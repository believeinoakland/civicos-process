// catalog: the toy's check catalogue, a legacy module first in the order (as BIO's legacy-checks).
export function checkList(list) {
  const findings = [];
  if (!Array.isArray(list)) {
    findings.push('not a list');
  } else if (hasDuplicate(list)) {
    findings.push('duplicate');
  }
  return findings;
}

function hasDuplicate(list) {
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
