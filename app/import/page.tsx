"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";
const USER_ID = "a840f813-aba5-44f7-bf20-5f1e5a91e832";

type ImportType = "companies_only" | "companies_contacts";
type DuplicateHandling = "skip_existing" | "update_existing" | "create_duplicate";

type ImportHistory = {
  id: string;
  file_name: string;
  import_type: string;
  duplicate_handling: string;
  row_count: number;
  rows_imported: number;
  rows_skipped: number;
  created_at: string;
};

type CompanyRow = {
  id: string;
  name: string;
};

type ImportResult = {
  rowsImported: number;
  rowsSkipped: number;
  attachmentSaved: boolean;
};

const fieldOptions = [
  { value: "", label: "Do not import" },
  { value: "Company.Name", label: "Company.Name" },
  { value: "Company.Phone", label: "Company.Phone" },
  { value: "Company.Email", label: "Company.Email" },
  { value: "Company.Website", label: "Company.Website" },
  { value: "Company.LeadTemperature", label: "Company.Lead Temperature" },
  { value: "Company.OperatingRegions", label: "Company.Operating Regions" },
  { value: "Company.AssetsEquipment", label: "Company.Assets / Equipment" },
  { value: "Company.Notes", label: "Company.Notes" },
  { value: "Contact.Name", label: "Contact.Name" },
  { value: "Contact.FirstName", label: "Contact.First Name" },
  { value: "Contact.LastName", label: "Contact.Last Name" },
  { value: "Contact.Title", label: "Contact.Title" },
  { value: "Contact.Email", label: "Contact.Email" },
  { value: "Contact.Phone", label: "Contact.Phone" },
  { value: "Contact.Notes", label: "Contact.Notes" },
];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "20px",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))",
  padding: "20px",
  marginBottom: "18px",
  maxWidth: "1120px",
  boxShadow: "0 20px 70px rgba(2, 6, 23, 0.24)",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  marginTop: "8px",
  marginBottom: "16px",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "12px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 800,
  borderRadius: "999px",
  border: "1px solid rgba(167, 139, 250, 0.45)",
  background:
    "linear-gradient(135deg, rgba(124, 58, 237, 1), rgba(99, 102, 241, 1))",
  color: "white",
  fontSize: "15px",
  boxShadow: "0 16px 36px rgba(79, 70, 229, 0.28)",
};

