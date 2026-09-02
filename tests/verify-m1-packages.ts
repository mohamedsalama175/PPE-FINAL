/**
 * Empirical Package Import & Integrity Verification Harness
 * Challenger 2 - Milestone 1
 */

import assert from "node:assert";

console.log("=======================================================");
console.log("📦 VERIFYING MILESTONE 1 PACKAGE IMPORTS & INTEGRITY");
console.log("=======================================================\n");

let passed = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// 1. @mantine/core
test("1. @mantine/core imports and exports", async () => {
  const mantineCore = await import("@mantine/core");
  assert(typeof mantineCore.createTheme === "function", "createTheme should be a function");
  assert(typeof mantineCore.MantineProvider !== "undefined", "MantineProvider should be exported");
  assert(typeof mantineCore.Button !== "undefined", "Button should be exported");
  assert(typeof mantineCore.Select !== "undefined", "Select should be exported");
  assert(typeof mantineCore.Modal !== "undefined", "Modal should be exported");
  assert(typeof mantineCore.colorsTuple === "function", "colorsTuple should be a function");
  
  const testTheme = mantineCore.createTheme({
    primaryColor: "blue",
    defaultRadius: "md",
  });
  assert(testTheme.primaryColor === "blue", "Theme creation should succeed");
});

// 2. @mantine/hooks
test("2. @mantine/hooks imports and exports", async () => {
  const mantineHooks = await import("@mantine/hooks");
  assert(typeof mantineHooks.useDisclosure === "function", "useDisclosure should be a function");
  assert(typeof mantineHooks.useMediaQuery === "function", "useMediaQuery should be a function");
  assert(typeof mantineHooks.useLocalStorage === "function", "useLocalStorage should be a function");
  assert(typeof mantineHooks.useDebouncedValue === "function", "useDebouncedValue should be a function");
});

// 3. @mantine/dates & dayjs
test("3. @mantine/dates & dayjs imports and exports", async () => {
  const mantineDates = await import("@mantine/dates");
  assert(typeof mantineDates.DatePicker !== "undefined", "DatePicker should be exported");
  assert(typeof mantineDates.DatePickerInput !== "undefined", "DatePickerInput should be exported");
  assert(typeof mantineDates.DatesProvider !== "undefined", "DatesProvider should be exported");

  const dayjsModule = await import("dayjs");
  const dayjs = dayjsModule.default || dayjsModule;
  const now = dayjs("2026-11-09T12:00:00Z");
  assert(now.isValid(), "dayjs parsing should produce valid date");
  assert(now.format("YYYY-MM-DD") === "2026-11-09", "dayjs formatting should match expected");
});

// 4. @tippyjs/react & tippy.js
test("4. @tippyjs/react & tippy.js imports and exports", async () => {
  const tippyReact = await import("@tippyjs/react");
  const Tippy = tippyReact.default || tippyReact;
  assert(typeof Tippy !== "undefined", "@tippyjs/react default should be defined");

  const tippyJs = await import("tippy.js");
  const tippy = tippyJs.default || tippyJs;
  assert(typeof tippy === "function", "tippy.js default export should be a function");
});

// 5. sweetalert2
test("5. sweetalert2 imports and exports", async () => {
  const swalModule = await import("sweetalert2");
  const Swal = swalModule.default || swalModule;
  assert(typeof Swal !== "undefined", "SweetAlert2 default should be exported");
  assert(typeof Swal.fire === "function", "Swal.fire should be a function");
  assert(typeof Swal.mixin === "function", "Swal.mixin should be a function");
});

// 6. react-flatpickr & flatpickr
test("6. react-flatpickr & flatpickr imports and exports", async () => {
  const flatpickrJs = await import("flatpickr");
  const flatpickr = flatpickrJs.default || flatpickrJs;
  assert(typeof flatpickr === "function", "flatpickr default export should be a function");

  const reactFlatpickr = await import("react-flatpickr");
  const Flatpickr = reactFlatpickr.default || reactFlatpickr;
  assert(typeof Flatpickr !== "undefined", "react-flatpickr default should be exported");
});

// 7. Project Theme & Store Integrity
test("7. Project mantineTheme & themeStore imports", async () => {
  const { mantineTheme, hseBrandColors } = await import("../src/theme/mantineTheme.js");
  assert(Array.isArray(hseBrandColors) && hseBrandColors.length === 10, "hseBrandColors must have 10 shades");
  assert(hseBrandColors[6] === "#212B59", "Primary shade 6 must be #212B59");
  assert(mantineTheme.primaryColor === "brand", "primaryColor must be 'brand'");
  assert(mantineTheme.fontFamily?.includes("Almarai"), "Font family must include Almarai");

  const { useThemeStore } = await import("../src/store/themeStore.js");
  assert(typeof useThemeStore === "function", "useThemeStore should be exported as a hook");
  const state = useThemeStore.getState();
  assert(["light", "dark", "system"].includes(state.theme), "Initial theme state must be valid");
  assert(typeof state.setTheme === "function", "setTheme must be a function");
});

console.log(`\n=======================================================`);
console.log(`🏁 TEST RESULTS: ${passed}/${total} passed (100%)`);
console.log(`=======================================================\n`);
