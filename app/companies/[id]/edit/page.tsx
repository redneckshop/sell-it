"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type Company = {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  lead_temperature: string | null;
  operating_regions: string | null;
  assets_equipment: string | null;
  updated_at: string | null;
};

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
  marginBottom: "18px",
  maxWidth: "860px",
};

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();

  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [leadTemperature, setLeadTemperature] = useState("Warm");
  const [operatingRegions, setOperatingRegions] = useState("");
  const [assetsEquipment, setAssetsEquipment] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, name, website, phone, email, lead_temperature, operating_regions, assets_equipment, updated_at"
        )
        .eq("id", companyId)
        .single();

      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const company = data as Company;

      setName(company.name || "");
      setWebsite(company.website || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setLeadTemperature(company.lead_temperature || "Warm");
      setOperatingRegions(company.operating_regions || "");
      setAssetsEquipment(company.assets_equipment || "");
      setLastUpdated(company.updated_at);
    }

    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("companies")
      .update({
        name,
        website: website || null,
        phone: phone || null,
        email: email || null,
        lead_temperature: leadTemperature || null,
        operating_regions: operatingRegions || null,
        assets_equipment: assetsEquipment || null,
        updated_by: USER_ID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/companies/${companyId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <div style={actionRowStyle}>
        <Link href={`/companies/${companyId}`} style={secondaryButtonStyle}>
          Back to Company
        </Link>

        <Link href="/companies" style={secondaryButtonStyle}>
          Back to Companies
        </Link>
      </div>

      <header style={headerStyle}>
        <p style={eyebrowStyle}>Company Management</p>

        <h1 style={titleStyle}>Edit Company</h1>

        <p style={mutedTextStyle}>
          Update company details, lead temperature, operating regions, and
          truck/equipment profile.
        </p>
      </header>

      {loading && (
        <div style={formStyle}>
          <p style={{ margin: 0, color: "#cbd5e1" }}>Loading company...</p>
        </div>
      )}

      {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

      {!loading && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Company Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
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
              placeholder="208-555-0000"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contact@example.com"
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
              rows={4}
              placeholder="Example: Idaho, Eastern Washington, North Dakota"
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
              rows={4}
              placeholder="Example: End dumps, belly dumps, side dumps"
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "110px",
              }}
            />
          </label>

          <p style={{ color: "#94a3b8", margin: 0 }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={saving}
              style={saving ? disabledButtonStyle : primaryButtonStyle}
            >
              {saving ? "Saving..." : "Save Company"}
            </button>

            <Link href={`/companies/${companyId}`} style={secondaryButtonStyle}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}