const headerStyle: CSSProperties = {
  maxWidth: "1120px",
  marginBottom: "24px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "24px",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(124, 58, 237, 0.24), transparent 32%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.72))",
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
  maxWidth: "880px",
  lineHeight: 1.65,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function cleanFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatDateTime(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell.trim());
      currentCell = "";

      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell.trim());

  if (currentRow.some((cell) => cell.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function guessField(columnName: string) {
  const column = normalize(columnName);

  if (
    column.includes("company name") ||
    column.includes("business name") ||
    column === "company" ||
    column === "business"
  ) {
    return "Company.Name";
  }

  if (
    column.includes("contact name") ||
    column.includes("person name") ||
    column.includes("full name")
  ) {
    return "Contact.Name";
  }

  if (column.includes("first")) {
    return "Contact.FirstName";
  }

  if (column.includes("last")) {
    return "Contact.LastName";
  }

  if (column.includes("title") || column.includes("position")) {
    return "Contact.Title";
  }

  if (column.includes("website") || column.includes("web site") || column.includes("url")) {
    return "Company.Website";
  }

  if (column.includes("dot") || column.includes("mc number") || column.includes("mc#")) {
    return "Company.Notes";
  }

  if (column.includes("equipment") || column.includes("asset") || column.includes("truck")) {
    return "Company.AssetsEquipment";
  }

  if (column.includes("region") || column.includes("location") || column.includes("area")) {
    return "Company.OperatingRegions";
  }

  if (column.includes("temperature") || column.includes("lead temp")) {
    return "Company.LeadTemperature";
  }

  if (column.includes("email") && column.includes("contact")) {
    return "Contact.Email";
  }

  if (column.includes("phone") && column.includes("contact")) {
    return "Contact.Phone";
  }

  if (column.includes("email")) {
    return "Company.Email";
  }

  if (column.includes("phone") || column.includes("mobile") || column.includes("cell")) {
    return "Company.Phone";
  }

  if (column.includes("note") && column.includes("contact")) {
    return "Contact.Notes";
  }

  if (column.includes("note")) {
    return "Company.Notes";
  }

  return "";
}

function splitContactName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importType, setImportType] = useState<ImportType>("companies_only");
  const [duplicateHandling, setDuplicateHandling] =
    useState<DuplicateHandling>("skip_existing");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<ImportHistory[]>([]);

  const previewRows = useMemo(() => rows.slice(0, 20), [rows]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const { data, error } = await supabase
      .from("import_history")
      .select(
        "id, file_name, import_type, duplicate_handling, row_count, rows_imported, rows_skipped, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setHistory((data ?? []) as ImportHistory[]);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage("");
    setStatusMessage("");
    setResult(null);

    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setHeaders([]);
      setRows([]);
      setMapping({});
      return;
    }

    const text = await file.text();
    const parsedRows = parseCsv(text);

    if (parsedRows.length < 2) {
      setSelectedFile(file);
      setHeaders(parsedRows[0] ?? []);
      setRows([]);
      setMapping({});
      setErrorMessage("This CSV needs a header row and at least one data row.");
      return;
    }

    const parsedHeaders = parsedRows[0].map((header) => header.trim());
    const dataRows = parsedRows.slice(1);

    const guessedMapping: Record<string, string> = {};

    parsedHeaders.forEach((header) => {
      guessedMapping[header] = guessField(header);
    });

    setSelectedFile(file);
    setHeaders(parsedHeaders);
    setRows(dataRows);
    setMapping(guessedMapping);
  }

  function getFirstMappedValue(row: string[], fieldName: string) {
    for (let index = 0; index < headers.length; index += 1) {
      const header = headers[index];

      if (mapping[header] === fieldName) {
        const value = row[index]?.trim() ?? "";

        if (value) {
          return value;
        }
      }
    }

    return "";
  }

  function getMappedNotes(row: string[], fieldName: string) {
    const notes: string[] = [];

    headers.forEach((header, index) => {
      if (mapping[header] === fieldName) {
        const value = row[index]?.trim() ?? "";

        if (value) {
          notes.push(`${header}: ${value}`);
        }
      }
    });

    return notes.join("\n");
  }

  function hasContactData(row: string[]) {
    const contactFields = [
      "Contact.Name",
      "Contact.FirstName",
      "Contact.LastName",
      "Contact.Title",
      "Contact.Email",
      "Contact.Phone",
      "Contact.Notes",
    ];

    return contactFields.some((fieldName) => {
      return (
        getFirstMappedValue(row, fieldName) !== "" ||
        getMappedNotes(row, fieldName) !== ""
      );
    });
  }

  async function saveCsvAttachment(file: File) {
    const storagePath = `imports/${Date.now()}-${cleanFileName(file.name)}`;

    const uploadResult = await supabase.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type || "text/csv",
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const publicUrlResult = supabase.storage
      .from("attachments")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlResult.data.publicUrl;

    const { data, error } = await supabase
      .from("attachments")
      .insert({
        workspace_id: WORKSPACE_ID,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        uploaded_by: USER_ID,
        file_type: "csv",
        file_url: publicUrl,
        storage_path: storagePath,
        description: "Original CSV uploaded through AI Capture V6 CSV Import.",
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data?.id as string | null;
  }

  async function handleImport() {
    setErrorMessage("");
    setStatusMessage("");
    setResult(null);

    if (!selectedFile) {
      setErrorMessage("Choose a CSV file first.");
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("There are no CSV rows to import.");
      return;
    }

    const companyNameMapped = Object.values(mapping).includes("Company.Name");

    if (!companyNameMapped) {
      setErrorMessage("Map one CSV column to Company.Name before importing.");
      return;
    }

    if (importType === "companies_contacts") {
      const hasAnyContactField = Object.values(mapping).some((value) =>
        value.startsWith("Contact.")
      );

      if (!hasAnyContactField) {
        setErrorMessage(
          "For Companies + Contacts, map at least one contact column."
        );
        return;
      }
    }

    setImporting(true);
    setStatusMessage("Saving original CSV and importing rows...");

    try {
      const attachmentId = await saveCsvAttachment(selectedFile);

      const { data: existingCompaniesData, error: existingCompaniesError } =
        await supabase.from("companies").select("id, name");

      if (existingCompaniesError) {
        throw new Error(existingCompaniesError.message);
      }

      const existingCompanies = (existingCompaniesData ?? []) as CompanyRow[];
      const existingByName = new Map<string, CompanyRow>();

      existingCompanies.forEach((company) => {
        existingByName.set(normalize(company.name), company);
      });

      let rowsImported = 0;
      let rowsSkipped = 0;

      for (const row of rows) {
        const companyName = getFirstMappedValue(row, "Company.Name");

        if (!companyName) {
          rowsSkipped += 1;
          continue;
        }

        const existingCompany = existingByName.get(normalize(companyName));

        const companyData = {
          workspace_id: WORKSPACE_ID,
          name: companyName,
          website: getFirstMappedValue(row, "Company.Website") || null,
          phone: getFirstMappedValue(row, "Company.Phone") || null,
          email: getFirstMappedValue(row, "Company.Email") || null,
          lead_temperature:
            getFirstMappedValue(row, "Company.LeadTemperature") || "Warm",
          operating_regions:
            getFirstMappedValue(row, "Company.OperatingRegions") || null,
          assets_equipment:
            getFirstMappedValue(row, "Company.AssetsEquipment") || null,
          notes: getMappedNotes(row, "Company.Notes") || null,
          created_by: USER_ID,
          updated_by: USER_ID,
        };

        let companyId = "";

        if (existingCompany && duplicateHandling === "skip_existing") {
          rowsSkipped += 1;
          continue;
        }

        if (existingCompany && duplicateHandling === "update_existing") {
          const { error } = await supabase
            .from("companies")
            .update({
              website: companyData.website,
              phone: companyData.phone,
              email: companyData.email,
              lead_temperature: companyData.lead_temperature,
              operating_regions: companyData.operating_regions,
              assets_equipment: companyData.assets_equipment,
              notes: companyData.notes,
              updated_by: USER_ID,
            })
            .eq("id", existingCompany.id);

          if (error) {
            throw new Error(error.message);
          }

          companyId = existingCompany.id;
          rowsImported += 1;
        } else {
          const { data, error } = await supabase
            .from("companies")
            .insert(companyData)
            .select("id, name")
            .single();

          if (error) {
            throw new Error(error.message);
          }

          companyId = data.id;
          existingByName.set(normalize(companyName), {
            id: data.id,
            name: data.name,
          });
          rowsImported += 1;
        }

        if (importType === "companies_contacts" && hasContactData(row)) {
          const fullName = getFirstMappedValue(row, "Contact.Name");
          const splitName = splitContactName(fullName);
          const firstName =
            getFirstMappedValue(row, "Contact.FirstName") ||
            splitName.firstName ||
            "Unknown";
          const lastName =
            getFirstMappedValue(row, "Contact.LastName") ||
            splitName.lastName ||
            null;

          const { error } = await supabase.from("contacts").insert({
            workspace_id: WORKSPACE_ID,
            company_id: companyId || null,
            first_name: firstName,
            last_name: lastName,
            title: getFirstMappedValue(row, "Contact.Title") || null,
            email: getFirstMappedValue(row, "Contact.Email") || null,
            phone: getFirstMappedValue(row, "Contact.Phone") || null,
            notes: getMappedNotes(row, "Contact.Notes") || null,
            created_by: USER_ID,
            updated_by: USER_ID,
          });

          if (error) {
            throw new Error(error.message);
          }
        }
      }

      const { error: historyError } = await supabase
        .from("import_history")
        .insert({
          workspace_id: WORKSPACE_ID,
          attachment_id: attachmentId,
          file_name: selectedFile.name,
          import_type:
            importType === "companies_only"
              ? "Companies Only"
              : "Companies + Contacts",
          duplicate_handling:
            duplicateHandling === "skip_existing"
              ? "Skip Existing"
              : duplicateHandling === "update_existing"
                ? "Update Existing"
                : "Create Duplicate",
          row_count: rows.length,
          rows_imported: rowsImported,
          rows_skipped: rowsSkipped,
          created_by: USER_ID,
        });

      if (historyError) {
        throw new Error(historyError.message);
      }

      setResult({
        rowsImported,
        rowsSkipped,
        attachmentSaved: true,
      });

      setStatusMessage("Import complete.");
      await loadHistory();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Import failed."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <p style={eyebrowStyle}>Capture</p>

        <h1 style={titleStyle}>CSV Import</h1>

        <p style={mutedTextStyle}>
          Upload CSV files, preview rows, map columns to Sell It fields, and
          import companies or companies with contacts.
        </p>
      </header>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>1. Upload CSV</h2>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          style={inputStyle}
        />

        {selectedFile && (
          <div style={{ marginTop: "18px", color: "#cbd5e1", lineHeight: "1.6" }}>
            <strong>File:</strong> {selectedFile.name}
            <br />
            <strong>Rows:</strong> {rows.length}
            <br />
            <strong>Columns:</strong> {headers.length}
          </div>
        )}
      </section>

      {headers.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>2. Import Settings</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            <label>
              Import Type
              <select
                value={importType}
                onChange={(event) =>
                  setImportType(event.target.value as ImportType)
                }
                style={inputStyle}
              >
                <option value="companies_only">Companies only</option>
                <option value="companies_contacts">
                  Companies + Contacts
                </option>
              </select>
            </label>

            <label>
              Duplicate Handling
              <select
                value={duplicateHandling}
                onChange={(event) =>
                  setDuplicateHandling(event.target.value as DuplicateHandling)
                }
                style={inputStyle}
              >
                <option value="skip_existing">Skip Existing</option>
                <option value="update_existing">Update Existing</option>
                <option value="create_duplicate">Create Duplicate</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {headers.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>3. Column Mapping</h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "650px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    CSV Column
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Sell It Field
                  </th>
                </tr>
              </thead>
              <tbody>
                {headers.map((header) => (
                  <tr key={header}>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {header}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      <select
                        value={mapping[header] ?? ""}
                        onChange={(event) =>
                          setMapping((current) => ({
                            ...current,
                            [header]: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      >
                        {fieldOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {previewRows.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>4. Preview First 20 Rows</h2>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
                        padding: "10px",
                        color: "#cbd5e1",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {headers.map((header, cellIndex) => (
                      <td
                        key={`${header}-${cellIndex}`}
                        style={{
                          borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
                          padding: "10px",
                          verticalAlign: "top",
                          color: "#e2e8f0",
                        }}
                      >
                        {row[cellIndex] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            style={{
              ...buttonStyle,
              marginTop: "18px",
              opacity: importing ? 0.65 : 1,
            }}
          >
            {importing ? "Importing..." : "Import CSV"}
          </button>
        </section>
      )}

      {statusMessage && <p style={{ color: "#86efac" }}>{statusMessage}</p>}

      {errorMessage && <p style={{ color: "#fca5a5" }}>Error: {errorMessage}</p>}

      {result && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Import Result</h2>
          <p>Rows imported: {result.rowsImported}</p>
          <p>Rows skipped: {result.rowsSkipped}</p>
          <p>Original CSV saved as attachment: {result.attachmentSaved ? "Yes" : "No"}</p>
        </section>
      )}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Recent Import History</h2>

        {history.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No import history yet.</p>
        )}

        {history.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    File
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Type
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Duplicates
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Rows
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Imported
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Skipped
                  </th>
                  <th style={{ textAlign: "left", borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.file_name}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.import_type}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.duplicate_handling}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.row_count}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.rows_imported}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {item.rows_skipped}
                    </td>
                    <td style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.18)", padding: "10px" }}>
                      {formatDateTime(item.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}


