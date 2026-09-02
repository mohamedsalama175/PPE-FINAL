import { TestContext } from "./harness/context.js";
import { getAssertionCount } from "./harness/assertions.js";
import type { TestSuite, TestResult } from "./harness/types.js";

// Tier 1 Suites
import { epic01CatalogSuite } from "./tier1_features/epic01_catalog.test.js";
import { epic02AttributesSuite } from "./tier1_features/epic02_attributes.test.js";
import { epic03ItemGroupsSuite } from "./tier1_features/epic03_item_groups.test.js";
import { epic04LocationsSuite } from "./tier1_features/epic04_locations.test.js";
import { epic05StockSuite } from "./tier1_features/epic05_stock.test.js";
import { epic06KitsSuite } from "./tier1_features/epic06_kits.test.js";
import { epic07IssuancesSuite } from "./tier1_features/epic07_issuances.test.js";
import { epic08EmployeesSuite } from "./tier1_features/epic08_employees.test.js";
import { epic09DashboardsSuite } from "./tier1_features/epic09_dashboards.test.js";
import { epic10AdminSuite } from "./tier1_features/epic10_admin.test.js";

// Tier 2 Suites
import { epic01BoundariesSuite } from "./tier2_boundaries/epic01_boundaries.test.js";
import { epic02BoundariesSuite } from "./tier2_boundaries/epic02_boundaries.test.js";
import { epic03BoundariesSuite } from "./tier2_boundaries/epic03_boundaries.test.js";
import { epic04BoundariesSuite } from "./tier2_boundaries/epic04_boundaries.test.js";
import { epic05BoundariesSuite } from "./tier2_boundaries/epic05_boundaries.test.js";
import { epic06BoundariesSuite } from "./tier2_boundaries/epic06_boundaries.test.js";
import { epic07BoundariesSuite } from "./tier2_boundaries/epic07_boundaries.test.js";
import { epic08BoundariesSuite } from "./tier2_boundaries/epic08_boundaries.test.js";
import { epic09BoundariesSuite } from "./tier2_boundaries/epic09_boundaries.test.js";
import { epic10BoundariesSuite } from "./tier2_boundaries/epic10_boundaries.test.js";

// Tier 3 Suite
import { tier3InteractionsSuite } from "./tier3_interactions/interactions.test.js";

// Tier 4 Suite
import { tier4WorkloadsSuite } from "./tier4_workloads/workloads.test.js";

const allSuites: TestSuite[] = [
  // Tier 1 (250 tests)
  epic01CatalogSuite,
  epic02AttributesSuite,
  epic03ItemGroupsSuite,
  epic04LocationsSuite,
  epic05StockSuite,
  epic06KitsSuite,
  epic07IssuancesSuite,
  epic08EmployeesSuite,
  epic09DashboardsSuite,
  epic10AdminSuite,

  // Tier 2 (250 tests)
  epic01BoundariesSuite,
  epic02BoundariesSuite,
  epic03BoundariesSuite,
  epic04BoundariesSuite,
  epic05BoundariesSuite,
  epic06BoundariesSuite,
  epic07BoundariesSuite,
  epic08BoundariesSuite,
  epic09BoundariesSuite,
  epic10BoundariesSuite,

  // Tier 3 (50 tests)
  tier3InteractionsSuite,

  // Tier 4 (25 tests)
  tier4WorkloadsSuite,
];

async function main() {
  console.log("================================================================================");
  console.log("             PPE MODULE - OPAQUE-BOX E2E TEST RUNNER                            ");
  console.log("================================================================================");

  const ctx = new TestContext();
  const startTime = Date.now();

  try {
    process.stdout.write("Booting Express API and authenticating test personas... ");
    await ctx.start();
    console.log(`Ready on ${ctx.baseUrl}\n`);
  } catch (err: any) {
    console.error("\n[FATAL] Failed to initialize TestContext:", err);
    process.exit(1);
  }

  const results: TestResult[] = [];
  const failures: { suite: string; test: TestResult }[] = [];

  for (const suite of allSuites) {
    console.log(`\n--- [Tier ${suite.tier}] ${suite.name} (${suite.tests.length} tests) ---`);
    for (const test of suite.tests) {
      const testStart = Date.now();
      let passed = true;
      let error: Error | undefined = undefined;

      try {
        await test.fn(ctx);
        const duration = Date.now() - testStart;
        results.push({
          id: test.id,
          featureId: test.featureId,
          tier: test.tier,
          title: test.title,
          passed: true,
          durationMs: duration,
        });
        process.stdout.write(`  ✓ [${test.id}] ${test.title} (${duration}ms)\n`);
      } catch (err: any) {
        passed = false;
        error = err;
        const duration = Date.now() - testStart;
        const res: TestResult = {
          id: test.id,
          featureId: test.featureId,
          tier: test.tier,
          title: test.title,
          passed: false,
          durationMs: duration,
          error,
        };
        results.push(res);
        failures.push({ suite: suite.name, test: res });
        process.stdout.write(`  ✗ [${test.id}] ${test.title} (${duration}ms)\n`);
        console.error(`      Error: ${err.message}`);
      }
    }
  }

  await ctx.stop();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = failures.length;

  const t1 = results.filter((r) => r.tier === 1);
  const t2 = results.filter((r) => r.tier === 2);
  const t3 = results.filter((r) => r.tier === 3);
  const t4 = results.filter((r) => r.tier === 4);

  console.log("\n================================================================================");
  console.log("                        E2E TEST RUN SUMMARY REPORT                             ");
  console.log("================================================================================");
  console.log(`Total Execution Time: ${totalTime}s`);
  console.log(`Total Assertions Verified: ${getAssertionCount()}`);
  console.log(`Total Test Cases Executed: ${totalTests}`);
  console.log(`  - Tier 1 (Feature Coverage):       ${t1.filter((r) => r.passed).length} / ${t1.length} passed`);
  console.log(`  - Tier 2 (Boundary & Corner):      ${t2.filter((r) => r.passed).length} / ${t2.length} passed`);
  console.log(`  - Tier 3 (Cross-Feature Pairwise): ${t3.filter((r) => r.passed).length} / ${t3.length} passed`);
  console.log(`  - Tier 4 (Real-World Workloads):   ${t4.filter((r) => r.passed).length} / ${t4.length} passed`);
  console.log("--------------------------------------------------------------------------------");

  if (failedTests > 0) {
    console.log(`RESULT: FAILED (${failedTests} failures out of ${totalTests} tests)`);
    console.log("\nDetailed Failures:");
    for (const f of failures) {
      console.log(`  - [${f.test.id}] (${f.test.featureId}) in "${f.suite}":`);
      console.log(`      Title: ${f.test.title}`);
      console.log(`      Error: ${f.test.error?.message}`);
    }
    process.exit(1);
  } else {
    console.log(`RESULT: SUCCESS - ALL ${totalTests} TESTS PASSED (100% pass rate)`);
    console.log("================================================================================");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled runner exception:", err);
  process.exit(1);
});
