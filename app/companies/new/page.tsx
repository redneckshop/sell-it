"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { getDatabaseSafeUserId } from "../../lib/actingUser";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "820px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  alignItems: "center",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: "22px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.94))",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "14px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  boxShadow: "0 18px 36px rgba(124, 58, 237, 0.24)",
  cursor: "pointer",
  fontSize: "15px",
};

const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "46px",
  color: "#e2e8f0",
  backgroundColor: "rgba(15, 23, 42, 0.82)",
  padding: "12px 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  cursor: "pointer",
  fontSize: "15px",
};

const disabledStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const formSectionStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
};

const errorStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.36)",
  backgroundColor: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "14px",
  borderRadius: "16px",
  fontWeight: 800,
};

const helpCardStyle: CSSProperties = {
  border: "1px solid rgba(196, 181, 253, 0.22)",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "rgba(124, 58, 237, 0.1)",
  color: "#cbd5e1",
  lineHeight: 1.55,
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
      created_by: getDatabaseSafeUserId(),
      updated_by: getDatabaseSafeUserId(),
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
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Sales / Companies</p>
            <h1 style={titleStyle}>Add Company</h1>
            <p style={subtitleStyle}>
              Create a new company inside Sell It and capture the sales basics,
              operating region, truck/equipment profile, and lead temperature.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href="/companies" style={secondaryButtonStyle}>
              Back to Companies
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={formSectionStyle}>
            <div style={helpCardStyle}>
              <strong>Company profile</strong>
              <br />
              Start with the company name. Add website, phone, email, regions,
              and equipment when you have it. Blank optional fields will stay
              empty.
            </div>

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

            <div style={formGridStyle}>
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
            </div>

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
                  minHeight: "120px",
                  lineHeight: 1.5,
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
                  minHeight: "120px",
                  lineHeight: 1.5,
                }}
              />
            </label>

            {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

            <div style={actionRowStyle}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  ...(saving ? disabledStyle : {}),
                }}
              >
                {saving ? "Saving..." : "Save Company"}
              </button>

              <Link href="/companies" style={secondaryButtonStyle}>
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

