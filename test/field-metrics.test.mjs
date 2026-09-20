import test from "node:test";
import assert from "node:assert/strict";
import { describeLabPerformance, evaluateCoreWebVitals } from "../src/field-metrics.mjs";

test("classifies good field Core Web Vitals at p75", () => {
  const result = evaluateCoreWebVitals({
    sourceType: "field",
    source: "rum",
    percentile: 75,
    formFactor: "mobile",
    lcpMs: 2400,
    inpMs: 180,
    cls: 0.08,
  });
  assert.equal(result.overall, "good");
  assert.equal(result.metrics.inp.status, "good");
});

test("classifies needs-improvement and poor values deterministically", () => {
  const ni = evaluateCoreWebVitals({ sourceType: "field", percentile: 75, formFactor: "desktop", lcpMs: 3000, inpMs: 300, cls: 0.15 });
  assert.equal(ni.overall, "needs_improvement");

  const poor = evaluateCoreWebVitals({ sourceType: "field", percentile: 75, formFactor: "desktop", lcpMs: 4500, inpMs: 150, cls: 0.05 });
  assert.equal(poor.overall, "poor");
});

test("refuses to present lab data as field CWV", () => {
  assert.throws(() => evaluateCoreWebVitals({ sourceType: "lab", percentile: 75, formFactor: "mobile" }), /field\/RUM/);
  assert.throws(() => evaluateCoreWebVitals({ sourceType: "field", percentile: 95, formFactor: "mobile" }), /75th percentile/);
});

test("lab performance is diagnostic and cannot claim INP directly", () => {
  const lab = describeLabPerformance({ sourceType: "lab", source: "lighthouse", performanceScore: 92, tbtMs: 120 });
  assert.equal(lab.blocking, false);
  assert.equal(lab.lighthouse.tbtMs, 120);
  assert.throws(() => describeLabPerformance({ sourceType: "lab", inpMs: 100 }), /INP/);
});
