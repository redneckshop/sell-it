"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";

type CaptureResult = {
  company: string | null;
  contact: string | null;
  opportunity: string | null;
  task: string | null;
  activity: string | null;
  pain_points: string[];
  summary: string;
  confidence: "Low" | "Medium" | "High";
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "12px 18px",
  borderRadius: "6px",
  fontWeight: "bold",
  border: "none",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  color: "black",
  backgroundColor: "white",
  padding: "10px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
};

const cardStyle: CSSProperties = {
  border: "1px solid #333",
  padding: "18px",
  borderRadius: "10px",
  backgroundColor: "#1a1a1a",
  marginBottom: "16px",
};

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <p>
      <strong>{label}:</strong> {value || "Not found"}
    </p>
  );
}

export default function CapturePage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [rawText, setRawText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAnalyzing(true);
    setResult(null);
    setRawText("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/capture/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Capture analysis failed.");
        setAnalyzing(false);
        return;
      }

      setResult(data.result || null);
      setRawText(data.raw_text || "");
      setAnalyzing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown capture error.";

      setErrorMessage(message);
      setAnalyzing(false);
    }
  }

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
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={linkButtonStyle}>
          Home
        </Link>
      </div>

      <h1>AI Capture</h1>

      <p style={{ color: "#aaa", marginBottom: "32px", maxWidth: "900px" }}>
        Paste raw notes, call summaries, messages, meeting notes, or copied text.
        Sell It will analyze the text and return structured CRM information.
        Version 1 only analyzes and displays results. It does not save records.
      </p>

      <form
        onSubmit={handleAnalyze}
        style={{
          maxWidth: "950px",
          marginBottom: "36px",
        }}
      >
        <label>
          Capture Text
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={12}
            required
            placeholder={`Example:\nCalled ABC Trucking.\nTalked to Joe Smith.\n35 trucks.\nNeed more trucks.\nInterested in alpha testing.\nCall him next Friday.`}
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={analyzing}
          style={{ ...buttonStyle, marginTop: "16px" }}
        >
          {analyzing ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {errorMessage && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#7a2222",
            color: "#ff8a8a",
            maxWidth: "950px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Error</h2>
          <p>{errorMessage}</p>
        </div>
      )}

      {result && (
        <section style={{ maxWidth: "950px" }}>
          <h2>Structured Result</h2>

          <div style={cardStyle}>
            <ResultRow label="Company" value={result.company} />
            <ResultRow label="Contact" value={result.contact} />
            <ResultRow label="Opportunity" value={result.opportunity} />
            <ResultRow label="Task" value={result.task} />
            <ResultRow label="Activity" value={result.activity} />

            <p>
              <strong>Pain Points:</strong>{" "}
              {result.pain_points.length > 0
                ? result.pain_points.join(", ")
                : "None found"}
            </p>

            <p>
              <strong>Confidence:</strong> {result.confidence}
            </p>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{result.summary}</p>
          </div>
        </section>
      )}

      {rawText && (
        <section style={{ maxWidth: "950px" }}>
          <h2>Raw AI Text</h2>

          <div style={cardStyle}>
            <p style={{ whiteSpace: "pre-wrap" }}>{rawText}</p>
          </div>
        </section>
      )}
    </main>
  );
}