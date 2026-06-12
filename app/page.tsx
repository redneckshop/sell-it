import Link from "next/link";
import { supabase } from "./lib/supabase";

export default async function Home() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      full_name,
      email,
      workspaces (
        name
      )
    `)
    .limit(1);

  const profile = profiles?.[0];
  const workspaceName = profile?.workspaces?.name ?? "No workspace found";
  const fullName = profile?.full_name ?? "No profile found";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111",
        color: "white",
        textAlign: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>SELL IT</h1>

      <p>
        AI-first sales operating system for capturing leads, conversations,
        posts, screenshots, and follow-ups.
      </p>

      <div style={{ marginTop: "32px" }}>
        <p style={{ marginBottom: "8px", color: "#aaa" }}>
          Connected Workspace:
        </p>
        <h2>{workspaceName}</h2>
      </div>

      <div style={{ marginTop: "24px" }}>
        <p style={{ marginBottom: "8px", color: "#aaa" }}>
          Logged In As:
        </p>
        <h2>{fullName}</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "32px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          href="/companies"
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "12px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Open Companies
        </Link>

        <Link
          href="/contacts"
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "12px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Open Contacts
        </Link>

        <Link
          href="/tasks"
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "12px 20px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Open Tasks
        </Link>
      </div>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </main>
  );
}