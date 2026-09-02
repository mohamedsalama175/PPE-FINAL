import type { Server } from "http";
import { createApp } from "../../../server/src/app.js";
import { prisma } from "../../../server/src/lib/prisma.js";
import { TestClient } from "./client.js";

export interface PersonaTokens {
  admin: string;
  hseSupervisor: string;
  directSupervisor: string;
  storeKeeperCairo: string;
  storeKeeperAlex: string;
  storeKeeperUnassigned: string;
  worker: string;
}

export class TestContext {
  private server: Server | null = null;
  public baseUrl: string = "";
  public tokens: PersonaTokens = {
    admin: "",
    hseSupervisor: "",
    directSupervisor: "",
    storeKeeperCairo: "",
    storeKeeperAlex: "",
    storeKeeperUnassigned: "",
    worker: "",
  };

  async start(): Promise<void> {
    const app = createApp();
    await new Promise<void>((resolve) => {
      this.server = app.listen(0, () => {
        const addr: any = this.server!.address();
        this.baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Authenticate personas
    const unauthClient = new TestClient(this.baseUrl);

    const login = async (code: string) => {
      const res = await unauthClient.post("/api/auth/login", {
        employeeCode: code,
        password: "password123",
      });
      if (res.status !== 200 || !res.data?.token) {
        throw new Error(`Failed to login persona ${code}: ${res.status} ${JSON.stringify(res.data)}`);
      }
      return res.data.token as string;
    };

    this.tokens.admin = await login("EMP-001");
    this.tokens.hseSupervisor = await login("EMP-002");
    this.tokens.directSupervisor = await login("EMP-003");
    this.tokens.storeKeeperCairo = await login("EMP-008");
    this.tokens.storeKeeperAlex = await login("EMP-011");
    this.tokens.worker = await login("EMP-004");
    try {
      this.tokens.storeKeeperUnassigned = await login("EMP-013");
    } catch {
      this.tokens.storeKeeperUnassigned = "";
    }
  }

  asAdmin(): TestClient {
    return new TestClient(this.baseUrl, this.tokens.admin);
  }

  asHSE(): TestClient {
    return new TestClient(this.baseUrl, this.tokens.hseSupervisor);
  }

  asDirectSupervisor(): TestClient {
    return new TestClient(this.baseUrl, this.tokens.directSupervisor);
  }

  asStoreKeeper(site: "cairo" | "alex" | "unassigned" = "cairo"): TestClient {
    const token =
      site === "alex"
        ? this.tokens.storeKeeperAlex
        : site === "unassigned"
        ? this.tokens.storeKeeperUnassigned
        : this.tokens.storeKeeperCairo;
    return new TestClient(this.baseUrl, token);
  }

  asWorker(): TestClient {
    return new TestClient(this.baseUrl, this.tokens.worker);
  }

  asUnauthenticated(): TestClient {
    return new TestClient(this.baseUrl);
  }

  client(token?: string): TestClient {
    return new TestClient(this.baseUrl, token);
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server!.close((err) => (err ? reject(err) : resolve()));
      });
      this.server = null;
    }
    await prisma.$disconnect();
  }
}
