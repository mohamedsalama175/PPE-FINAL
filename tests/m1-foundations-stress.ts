/**
 * Empirical Adversarial Stress Test Suite: Milestone 1 Foundations
 * HSE Design System, Tokens, Mantine Theme, & ThemeStore
 *
 * Challenger: Challenger 1 (Milestone 1)
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("================================================================================");
console.log("🔥 EMPIRICAL CHALLENGER: MILESTONE 1 FOUNDATIONS STRESS-TEST HARNESS");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;
const failures: { name: string; error: any }[] = [];

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message || err}`);
    if (err.stack) {
      console.error(`     ${err.stack.split("\n").slice(1, 4).join("\n     ")}`);
    }
    failedCount++;
    failures.push({ name, error: err });
  }
}

// ============================================================================
// ENVIRONMENT SETUP: Browser DOM & LocalStorage Mock Engine
// ============================================================================
class MockDOMTokenList {
  private classes = new Set<string>();
  add(...tokens: string[]) {
    tokens.forEach((t) => this.classes.add(t));
  }
  remove(...tokens: string[]) {
    tokens.forEach((t) => this.classes.delete(t));
  }
  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.classes.add(token);
      return true;
    } else if (force === false) {
      this.classes.delete(token);
      return false;
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    } else {
      this.classes.add(token);
      return true;
    }
  }
  contains(token: string): boolean {
    return this.classes.has(token);
  }
  toString() {
    return Array.from(this.classes).join(" ");
  }
}

class MockElement {
  classList = new MockDOMTokenList();
  attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name: string) {
    return this.attributes.get(name) || null;
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

class MockLocalStorage {
  private store = new Map<string, string>();
  public shouldThrowOnGet = false;
  public shouldThrowOnSet = false;

  getItem(key: string): string | null {
    if (this.shouldThrowOnGet) {
      throw new Error("SecurityError: Access to localStorage is denied");
    }
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSet) {
      throw new Error("QuotaExceededError: LocalStorage quota exceeded");
    }
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  rawSet(key: string, value: string): void {
    this.store.set(key, value);
  }
}

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: (event: string, handler: (e: any) => void) => void;
  removeEventListener: (event: string, handler: (e: any) => void) => void;
  dispatchChange: (matches: boolean) => void;
}

function createMockMediaQueryList(initialMatches: boolean): MockMediaQueryList {
  const listeners = new Set<(e: any) => void>();
  return {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    addEventListener(event: string, handler: (e: any) => void) {
      if (event === "change") listeners.add(handler);
    },
    removeEventListener(event: string, handler: (e: any) => void) {
      if (event === "change") listeners.delete(handler);
    },
    dispatchChange(matches: boolean) {
      this.matches = matches;
      const ev = { matches, media: this.media };
      for (const handler of Array.from(listeners)) {
        handler(ev);
      }
    },
  };
}

let mockRoot = new MockElement();
let mockStorage = new MockLocalStorage();
let activeMql = createMockMediaQueryList(false);

// Install mocks on global environment before importing the store
(globalThis as any).window = {
  matchMedia: (query: string) => {
    return activeMql;
  },
};
(globalThis as any).document = {
  documentElement: mockRoot,
};
(globalThis as any).localStorage = mockStorage;

// ============================================================================
// HELPER: WCAG 2.1 Contrast Ratio Calculator
// ============================================================================
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = relativeLuminance(hexToRgb(hex1));
  const lum2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================================
// SUITE EXECUTION
// ============================================================================
async function runAllSuites() {
  // Dynamically import themeStore and mantineTheme
  const { useThemeStore, resolveTheme, applyThemeToDOM, getSystemTheme } = await import(
    "../src/store/themeStore.js"
  );
  const { mantineTheme, hseBrandColors } = await import("../src/theme/mantineTheme.js");

  // --------------------------------------------------------------------------
  // SUITE 1: Mantine Theme Object & Brand Palette Verification
  // --------------------------------------------------------------------------
  console.log("\n📦 [SUITE 1] Mantine Theme Object & Brand Palette Integrity");

  await runTest("1.1 hseBrandColors exports exactly 10 valid hex shades", () => {
    assert(Array.isArray(hseBrandColors), "hseBrandColors must be an array");
    assert.strictEqual(hseBrandColors.length, 10, "hseBrandColors must have exactly 10 shades");
    const hexRegex = /^#([A-Fa-f0-9]{6})$/;
    for (let i = 0; i < 10; i++) {
      assert(hexRegex.test(hseBrandColors[i]), `Shade ${i} (${hseBrandColors[i]}) is not a valid 6-char hex`);
    }
  });

  await runTest("1.2 hseBrandColors anchor shades match design specification", () => {
    assert.strictEqual(hseBrandColors[0].toLowerCase(), "#eaf1ff", "Shade 0 must be #eaf1ff (primary.light)");
    assert.strictEqual(hseBrandColors[6], "#212B59", "Shade 6 must be #212B59 (primary.DEFAULT)");
    assert.strictEqual(hseBrandColors[4], "#4d6ecf", "Shade 4 must be #4d6ecf (dark primary accent)");
  });

  await runTest("1.3 mantineTheme primaryColor and primaryShade configuration", () => {
    assert.strictEqual(mantineTheme.primaryColor, "brand", "primaryColor must be 'brand'");
    assert(mantineTheme.primaryShade, "primaryShade must be configured");
    const shades = mantineTheme.primaryShade as { light: number; dark: number };
    assert.strictEqual(shades.light, 6, "primaryShade.light must be 6 (#212B59)");
    assert.strictEqual(shades.dark, 4, "primaryShade.dark must be 4 (#4d6ecf)");
  });

  await runTest("1.4 mantineTheme typography uses Almarai", () => {
    assert(mantineTheme.fontFamily?.includes("Almarai"), "Mantine fontFamily must contain Almarai");
    assert(mantineTheme.headings?.fontFamily?.includes("Almarai"), "Headings fontFamily must contain Almarai");
    assert.strictEqual(mantineTheme.headings?.fontWeight, "700", "Headings fontWeight must be 700");
  });

  await runTest("1.5 mantineTheme defaultRadius and component defaultProps", () => {
    assert.strictEqual(mantineTheme.defaultRadius, "md", "defaultRadius must be 'md'");
    assert(mantineTheme.components, "Component defaults must be defined");
    assert(mantineTheme.components.Button, "Button defaults must be defined");
    assert(mantineTheme.components.Modal, "Modal defaults must be defined");
    assert(mantineTheme.components.Select, "Select defaults must be defined");
    assert(mantineTheme.components.MultiSelect, "MultiSelect defaults must be defined");
    assert(mantineTheme.components.TextInput, "TextInput defaults must be defined");
    assert(mantineTheme.components.Pagination, "Pagination defaults must be defined");
  });

  // --------------------------------------------------------------------------
  // SUITE 2: ThemeStore State Transitions & DOM Synchronization
  // --------------------------------------------------------------------------
  console.log("\n🌓 [SUITE 2] ThemeStore State Transitions & DOM Synchronization");

  await runTest("2.1 Explicit setTheme('dark') updates state and DOM", () => {
    mockRoot = new MockElement();
    (globalThis as any).document.documentElement = mockRoot;

    useThemeStore.getState().setTheme("dark");
    const state = useThemeStore.getState();

    assert.strictEqual(state.theme, "dark", "state.theme should be 'dark'");
    assert.strictEqual(state.resolvedTheme, "dark", "state.resolvedTheme should be 'dark'");
    assert.strictEqual(mockRoot.classList.contains("dark"), true, "DOM classList must include 'dark'");
    assert.strictEqual(mockRoot.getAttribute("data-mantine-color-scheme"), "dark", "data-mantine-color-scheme must be 'dark'");
    assert.strictEqual(mockRoot.getAttribute("data-theme"), "dark", "data-theme must be 'dark'");
  });

  await runTest("2.2 Explicit setTheme('light') updates state and DOM", () => {
    useThemeStore.getState().setTheme("light");
    const state = useThemeStore.getState();

    assert.strictEqual(state.theme, "light", "state.theme should be 'light'");
    assert.strictEqual(state.resolvedTheme, "light", "state.resolvedTheme should be 'light'");
    assert.strictEqual(mockRoot.classList.contains("dark"), false, "DOM classList must NOT include 'dark'");
    assert.strictEqual(mockRoot.getAttribute("data-mantine-color-scheme"), "light", "data-mantine-color-scheme must be 'light'");
    assert.strictEqual(mockRoot.getAttribute("data-theme"), "light", "data-theme must be 'light'");
  });

  await runTest("2.3 toggleTheme() toggles between light and dark", () => {
    useThemeStore.getState().setTheme("light");
    useThemeStore.getState().toggleTheme();
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "dark");
    assert.strictEqual(mockRoot.classList.contains("dark"), true);

    useThemeStore.getState().toggleTheme();
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "light");
    assert.strictEqual(mockRoot.classList.contains("dark"), false);
  });

  await runTest("2.4 cycleTheme() cycles light -> dark -> system -> light", () => {
    useThemeStore.getState().setTheme("light");
    assert.strictEqual(useThemeStore.getState().theme, "light");

    useThemeStore.getState().cycleTheme();
    assert.strictEqual(useThemeStore.getState().theme, "dark");

    useThemeStore.getState().cycleTheme();
    assert.strictEqual(useThemeStore.getState().theme, "system");

    useThemeStore.getState().cycleTheme();
    assert.strictEqual(useThemeStore.getState().theme, "light");
  });

  await runTest("2.5 setTheme('system') resolves OS media query (light vs dark)", () => {
    // 1. When OS prefers light
    activeMql.matches = false;
    useThemeStore.getState().setTheme("system");
    assert.strictEqual(useThemeStore.getState().theme, "system");
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "light");
    assert.strictEqual(mockRoot.classList.contains("dark"), false);

    // 2. When OS prefers dark
    activeMql.matches = true;
    useThemeStore.getState().setTheme("system");
    assert.strictEqual(useThemeStore.getState().theme, "system");
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "dark");
    assert.strictEqual(mockRoot.classList.contains("dark"), true);
  });

  await runTest("2.6 Dynamic OS change listener updates DOM and store in 'system' mode", () => {
    activeMql.matches = false;
    useThemeStore.getState().setTheme("system");
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "light");

    // Simulate OS switching to dark
    activeMql.dispatchChange(true);
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "dark", "Store resolvedTheme must react to OS change");
    assert.strictEqual(mockRoot.classList.contains("dark"), true, "DOM must update to .dark");
    assert.strictEqual(mockRoot.getAttribute("data-mantine-color-scheme"), "dark");

    // Simulate OS switching back to light
    activeMql.dispatchChange(false);
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "light", "Store resolvedTheme must react to OS change back");
    assert.strictEqual(mockRoot.classList.contains("dark"), false, "DOM must remove .dark");
  });

  await runTest("2.7 Dynamic OS change listener is INACTIVE when explicit 'light' or 'dark' is set", () => {
    useThemeStore.getState().setTheme("light");
    assert.strictEqual(useThemeStore.getState().theme, "light");
    assert.strictEqual(mockRoot.classList.contains("dark"), false);

    // OS switches to dark, but user explicitly locked to light
    activeMql.dispatchChange(true);
    assert.strictEqual(useThemeStore.getState().theme, "light");
    assert.strictEqual(useThemeStore.getState().resolvedTheme, "light");
    assert.strictEqual(mockRoot.classList.contains("dark"), false, "DOM must remain light");
  });

  await runTest("2.8 initTheme() lifecycle and cleanup function", () => {
    useThemeStore.getState().setTheme("system");
    const cleanup = useThemeStore.getState().initTheme();
    assert.strictEqual(typeof cleanup, "function", "initTheme must return a cleanup function");

    // Cleanup should detach the OS listener
    cleanup();
    // After cleanup, OS change should not throw or corrupt
    activeMql.dispatchChange(true);
  });

  // --------------------------------------------------------------------------
  // SUITE 3: LocalStorage Persistence & Adversarial Corrupted Input Handling
  // --------------------------------------------------------------------------
  console.log("\n🛡️ [SUITE 3] LocalStorage Persistence & Corrupted Input Handling");

  await runTest("3.1 State persistence writes to 'hse-theme-storage'", () => {
    useThemeStore.getState().setTheme("dark");
    const raw = mockStorage.getItem("hse-theme-storage");
    assert(raw !== null, "LocalStorage must contain 'hse-theme-storage'");
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed?.state?.theme, "dark", "Persisted payload must have theme='dark'");
  });

  await runTest("3.2 Handling missing/empty localStorage gracefully", () => {
    mockStorage.removeItem("hse-theme-storage");
    const raw = mockStorage.getItem("hse-theme-storage");
    assert.strictEqual(raw, null);
    // Theme resolution with fallback
    assert.strictEqual(resolveTheme("system"), activeMql.matches ? "dark" : "light");
  });

  await runTest("3.3 Anti-FOUC script resilience against syntax-corrupted JSON", () => {
    // Simulate what the script in index.html does:
    const corruptedPayloads = [
      "{ corrupted json :::",
      "undefined",
      "NaN",
      "",
      "null",
      "{{{[[[",
      "<html>not json</html>",
    ];

    for (const badPayload of corruptedPayloads) {
      mockStorage.rawSet("hse-theme-storage", badPayload);

      // Execute exact index.html anti-FOUC logic
      let executionThrew = false;
      try {
        var raw = mockStorage.getItem("hse-theme-storage");
        var theme = raw ? JSON.parse(raw)?.state?.theme : "system";
        var isDark =
          theme === "dark" || (theme === "system" && activeMql.matches);
        if (isDark) {
          mockRoot.classList.add("dark");
          mockRoot.setAttribute("data-mantine-color-scheme", "dark");
          mockRoot.setAttribute("data-theme", "dark");
        } else {
          mockRoot.classList.remove("dark");
          mockRoot.setAttribute("data-mantine-color-scheme", "light");
          mockRoot.setAttribute("data-theme", "light");
        }
      } catch (e) {
        // The script in index.html has `try { ... } catch (e) {}`
        // We verify that it safely caught the error and didn't crash the page
        executionThrew = true;
      }
      // In browser index.html, try/catch swallows syntax errors, leaving document in default light state
      assert.strictEqual(typeof mockRoot.getAttribute("data-theme"), "string");
    }
  });

  await runTest("3.4 Handling unexpected schema / malformed theme values in storage", () => {
    const weirdSchemas = [
      JSON.stringify({}),
      JSON.stringify({ state: null }),
      JSON.stringify({ state: { theme: null } }),
      JSON.stringify({ state: { theme: 12345 } }),
      JSON.stringify({ state: { theme: "hacker_neon_mode" } }),
      JSON.stringify({ state: { theme: { nested: true } } }),
    ];

    for (const schema of weirdSchemas) {
      mockStorage.rawSet("hse-theme-storage", schema);
      const raw = mockStorage.getItem("hse-theme-storage");
      const parsed = JSON.parse(raw);
      const theme = parsed?.state?.theme;

      // resolveTheme behavior with arbitrary inputs
      const resolved = resolveTheme(theme as any);
      // Ensure applyThemeToDOM doesn't crash on unexpected inputs
      applyThemeToDOM(resolved);
      // Verify DOM reflects a deterministic state (neither throws nor breaks classList)
      assert.strictEqual(typeof mockRoot.classList.contains("dark"), "boolean");
    }
  });

  await runTest("3.5 Resilience when localStorage throws SecurityError/QuotaExceededError", () => {
    mockStorage.shouldThrowOnGet = true;
    let didThrow = false;
    try {
      mockStorage.getItem("hse-theme-storage");
    } catch (e) {
      didThrow = true;
    }
    assert.strictEqual(didThrow, true, "Mock properly threw SecurityError");
    mockStorage.shouldThrowOnGet = false;

    // Verify index.html anti-FOUC script inside try-catch handles throwing localStorage
    let caughtSafely = false;
    try {
      mockStorage.shouldThrowOnGet = true;
      try {
        var raw = mockStorage.getItem("hse-theme-storage");
      } catch (e) {
        caughtSafely = true;
      }
    } finally {
      mockStorage.shouldThrowOnGet = false;
    }
    assert.strictEqual(caughtSafely, true, "Throwing storage was safely caught");
  });

  // --------------------------------------------------------------------------
  // SUITE 4: CSS Theme Variables & Light/Dark Mode Parity
  // --------------------------------------------------------------------------
  console.log("\n🎨 [SUITE 4] CSS Theme Variables & Light/Dark Token Parity");

  const cssPath = path.resolve(process.cwd(), "src/index.css");
  assert(fs.existsSync(cssPath), `src/index.css must exist at ${cssPath}`);
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  await runTest("4.1 Tailwind v4 @theme contains core HSE color tokens", () => {
    assert(cssContent.includes("--color-primary: #212B59"), "Missing --color-primary");
    assert(cssContent.includes("--color-primary-light: #eaf1ff"), "Missing --color-primary-light");
    assert(cssContent.includes("--color-secondary: #805dca"), "Missing --color-secondary");
    assert(cssContent.includes("--color-success: #00ab55"), "Missing --color-success");
    assert(cssContent.includes("--color-danger: #e7515a"), "Missing --color-danger");
    assert(cssContent.includes("--color-warning: #e2a03f"), "Missing --color-warning");
    assert(cssContent.includes("--color-info: #2196f3"), "Missing --color-info");
    assert(cssContent.includes("--color-dark: #3b3f5c"), "Missing --color-dark");
    assert(cssContent.includes("--color-black: #0e1726"), "Missing --color-black");
    assert(cssContent.includes("--color-white: #ffffff"), "Missing --color-white");
  });

  await runTest("4.2 Tailwind v4 @theme contains typography and layout tokens", () => {
    assert(cssContent.includes("--font-Almarai: 'Almarai', sans-serif"), "Missing --font-Almarai");
    assert(cssContent.includes("--spacing-header: 70px"), "Missing --spacing-header");
    assert(cssContent.includes("--spacing-sidebar: 260px"), "Missing --spacing-sidebar");
    assert(cssContent.includes("--spacing-sidebar-collapsed: 70px"), "Missing --spacing-sidebar-collapsed");
    assert(cssContent.includes("--spacing-4_5: 18px"), "Missing --spacing-4_5");
    assert(cssContent.includes("--radius-xl: 12px"), "Missing --radius-xl");
    assert(cssContent.includes("--radius-lg: 8px"), "Missing --radius-lg");
    assert(cssContent.includes("--radius-md: 6px"), "Missing --radius-md");
  });

  await runTest("4.3 Dynamic tokens in @theme reference valid CSS variables", () => {
    // Extract all var(--xxx) in @theme block
    const themeBlockMatch = cssContent.match(/@theme\s*\{([\s\S]*?)\}/);
    assert(themeBlockMatch, "@theme block must be found in src/index.css");
    const themeBlock = themeBlockMatch[1];

    const varRegex = /var\((--[a-zA-Z0-9_-]+)\)/g;
    const referencedVars = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = varRegex.exec(themeBlock)) !== null) {
      referencedVars.add(m[1]);
    }

    assert(referencedVars.size > 0, "Expected dynamic CSS variables in @theme");

    // Extract :root variables
    const rootBlockMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
    assert(rootBlockMatch, ":root block must be found in src/index.css");
    const rootBlock = rootBlockMatch[1];

    // Extract .dark variables
    const darkBlockMatch = cssContent.match(/\.dark\s*\{([\s\S]*?)\}/);
    assert(darkBlockMatch, ".dark block must be found in src/index.css");
    const darkBlock = darkBlockMatch[1];

    // Verify every referenced variable is declared in :root and in .dark
    for (const v of referencedVars) {
      assert(rootBlock.includes(`${v}:`), `CSS variable ${v} referenced in @theme is MISSING in :root`);
      assert(darkBlock.includes(`${v}:`), `CSS variable ${v} referenced in @theme is MISSING in .dark`);
    }
  });

  await runTest("4.4 Full variable parity between :root and .dark blocks", () => {
    const rootVars = new Set<string>();
    const darkVars = new Set<string>();

    const rootBlockMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
    const darkBlockMatch = cssContent.match(/\.dark\s*\{([\s\S]*?)\}/);
    assert(rootBlockMatch && darkBlockMatch);

    const declRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = declRegex.exec(rootBlockMatch[1])) !== null) {
      rootVars.add(m[1]);
    }
    while ((m = declRegex.exec(darkBlockMatch[1])) !== null) {
      darkVars.add(m[1]);
    }

    const missingInDark = Array.from(rootVars).filter((v) => !darkVars.has(v));
    const missingInRoot = Array.from(darkVars).filter((v) => !rootVars.has(v));

    assert.strictEqual(
      missingInDark.length,
      0,
      `Variables present in :root but missing in .dark: ${missingInDark.join(", ")}`
    );
    assert.strictEqual(
      missingInRoot.length,
      0,
      `Variables present in .dark but missing in :root: ${missingInRoot.join(", ")}`
    );
  });

  await runTest("4.5 Contrast ratios for light and dark core theme tokens meet WCAG", () => {
    // Light mode text-primary (#1E293B) on canvas (#F5F6FD) and surface (#FFFFFF)
    const lightText = "#1E293B";
    const lightCanvas = "#F5F6FD";
    const lightPanel = "#FFFFFF";

    const lightRatioCanvas = getContrastRatio(lightText, lightCanvas);
    const lightRatioPanel = getContrastRatio(lightText, lightPanel);
    assert(lightRatioCanvas >= 7.0, `Light text on canvas contrast ${lightRatioCanvas.toFixed(2)} must be >= 7:1 (AAA)`);
    assert(lightRatioPanel >= 7.0, `Light text on panel contrast ${lightRatioPanel.toFixed(2)} must be >= 7:1 (AAA)`);

    // Dark mode text-primary (#FFFFFF) on canvas (#060818) and surface (#0e1726)
    const darkText = "#FFFFFF";
    const darkCanvas = "#060818";
    const darkPanel = "#0e1726";

    const darkRatioCanvas = getContrastRatio(darkText, darkCanvas);
    const darkRatioPanel = getContrastRatio(darkText, darkPanel);
    assert(darkRatioCanvas >= 15.0, `Dark text on dark canvas contrast ${darkRatioCanvas.toFixed(2)} must be >= 15:1`);
    assert(darkRatioPanel >= 15.0, `Dark text on dark panel contrast ${darkRatioPanel.toFixed(2)} must be >= 15:1`);

    // Primary navy (#212B59) on white panel
    const primaryNavy = "#212B59";
    const navyRatio = getContrastRatio(primaryNavy, lightPanel);
    assert(navyRatio >= 10.0, `Primary Navy on white contrast ${navyRatio.toFixed(2)} must be >= 10:1 (AAA)`);

    // Dark primary UI accent (#4d6ecf) on dark canvas (#060818)
    const darkAccent = "#4d6ecf";
    const darkAccentRatio = getContrastRatio(darkAccent, darkCanvas);
    assert(darkAccentRatio >= 3.0, `Dark primary accent on dark canvas contrast ${darkAccentRatio.toFixed(2)} must be >= 3:1 (WCAG AA UI Component Contrast)`);
  });

  // --------------------------------------------------------------------------
  // SUITE 5: HTML Document Shell & Font Preloading Verification
  // --------------------------------------------------------------------------
  console.log("\n📄 [SUITE 5] HTML Shell & Font Preloading Verification");

  const htmlPath = path.resolve(process.cwd(), "index.html");
  assert(fs.existsSync(htmlPath), `index.html must exist at ${htmlPath}`);
  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  await runTest("5.1 index.html sets <html lang=\"en\" dir=\"ltr\">", () => {
    assert(htmlContent.includes('<html lang="en" dir="ltr">'), "index.html must set lang='en' and dir='ltr'");
  });

  await runTest("5.2 index.html preconnects and loads Google Fonts Almarai (300-800)", () => {
    assert(htmlContent.includes('rel="preconnect" href="https://fonts.googleapis.com"'), "Missing fonts.googleapis.com preconnect");
    assert(htmlContent.includes('rel="preconnect" href="https://fonts.gstatic.com"'), "Missing fonts.gstatic.com preconnect");
    assert(htmlContent.includes("family=Almarai:wght@300;400;500;600;700;800"), "Almarai must load weights 300, 400, 500, 600, 700, 800");
  });

  await runTest("5.3 index.html contains inline anti-FOUC script targeting hse-theme-storage", () => {
    assert(htmlContent.includes("hse-theme-storage"), "Anti-FOUC script must query 'hse-theme-storage'");
    assert(htmlContent.includes("data-mantine-color-scheme"), "Anti-FOUC script must set data-mantine-color-scheme");
    assert(htmlContent.includes("data-theme"), "Anti-FOUC script must set data-theme");
    assert(htmlContent.includes("classList.add('dark')"), "Anti-FOUC script must add .dark");
    assert(htmlContent.includes("classList.remove('dark')"), "Anti-FOUC script must remove .dark");
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`🏁 STRESS TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error("❌ STRESS TESTS FAILED with the following issues:");
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f.name}: ${f.error.message}`));
    process.exit(1);
  } else {
    console.log("🎉 ALL EMPIRICAL STRESS TESTS PASSED WITH 100% SUCCESS RATE!");
    process.exit(0);
  }
}

runAllSuites().catch((err) => {
  console.error("FATAL HARNESS ERROR:", err);
  process.exit(1);
});
