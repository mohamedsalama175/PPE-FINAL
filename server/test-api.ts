import { createApp } from "./src/app.js";
import { prisma } from "./src/lib/prisma.js";

const app = createApp();
const server = app.listen(0, async () => {
  const addr: any = server.address();
  const port = addr.port;
  const base = `http://localhost:${port}`;
  console.log(`Test server on ${base}`);

  async function req(method: string, path: string, body?: any, token?: string) {
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, json, text };
  }

  // login
  const login = await req("POST", "/api/auth/login", { employeeCode: "EMP-001", password: "password123" });
  console.log("LOGIN status", login.status, login.json?.user?.role || login.text.slice(0,200));
  const token = login.json?.token;
  if (!token) { console.error("LOGIN FAILED", login); process.exit(1); }

  // test ppe-items
  const ppe = await req("GET", "/api/ppe-items", undefined, token);
  console.log("PPE ITEMS status", ppe.status, "count", ppe.json?.data?.length, "meta", ppe.json?.meta);

  // test stock balances
  const bal = await req("GET", "/api/stock/balances", undefined, token);
  console.log("BALANCES status", bal.status, "count", bal.json?.data?.length);

  // test dashboard
  const dash = await req("GET", "/api/dashboard/stats", undefined, token);
  console.log("DASHBOARD status", dash.status, dash.json);

  // test locations
  const loc = await req("GET", "/api/locations", undefined, token);
  console.log("LOCATIONS status", loc.status, loc.json?.data?.length);

  // test invalid auth
  const bad = await req("GET", "/api/ppe-items");
  console.log("UNAUTH status", bad.status, bad.json?.error);

  // test trash (admin)
  const trash = await req("GET", "/api/trash", undefined, token);
  console.log("TRASH status", trash.status, trash.json?.data?.length);

  // test transfer
  // Find a stock balance with qty >0
  const fromBal = ppe.json?.data?.length ? null : null;
  // Try transfer from loc-1 to loc-3 for ppe-1
  const transfer = await req("POST", "/api/stock/transfers", { ppeItemId: "ppe-1", fromLocationId: "loc-1", toLocationId: "loc-3", batchNumber: "B-26-001", quantity: 5 }, token);
  console.log("TRANSFER status", transfer.status, transfer.json?.reference || transfer.text.slice(0,300));

  // test issuance
  const issuance = await req("POST", "/api/issuances", { ppeItemId: "ppe-1", locationId: "loc-1", quantity: 1, employeeId: "emp-4", storeKeeperSignature: "data:image/png;base64,dummy", receiverSignature: "data:image/png;base64,dummy" }, token);
  console.log("ISSUANCE status", issuance.status, issuance.json?.id || issuance.text.slice(0,500));

  server.close();
  await prisma.$disconnect();
  console.log("TESTS DONE");
});
