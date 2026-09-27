// catalog: the toy's check catalogue, a legacy module first in the order (as BIO's legacy-checks).
export function checkList(list) {
  const findings = [];
  if (!Array.isArray(list)) {
    findings.push('not a list');
  }
  return findings;
}
