import type { TestContext } from "./context.js";

export interface TestCase {
  id: string; // e.g. "T1-PPE-001-01"
  featureId: string; // e.g. "PPE-001" or "PPE-001+PPE-026"
  tier: 1 | 2 | 3 | 4;
  title: string;
  fn: (ctx: TestContext) => Promise<void>;
}

export interface TestResult {
  id: string;
  featureId: string;
  tier: 1 | 2 | 3 | 4;
  title: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface TestSuite {
  name: string;
  tier: 1 | 2 | 3 | 4;
  tests: TestCase[];
}
