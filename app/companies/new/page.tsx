"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  color: "#f8fafc",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  color: "white",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  padding: "12px 16px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const headerStyle: CSSProperties = {
  maxWidth: "980px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 34%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.28)",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#a78bfa",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "34px",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const mutedTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  maxWidth: "860px",
  lineHeight: 1.65,
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxWidth: "860px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  fontSize: "16px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontWeight: 800,
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  background: "rgba(127, 29, 29, 0.22)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
};

export default function NewCompanyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadTemperature, setLeadTemperature] = useState("Warm");
  const [operatingRegions, setOperatingRegions] = useState("");
  const [assetsEquipment, setAssetsEquipment] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("companies").insert({
      workspace_id: WORKSPACE_ID,
      name,
      website: website || null,
      phone: phone || null,
      email: email || null,
      lead_temperature: leadTemperature,
      operating_regions: operatingRegions || null,
      assets_equipment: assetsEquipment || null,
      created_by: USER_ID,
      updated_by: USER_ID,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/companies");
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href="/companies" style={secondaryButtonStyle}>
          Back to Companies
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Company Management</p>

        <h1 style={titleStyle}>Add Company</h1>

        <p style={mutedTextStyle}>
          Create a new company inside Sell It and capture the sales basics,
          operating region, truck/equipment profile, and lead temperature.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={labelStyle}>
          Company Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Example: Rock Creek Contracting"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Website
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://example.com"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Business phone"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Business email"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Lead Temperature
          <select
            value={leadTemperature}
            onChange={(event) => setLeadTemperature(event.target.value)}
            style={inputStyle}
          >
            <option value="Cold">Cold</option>
            <option value="Warm">Warm</option>
            <option value="Hot">Hot</option>
            <option value="Active">Active</option>
            <option value="Dead">Dead</option>
          </select>
        </label>

        <label style={labelStyle}>
          Operating Regions
          <textarea
            value={operatingRegions}
            onChange={(event) => setOperatingRegions(event.target.value)}
            placeholder="Example: Dickinson, North Dakota; Sparks, Nevada; Northern Idaho"
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "110px",
            }}
          />
        </label>

        <label style={labelStyle}>
          Assets / Equipment
          <textarea
            value={assetsEquipment}
            onChange={(event) => setAssetsEquipment(event.target.value)}
            placeholder="Example: End dumps, belly dumps, side dumps, lowboys"
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: "110px",
            }}
          />
        </label>

        {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving}
            style={saving ? disabledButtonStyle : primaryButtonStyle}
          >
            {saving ? "Saving..." : "Save Company"}
          </button>

          <Link href="/companies" style={secondaryButtonStyle}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}