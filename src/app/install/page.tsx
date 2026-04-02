"use client";

import { useState } from "react";

export default function InstallPage() {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runInstall() {
    if (!secret.trim()) {
      setError("Enter your INSTALL_SECRET.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `/api/install?secret=${encodeURIComponent(secret)}`,
      );
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 12,
          padding: 40,
          width: "100%",
          maxWidth: 560,
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>🛠 Database Installer</h1>
        <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
          Runs migrations and seeds the database with initial data and an admin
          account.
        </p>

        <label style={{ fontSize: 12, color: "#aaa" }}>INSTALL_SECRET</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Paste your INSTALL_SECRET env value"
          style={{
            display: "block",
            width: "100%",
            marginTop: 6,
            marginBottom: 16,
            padding: "10px 14px",
            background: "#1a1a1a",
            border: "1px solid #444",
            borderRadius: 8,
            color: "#fff",
            fontSize: 14,
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => e.key === "Enter" && runInstall()}
        />

        {error && (
          <p style={{ color: "#ff6961", marginBottom: 12, fontSize: 13 }}>
            {error}
          </p>
        )}

        <button
          onClick={runInstall}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#333" : "#2997ff",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Running..." : "Run Install"}
        </button>

        {result && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                background: "#0d0d0d",
                border: `1px solid ${result.success ? "#30d158" : "#ff6961"}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {result.log?.map((line: string, i: number) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: line.startsWith("✅")
                      ? "#30d158"
                      : line.startsWith("❌")
                        ? "#ff6961"
                        : line.startsWith("🎉")
                          ? "#ffd60a"
                          : "#ccc",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>

            {result.success && result.credentials && (
              <div
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #f5a623",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <p
                  style={{ color: "#f5a623", fontWeight: 700, marginBottom: 8 }}
                >
                  Admin Credentials
                </p>
                <p style={{ fontSize: 13, color: "#ccc" }}>
                  Email:{" "}
                  <strong style={{ color: "#fff" }}>
                    {result.credentials.email}
                  </strong>
                </p>
                <p style={{ fontSize: 13, color: "#ccc" }}>
                  Password:{" "}
                  <strong style={{ color: "#fff" }}>
                    {result.credentials.password}
                  </strong>
                </p>
                <p style={{ fontSize: 12, color: "#ff6961", marginTop: 8 }}>
                  ⚠️ {result.credentials.warning}
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <a
                    href={result.credentials.loginUrl}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px",
                      background: "#2997ff",
                      borderRadius: 6,
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    Go to Login
                  </a>
                  <a
                    href={result.credentials.adminUrl}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px",
                      background: "#333",
                      borderRadius: 6,
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    Go to Admin
                  </a>
                </div>
              </div>
            )}

            {!result.success && result.error && (
              <p style={{ color: "#ff6961", fontSize: 13 }}>
                Error: {result.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
