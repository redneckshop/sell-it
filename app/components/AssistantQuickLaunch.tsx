"use client";

import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";

const ASSISTANT_QUESTION_STORAGE_KEY = "sell-it-assistant-v4-question";
const ASSISTANT_INSIGHTS_SUPPRESSED_STORAGE_KEY =
  "sell-it-assistant-v4-insights-suppressed";

const quickQuestions = [
  "What should I do today?",
  "Who is overloaded?",
  "What needs attention?",
];

function panelStyle(): CSSProperties {
  return {
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "20px",
    padding: "18px",
    background:
      "linear-gradient(180deg, rgba(31,31,31,0.96), rgba(18,18,18,0.96))",
    boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
    color: "white",
  };
}

const mutedTextStyle: CSSProperties = {
  color: "#a7a7a7",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  color: "white",
  outline: "none",
  fontSize: "15px",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  border: "1px solid #8b5cf6",
  borderRadius: "14px",
  backgroundColor: "#7c3aed",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(124,58,237,0.24)",
};

const chipButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.24)",
  borderRadius: "999px",
  backgroundColor: "rgba(15, 23, 42, 0.72)",
  color: "#e5e7eb",
  padding: "8px 10px",
  fontWeight: 800,
  fontSize: "12px",
  cursor: "pointer",
};

export default function AssistantQuickLaunch() {
  const [question, setQuestion] = useState(quickQuestions[0]);

  function launchAssistant(nextQuestion: string) {
    const cleanedQuestion = nextQuestion.trim();
    if (cleanedQuestion) {
      window.sessionStorage.setItem(
        ASSISTANT_QUESTION_STORAGE_KEY,
        cleanedQuestion
      );
    }
    window.sessionStorage.removeItem(ASSISTANT_INSIGHTS_SUPPRESSED_STORAGE_KEY);
    window.location.href = "/assistant";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    launchAssistant(question);
  }

  return (
    <aside style={panelStyle()}>
      <p
        style={{
          ...mutedTextStyle,
          textTransform: "uppercase",
          letterSpacing: "2px",
          margin: "0 0 8px",
          fontSize: "12px",
          fontWeight: 900,
        }}
      >
        Assistant Quick Question
      </p>
      <h2 style={{ margin: "0 0 10px" }}>Ask the operating system</h2>
      <p style={{ ...mutedTextStyle, margin: "0 0 14px", lineHeight: 1.45 }}>
        Pick a morning question or type your own. This opens Assistant using its
        existing saved-question flow.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuestion(event.target.value)}
          placeholder="What should I do today?"
          style={inputStyle}
        />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            margin: "12px 0",
          }}
        >
          {quickQuestions.map((quickQuestion) => (
            <button
              key={quickQuestion}
              type="button"
              onClick={() => launchAssistant(quickQuestion)}
              style={chipButtonStyle}
            >
              {quickQuestion}
            </button>
          ))}
        </div>
        <button type="submit" style={buttonStyle}>
          Open Assistant
        </button>
      </form>
    </aside>
  );
}

