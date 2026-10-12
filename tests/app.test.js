import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("SIM Mahasiswa API - smoke", () => {
  it("GET /health mengembalikan status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("GET /route-tidak-ada mengembalikan 404", async () => {
    const res = await request(app).get("/route-tidak-ada");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api/v1/universitas tanpa token dapat diakses publik (200)", async () => {
    const res = await request(app).get("/api/v1/universitas");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/v1/universitas tanpa token mengembalikan 401", async () => {
    const res = await request(app).post("/api/v1/universitas").send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/auth/login dengan body kosong mengembalikan 422", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("POST /api/v1/auth/login dengan password salah mengembalikan 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "salah-sekali" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/auth/login dengan kredensial valid mengembalikan token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "Admin123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.username).toBe("admin");
  });
});
