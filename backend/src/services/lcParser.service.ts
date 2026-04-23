export interface ParsedLC {
  applicant: string;
  beneficiary: string;
  amount: string;
  currency: string;
  portOfLoading: string;
  portOfDischarge: string;
  paymentTerms: string;
  latestShipmentDate: string;
  expiryDate: string;
  lcNumber: string;
  incoterm: string;
  hsCode: string;
  vehicleDescription: string;
  piReference: string;
  // Extracted chassis / engine numbers from LC goods description
  chassisNumbers: string[];
  engineNumbers: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clean = (s: string): string =>
  s.replace(/---\s*PAGE BREAK\s*---/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Try a list of regexes, return first match group 1 (cleaned) */
const first = (text: string, patterns: RegExp[]): string => {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return clean(m[1] ?? m[0]);
  }
  return "";
};

/**
 * Extract a SWIFT MT700 field block.
 * Captures everything after "NN[X]: label\n" until the next field tag.
 */
const swiftBlock = (text: string, tag: string): string => {
  // Matches e.g.  "50: Applicant\n  AUTODIRECT...\n59: Beneficiary"
  const re = new RegExp(
    `${tag}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*[0-9]{2}[A-Z]?:\\s)`,
    "i"
  );
  const m = text.match(re);
  return m ? clean(m[1]) : "";
};

// ─── Main parser ─────────────────────────────────────────────────────────────

export const parseLC = (rawText: string): ParsedLC => {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // ── Applicant (field 50) ──────────────────────────────────────────────────
  // Extract ONLY the first line (company name), not the full address block
  const applicantBlock = swiftBlock(text, "50[A-Z]?");
  const applicant = applicantBlock.split(/\n/)[0].trim()
    || first(text, [/Applicant[:\-\s]+(.*)/i]);

  // ── Beneficiary (field 59) ────────────────────────────────────────────────
  const beneficiaryBlock = swiftBlock(text, "59[A-Z]?");
  const beneficiary = beneficiaryBlock.split(/\n/)[0].trim()
    || first(text, [/Beneficiary[:\-\s]+(.*)/i]);

  // ── Amount & currency (field 32B) ─────────────────────────────────────────
  // Format: "USD30300," or "USD 30,300.00"
  const amountLine = first(text, [
    /32B[:\s]+Currency Code,?\s*Amount\s*\n\s*(USD[\d,\.]+)/i,
    /32B[:\s]+(USD[\d,\.]+)/i,
    /L\/C Amount[:\s|]+(USD[\d,\.]+)/i,
    /L\/C Amount[:\s|]+USD\s*([\d,\.]+)/i,
  ]);
  const currency = amountLine.match(/^(USD|EUR|GBP|JPY)/i)?.[1]?.toUpperCase() ?? "USD";
  const numericAmount = amountLine
    .replace(/^(USD|EUR|GBP|JPY)/i, "")
    .replace(/,/g, "")
    .replace(/\.$/, "")
    .trim();

  // ── Ports ─────────────────────────────────────────────────────────────────
  // Port of Loading = field 44E, but strip everything after page break
  const polRaw = first(text, [
    /44E[:\s]+Port of Loading[^\n]*\n\s*([^\n]+)/i,
    /44E[:\s]+([^\n]+)/i,
    /Port of Loading[^\n]*[:\s]+([^\n|]+)/i,
  ]);
  // Strip any page-break artifact
  const portOfLoading = polRaw.replace(/---.*$/, "").trim();

  const podRaw = first(text, [
    /44F[:\s]+Port of Discharge[^\n]*\n\s*([^\n]+)/i,
    /44F[:\s]+([^\n]+)/i,
    /Port of Discharge[^\n]*[:\s]+([^\n|]+)/i,
  ]);
  const portOfDischarge = podRaw.replace(/---.*$/, "").trim();

  // ── Payment terms (field 42C) ─────────────────────────────────────────────
  const paymentTerms = first(text, [
    /42C[:\s]+Drafts at\.\.\.\s*\n\s*([^\n]+)/i,
    /42C[:\s]+([^\n]+)/i,
    /Drafts at[:\s]+([^\n]+)/i,
  ]) || "SIGHT";

  // ── Dates ─────────────────────────────────────────────────────────────────
  const latestShipmentDate = first(text, [
    /44C[:\s]+Latest Date of Shipment\s*\n\s*([^\n]+)/i,
    /44C[:\s]+([^\n]+)/i,
  ]);
  const expiryDate = first(text, [
    /31D[:\s]+Date and Place of Expiry\s*\n\s*([^\n]+)/i,
    /31D[:\s]+([^\n]+)/i,
    /L\/C Expiry Date[:\s|]+([^\n|]+)/i,
  ]);

  // ── LC number (field 20) ──────────────────────────────────────────────────
  const lcNumber = first(text, [
    /20[:\s]+Documentary Credit Number\s*\n\s*([^\n]+)/i,
    /20[:\s]+([^\n]+)/i,
    /L\/C Ref No\.?[:\s|]+([0-9]+)/i,
  ]);

  // ── HS Code ───────────────────────────────────────────────────────────────
  const hsCode = first(text, [
    /HS\s*CODE?\s*[-–]\s*([\d\.]+)/i,
    /HSN[:\s]+([\d\.]+)/i,
  ]);

  // ── Incoterm ──────────────────────────────────────────────────────────────
  const incoterm = first(text, [/\b(CFR|CIF|FOB|DAP|DDP|EXW|FCA|CPT|CIP|DPU)\b/i]).toUpperCase();

  // ── Vehicle description (field 45A) ───────────────────────────────────────
  const vehicleDescription = clean(
    first(text, [
      /45A[:\s]+Description of Goods[^\n]*\n([\s\S]*?)(?=\n\s*[0-9]{2}[A-Z]?:)/i,
    ])
  );

  // ── PI reference ──────────────────────────────────────────────────────────
  const piReference = first(text, [
    /PROFORMA INVOICE NO\.?\s*([A-Z0-9\/\-]+)/i,
    /AN\/[\d\-]+\/\d+\/PI/,
  ]);

  // ── Chassis numbers from LC goods description ─────────────────────────────
  // MT700 field 45A lists chassis like:  CHASSIS NO: MBHKWD43STA763667
  const chassisNumbers: string[] = [];
  const chassisRegex = /CHASSIS\s+NO[:\s]+([A-Z0-9]+)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = chassisRegex.exec(text)) !== null) {
    const val = cm[1].trim().toUpperCase();
    if (!chassisNumbers.includes(val)) chassisNumbers.push(val);
  }

  // ── Engine numbers from LC goods description ──────────────────────────────
  const engineNumbers: string[] = [];
  const engineRegex = /ENGINE\s+NO[:\s]+([A-Z0-9]+)/gi;
  let em: RegExpExecArray | null;
  while ((em = engineRegex.exec(text)) !== null) {
    const val = em[1].trim().toUpperCase();
    if (!engineNumbers.includes(val)) engineNumbers.push(val);
  }

  return {
    applicant,
    beneficiary,
    amount: numericAmount,
    currency,
    portOfLoading,
    portOfDischarge,
    paymentTerms,
    latestShipmentDate,
    expiryDate,
    lcNumber,
    incoterm,
    hsCode,
    vehicleDescription,
    piReference,
    chassisNumbers,
    engineNumbers,
  };
};