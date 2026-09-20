export const CORE_WEB_VITAL_THRESHOLDS = Object.freeze({
  lcpMs: { good: 2500, poor: 4000 },
  inpMs: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
});

function classify(value, thresholds) {
  if (!Number.isFinite(value) || value < 0) return "unknown";
  if (value <= thresholds.good) return "good";
  if (value > thresholds.poor) return "poor";
  return "needs_improvement";
}

export function evaluateCoreWebVitals(snapshot) {
  if (!snapshot || snapshot.sourceType !== "field") {
    throw new Error("Core Web Vitals scoring requires field/RUM evidence; lab data must not be represented as field CWV");
  }
  if (snapshot.percentile !== 75) {
    throw new Error("Core Web Vitals evaluation requires the 75th percentile");
  }
  if (!["mobile", "desktop", "all"].includes(snapshot.formFactor)) {
    throw new Error("formFactor must be mobile, desktop, or all");
  }

  const metrics = {
    lcp: { value: snapshot.lcpMs, unit: "ms", status: classify(snapshot.lcpMs, CORE_WEB_VITAL_THRESHOLDS.lcpMs) },
    inp: { value: snapshot.inpMs, unit: "ms", status: classify(snapshot.inpMs, CORE_WEB_VITAL_THRESHOLDS.inpMs) },
    cls: { value: snapshot.cls, unit: "score", status: classify(snapshot.cls, CORE_WEB_VITAL_THRESHOLDS.cls) },
  };
  const states = Object.values(metrics).map((metric) => metric.status);
  const overall = states.includes("unknown")
    ? "unknown"
    : states.includes("poor")
      ? "poor"
      : states.includes("needs_improvement")
        ? "needs_improvement"
        : "good";

  return {
    evidenceType: "field_core_web_vitals",
    source: snapshot.source ?? "unspecified",
    observedAt: snapshot.observedAt ?? null,
    windowDays: snapshot.windowDays ?? null,
    percentile: 75,
    formFactor: snapshot.formFactor,
    metrics,
    overall,
  };
}

export function describeLabPerformance(snapshot) {
  if (!snapshot || snapshot.sourceType !== "lab") throw new Error("Lab snapshot must declare sourceType=lab");
  if (snapshot.inpMs !== undefined) throw new Error("INP must not be claimed as a direct lab metric; use TBT or another lab diagnostic instead");
  return {
    evidenceType: "lab_performance",
    source: snapshot.source ?? "unspecified",
    observedAt: snapshot.observedAt ?? null,
    lighthouse: {
      performanceScore: snapshot.performanceScore ?? null,
      accessibilityScore: snapshot.accessibilityScore ?? null,
      seoScore: snapshot.seoScore ?? null,
      bestPracticesScore: snapshot.bestPracticesScore ?? null,
      tbtMs: snapshot.tbtMs ?? null,
    },
    blocking: false,
    note: "Lab metrics are diagnostics and do not substitute for field Core Web Vitals.",
  };
}
