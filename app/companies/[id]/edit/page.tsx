"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { supabase } from "../../../lib/supabase";
import { getDatabaseSafeUserId } from "../../../lib/actingUser";
import { updateRecordWithConcurrencyGuard } from "../../../lib/concurrency";

const FALLBACK_USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

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
  marginBottom: "18px",
  fontWeight: 800,
};

const loadingStyle: CSSProperties = {
  ...cardStyle,
  color: "#cbd5e1",
};

const metaStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: "16px",
  padding: "12px 14px",
  backgroundColor: "rgba(15, 23, 42, 0.58)",
  color: "#94a3b8",
  margin: 0,
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

    const changedAt = new Date().toISOString();

    const updateResult = await updateRecordWithConcurrencyGuard({
      tableName: "companies",
      recordId: companyId,
      loadedUpdatedAt: lastUpdated,
      entityLabel: name || "Company",
      values: {
        name,
        website: website || null,
        phone: phone || null,
        email: email || null,
        lead_temperature: leadTemperature || null,
        operating_regions: operatingRegions || null,
        assets_equipment: assetsEquipment || null,
        updated_by: getDatabaseSafeUserId(),
        updated_at: changedAt,
      },
    });

    setSaving(false);

    if (!updateResult.ok) {
      setErrorMessage(updateResult.errorMessage);
      return;
    }

    // Company Edit Concurrency Protection V1

    router.push(`/companies/${companyId}`);
    router.refresh();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Sales / Companies</p>
            <h1 style={titleStyle}>Edit Company</h1>
            <p style={subtitleStyle}>
              Update company details, lead temperature, operating regions, and
              truck/equipment profile.
            </p>
          </div>

          <div style={actionRowStyle}>
            <Link href={`/companies/${companyId}`} style={secondaryButtonStyle}>
              Back to Company
            </Link>

            <Link href="/companies" style={secondaryButtonStyle}>
              Back to Companies
            </Link>
          </div>
        </div>

        {loading && (
          <div style={loadingStyle}>
            <p style={{ margin: 0 }}>Loading company...</p>
          </div>
        )}

        {errorMessage && <div style={errorStyle}>Error: {errorMessage}</div>}

        {!loading && (
          <form onSubmit={handleSubmit} style={cardStyle}>
            <div style={formSectionStyle}>
              <label style={labelStyle}>
                Company Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
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
              </div>

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
                  rows={4}
                  placeholder="Example: End dumps, belly dumps, side dumps"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "120px",
                    lineHeight: 1.5,
                  }}
                />
              </label>

              <p style={metaStyle}>
                Last Updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleString()
                  : "Not available"}
              </p>

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

                <Link href={`/companies/${companyId}`} style={secondaryButtonStyle}>
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}


