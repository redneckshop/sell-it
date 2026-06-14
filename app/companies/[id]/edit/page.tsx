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

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  backgroundColor: "white",
  color: "black",
  border: "1px solid #555",
  borderRadius: "6px",
  fontSize: "16px",
  boxSizing: "border-box",
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
        <Link
          href="/"
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Home
        </Link>

        <Link
          href={`/companies/${companyId}`}
          style={{
            color: "black",
            backgroundColor: "white",
            padding: "10px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Company
        </Link>
      </div>

      <h1>Edit Company</h1>

      {loading && <p>Loading company...</p>}

      {errorMessage && (
        <p style={{ color: "red", marginTop: "24px" }}>
          Error: {errorMessage}
        </p>
      )}

      {!loading && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "700px",
            marginTop: "32px",
          }}
        >
          <label>
            Company Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Website
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </label>

          <label>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="208-555-0000"
              style={inputStyle}
            />
          </label>

          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="contact@example.com"
              style={inputStyle}
            />
          </label>

          <label>
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

          <label>
            Operating Regions
            <textarea
              value={operatingRegions}
              onChange={(event) => setOperatingRegions(event.target.value)}
              rows={4}
              placeholder="Example: Idaho, Eastern Washington, North Dakota"
              style={inputStyle}
            />
          </label>

          <label>
            Assets / Equipment
            <textarea
              value={assetsEquipment}
              onChange={(event) => setAssetsEquipment(event.target.value)}
              rows={4}
              placeholder="Example: End dumps, belly dumps, side dumps"
              style={inputStyle}
            />
          </label>

          <p style={{ color: "#aaa" }}>
            Last Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleString()
              : "Not available"}
          </p>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px",
              cursor: "pointer",
              fontWeight: "bold",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "white",
              color: "black",
              fontSize: "16px",
            }}
          >
            {saving ? "Saving..." : "Save Company"}
          </button>
        </form>
      )}
    </main>
  );
}