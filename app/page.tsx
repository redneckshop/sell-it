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

  const features = [
    {
      title: "Companies",
      description: "Manage businesses, prospects, and customer organizations.",
      href: "/companies",
    },
    {
      title: "Contacts",
      description: "Manage people connected to companies and sales follow-ups.",
      href: "/contacts",
    },
    {
      title: "Tasks",
      description: "Track follow-ups, assignments, due dates, and priorities.",
      href: "/tasks",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>SELL IT</h1>

          <p style={{ color: "#aaa", fontSize: "18px", lineHeight: "1.5" }}>
            AI-first sales operating system for capturing leads, conversations,
            posts, screenshots, and follow-ups.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "20px",
              backgroundColor: "#1a1a1a",
            }}
          >
            <p style={{ color: "#aaa", marginTop: 0 }}>Connected Workspace</p>
            <h2 style={{ marginBottom: 0 }}>{workspaceName}</h2>
          </div>

          <div
            style={{
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "20px",
              backgroundColor: "#1a1a1a",
            }}
          >
            <p style={{ color: "#aaa", marginTop: 0 }}>Logged In As</p>
            <h2 style={{ marginBottom: 0 }}>{fullName}</h2>
          </div>
        </div>

        <h2 style={{ marginBottom: "16px" }}>Navigation</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              style={{
                display: "block",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "24px",
                backgroundColor: "#1a1a1a",
                color: "white",
                textDecoration: "none",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "24px" }}>
                {feature.title}
              </h3>

              <p style={{ color: "#aaa", lineHeight: "1.5" }}>
                {feature.description}
              </p>

              <div
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  backgroundColor: "white",
                  color: "black",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                }}
              >
                Open {feature.title}
              </div>
            </Link>
          ))}
        </div>

        {error && (
          <p style={{ color: "red", marginTop: "32px" }}>{error.message}</p>
        )}
      </section>
    </main>
  );
}