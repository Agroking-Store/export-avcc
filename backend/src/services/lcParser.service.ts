// export interface ParsedLC {
//   applicant: string;
//   beneficiary: string;
//   amount: string;
//   currency: string;
//   portOfLoading: string;
//   portOfDischarge: string;
//   paymentTerms: string;
//   latestShipmentDate: string;
//   expiryDate: string;
//   lcNumber: string;
//   incoterm: string;
//   hsCode: string;
//   vehicleDescription: string;
//   piReference: string;
//   // Extracted chassis / engine numbers from LC goods description
//   chassisNumbers: string[];
//   engineNumbers: string[];
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const clean = (s: string): string =>
//   s.replace(/---\s*PAGE BREAK\s*---/gi, " ")
//     .replace(/\s+/g, " ")
//     .trim();

// /** Try a list of regexes, return first match group 1 (cleaned) */
// const first = (text: string, patterns: RegExp[]): string => {
//   for (const re of patterns) {
//     const m = text.match(re);
//     if (m) return clean(m[1] ?? m[0]);
//   }
//   return "";
// };

// /**
//  * Extract a SWIFT MT700 field block.
//  * Captures everything after "NN[X]: label\n" until the next field tag.
//  */
// const swiftBlock = (text: string, tag: string): string => {
//   // Matches e.g.  "50: Applicant\n  AUTODIRECT...\n59: Beneficiary"
//   const re = new RegExp(
//     `${tag}[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*[0-9]{2}[A-Z]?:\\s)`,
//     "i"
//   );
//   const m = text.match(re);
//   return m ? clean(m[1]) : "";
// };

// // ─── Main parser ─────────────────────────────────────────────────────────────

// export const parseLC = (rawText: string): ParsedLC => {
//   const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

//   // ── Applicant (field 50) ──────────────────────────────────────────────────
//   // Extract ONLY the first line (company name), not the full address block
//   const applicantBlock = swiftBlock(text, "50[A-Z]?");
//   const applicant = applicantBlock.split(/\n/)[0].trim()
//     || first(text, [/Applicant[:\-\s]+(.*)/i]);

//   // ── Beneficiary (field 59) ────────────────────────────────────────────────
//   const beneficiaryBlock = swiftBlock(text, "59[A-Z]?");
//   const beneficiary = beneficiaryBlock.split(/\n/)[0].trim()
//     || first(text, [/Beneficiary[:\-\s]+(.*)/i]);

//   // ── Amount & currency (field 32B) ─────────────────────────────────────────
//   // Format: "USD30300," or "USD 30,300.00"
//   const amountLine = first(text, [
//     /32B[:\s]+Currency Code,?\s*Amount\s*\n\s*(USD[\d,\.]+)/i,
//     /32B[:\s]+(USD[\d,\.]+)/i,
//     /L\/C Amount[:\s|]+(USD[\d,\.]+)/i,
//     /L\/C Amount[:\s|]+USD\s*([\d,\.]+)/i,
//   ]);
//   const currency = amountLine.match(/^(USD|EUR|GBP|JPY)/i)?.[1]?.toUpperCase() ?? "USD";
//   const numericAmount = amountLine
//     .replace(/^(USD|EUR|GBP|JPY)/i, "")
//     .replace(/,/g, "")
//     .replace(/\.$/, "")
//     .trim();

//   // ── Ports ─────────────────────────────────────────────────────────────────
//   // Port of Loading = field 44E, but strip everything after page break
//   const polRaw = first(text, [
//     /44E[:\s]+Port of Loading[^\n]*\n\s*([^\n]+)/i,
//     /44E[:\s]+([^\n]+)/i,
//     /Port of Loading[^\n]*[:\s]+([^\n|]+)/i,
//   ]);
//   // Strip any page-break artifact
//   const portOfLoading = polRaw.replace(/---.*$/, "").trim();

//   const podRaw = first(text, [
//     /44F[:\s]+Port of Discharge[^\n]*\n\s*([^\n]+)/i,
//     /44F[:\s]+([^\n]+)/i,
//     /Port of Discharge[^\n]*[:\s]+([^\n|]+)/i,
//   ]);
//   const portOfDischarge = podRaw.replace(/---.*$/, "").trim();

//   // ── Payment terms (field 42C) ─────────────────────────────────────────────
//   const paymentTerms = first(text, [
//     /42C[:\s]+Drafts at\.\.\.\s*\n\s*([^\n]+)/i,
//     /42C[:\s]+([^\n]+)/i,
//     /Drafts at[:\s]+([^\n]+)/i,
//   ]) || "SIGHT";

//   // ── Dates ─────────────────────────────────────────────────────────────────
//   const latestShipmentDate = first(text, [
//     /44C[:\s]+Latest Date of Shipment\s*\n\s*([^\n]+)/i,
//     /44C[:\s]+([^\n]+)/i,
//   ]);
//   const expiryDate = first(text, [
//     /31D[:\s]+Date and Place of Expiry\s*\n\s*([^\n]+)/i,
//     /31D[:\s]+([^\n]+)/i,
//     /L\/C Expiry Date[:\s|]+([^\n|]+)/i,
//   ]);

//   // ── LC number (field 20) ──────────────────────────────────────────────────
//   const lcNumber = first(text, [
//     /20[:\s]+Documentary Credit Number\s*\n\s*([^\n]+)/i,
//     /20[:\s]+([^\n]+)/i,
//     /L\/C Ref No\.?[:\s|]+([0-9]+)/i,
//   ]);

//   // ── HS Code ───────────────────────────────────────────────────────────────
//   const hsCode = first(text, [
//     /HS\s*CODE?\s*[-–]\s*([\d\.]+)/i,
//     /HSN[:\s]+([\d\.]+)/i,
//   ]);

//   // ── Incoterm ──────────────────────────────────────────────────────────────
//   const incoterm = first(text, [/\b(CFR|CIF|FOB|DAP|DDP|EXW|FCA|CPT|CIP|DPU)\b/i]).toUpperCase();

//   // ── Vehicle description (field 45A) ───────────────────────────────────────
//   const vehicleDescription = clean(
//     first(text, [
//       /45A[:\s]+Description of Goods[^\n]*\n([\s\S]*?)(?=\n\s*[0-9]{2}[A-Z]?:)/i,
//     ])
//   );

//   // ── PI reference ──────────────────────────────────────────────────────────
//   const piReference = first(text, [
//     /PROFORMA INVOICE NO\.?\s*([A-Z0-9\/\-]+)/i,
//     /AN\/[\d\-]+\/\d+\/PI/,
//   ]);

//   // ── Chassis numbers from LC goods description ─────────────────────────────
//   // MT700 field 45A lists chassis like:  CHASSIS NO: MBHKWD43STA763667
//   const chassisNumbers: string[] = [];
//   const chassisRegex = /CHASSIS\s+NO[:\s]+([A-Z0-9]+)/gi;
//   let cm: RegExpExecArray | null;
//   while ((cm = chassisRegex.exec(text)) !== null) {
//     const val = cm[1].trim().toUpperCase();
//     if (!chassisNumbers.includes(val)) chassisNumbers.push(val);
//   }

//   // ── Engine numbers from LC goods description ──────────────────────────────
//   const engineNumbers: string[] = [];
//   const engineRegex = /ENGINE\s+NO[:\s]+([A-Z0-9]+)/gi;
//   let em: RegExpExecArray | null;
//   while ((em = engineRegex.exec(text)) !== null) {
//     const val = em[1].trim().toUpperCase();
//     if (!engineNumbers.includes(val)) engineNumbers.push(val);
//   }

//   return {
//     applicant,
//     beneficiary,
//     amount: numericAmount,
//     currency,
//     portOfLoading,
//     portOfDischarge,
//     paymentTerms,
//     latestShipmentDate,
//     expiryDate,
//     lcNumber,
//     incoterm,
//     hsCode,
//     vehicleDescription,
//     piReference,
//     chassisNumbers,
//     engineNumbers,
//   };
// };


// backend/src/services/lcParser.service.ts
//
// Real-world SWIFT LC PDFs come in two layouts:
//
//  FORMAT A — Two-column (direct bank SWIFT printout, e.g. Sampath Bank):
//    "   F50: Applicant                             AUTODIRECT (PVT) LTD"
//    "                                              NO.15,PARK CIRCUS,"
//    Tag+label left column, value right column, separated by 5+ spaces.
//    Continuation lines have no tag, just more value in the right column.
//
//  FORMAT B — Single-column (advisory letter, e.g. IDFC First advisory):
//    "50: Applicant"
//    "   AUTODIRECT (PVT) LTD"
//    Tag on its own line, value starts on the next indented line.
//
// Strategy for Format A: split each line on 5+ consecutive spaces.
//   - Left part = tag+label  →  right part = value
//   - Continuation lines have an empty left part and a value right part

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
  chassisNumbers: string[];
  engineNumbers: string[];
}

// ─── Pre-process: build a flat key→value map from two-column layout ───────────

interface FieldMap {
  [normalizedTag: string]: string; // tag (lowercased, no "F" prefix) → first value line
}

/**
 * Parse a two-column SWIFT document into a map of tag → value.
 * Also returns the raw lines for fields that need multi-line values.
 */
const buildFieldMap = (text: string): FieldMap => {
  const map: FieldMap = {};
  const lines = text.split("\n");

  let currentTag: string | null = null;

  for (const line of lines) {
    // Split on 5+ spaces (column separator)
    const parts = line.split(/\s{5,}/);
    const left = (parts[0] ?? "").trim();
    const right = (parts[1] ?? "").trim();

    // Does the left side contain a field tag?  e.g. "F50: Applicant" or "F32B: Currency Code, Amount"
    const tagMatch = left.match(/^F?([0-9]{2}[A-Z]?):\s*(.*)/i);

    if (tagMatch) {
      const tag = tagMatch[1].toUpperCase(); // "50", "32B", "44E" …
      currentTag = tag;
      if (right && !map[tag]) {
        map[tag] = right;
      }
    } else if (currentTag && right && !map[currentTag]) {
      // Continuation line — first value line for this tag
      map[currentTag] = right;
    } else if (currentTag && right && map[currentTag]) {
      // Additional continuation — append only for multiline fields we care about
      // (45A vehicle description).  For all others, keep only the first line.
      if (currentTag === "45A") {
        map[currentTag] += " " + right;
      }
    }
  }

  return map;
};

// ─── Fallback: single-column extraction (Format B) ───────────────────────────

const extractSingleCol = (text: string, tag: string): string => {
  // tag may be "50" or "F?50" style regex fragment
  const re = new RegExp(`F?${tag}:[^\\n]*\\n\\s+([^\\n]+)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
};

const firstMatch = (text: string, patterns: RegExp[]): string => {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return (m[1] ?? m[0]).replace(/\s+/g, " ").trim();
  }
  return "";
};

const clean = (s: string): string =>
  s.replace(/---\s*PAGE BREAK\s*---/gi, " ").replace(/\s+/g, " ").trim();

// ─── Main parser ──────────────────────────────────────────────────────────────

export const parseLC = (rawText: string): ParsedLC => {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Build field map from two-column layout
  const fm = buildFieldMap(text);

  // Helper: try field map first, fall back to single-column, then free-text regex
  const get = (tag: string, fallbacks: RegExp[] = []): string => {
    const upper = tag.toUpperCase().replace(/^F/, "");
    if (fm[upper]) return fm[upper].trim();
    const sc = extractSingleCol(text, upper);
    if (sc) return sc;
    return firstMatch(text, fallbacks);
  };

  // ── Applicant (50) ─────────────────────────────────────────────────────────
  // Field map gives us the first line (company name) — exactly what we want
  const applicant = get("50", [/Applicant[:\-\s]+([A-Z][^\n]+)/i]);

  // ── Beneficiary (59) ──────────────────────────────────────────────────────
  // Note: some banks spell it "Benificiary" (typo) — the tag still works
  const beneficiary = get("59", [/Beni?ficiary[:\-\s]+([A-Z][^\n]+)/i]);

  // ── Amount & Currency (32B) ───────────────────────────────────────────────
  // fm["32B"] = "USD 46500.00" or "USD30300,"
  const amountRaw = get("32B", [
    /F?32B[^\n]*\s{5,}(USD[\s\d,\.]+)/i,
    /L\/C Amount[:\s|]+(USD[\s\d,\.]+)/i,
  ]);
  const currencyMatch = amountRaw.match(/^(USD|EUR|GBP|JPY)\s*([\d,\.]+)/i);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "USD";
  const numericAmount = amountRaw
    .replace(/^(USD|EUR|GBP|JPY)\s*/i, "")
    .replace(/,/g, "")
    .replace(/\/-?$/, "")   // strip trailing "/-" e.g. "15,500/-"
    .trim();

  // ── Ports (44E / 44F) ─────────────────────────────────────────────────────
  // Format A lines look like: "F44E: Port of Loading... :      ANY PORT IN INDIA"
  // The extra ":" after the label is part of the label text — strip it from value
  const polRaw = get("44E", [/Port of Loading[^\n:]*[:\s]+([^\n|]+)/i]);
  const portOfLoading = clean(polRaw).replace(/^:\s*/, "");

  const podRaw = get("44F", [/Port of Dis[^:\n]*[:\s]+([^\n|]+)/i]);
  const portOfDischarge = clean(podRaw).replace(/^:\s*/, "");

  // ── Payment terms (42C) ───────────────────────────────────────────────────
  const paymentTerms = get("42C", [
    /Draft[s]?\s+[Aa]t[:\s]+([^\n]+)/i,
  ]) || "SIGHT";

  // ── Latest shipment date (44C) ────────────────────────────────────────────
  const latestShipmentDate = get("44C", [
    /Latest Date of Shipment[:\s]+([^\n|]+)/i,
  ]);

  // ── Expiry date (31D) ─────────────────────────────────────────────────────
  const expiryDate = get("31D", [
    /L\/C Expiry Date[:\s|]+([^\n|]+)/i,
  ]);

  // ── LC number (20) ────────────────────────────────────────────────────────
  const lcNumber = get("20", [
    /Documentary Credit Number[^\n]*\n?\s*([0-9]+)/i,
    /L\/C Ref No\.?[:\s|]+([0-9]+)/i,
  ]);

  // ── HS Code ───────────────────────────────────────────────────────────────
  const hsCode = firstMatch(text, [
    /HS\s*CODE?\s*[-–:]\s*([\d\.]+)/i,
    /HSN[:\s]+([\d\.]+)/i,
  ]);

  // ── Incoterm ──────────────────────────────────────────────────────────────
  const incoterm = firstMatch(text, [
    /\b(CFR|CIF|FOB|DAP|DDP|EXW|FCA|CPT|CIP|DPU)\b/,
  ]).toUpperCase();

  // ── Vehicle description (45A) ─────────────────────────────────────────────
  const vehicleDescription = clean(fm["45A"] || firstMatch(text, [
    /F?45A:[^\n]*\n([\s\S]*?)(?=\nF?46[A-Z]?:)/i,
  ]));

  // ── PI reference ──────────────────────────────────────────────────────────
  const piReference = firstMatch(text, [
    /PROFORMA INVOICE NO\.?\s*(AN\/[\d\-]+\/\d+\/PI)/i,
    /(AN\/[\d\-]+\/\d+\/PI)/,
  ]);

  // ── Chassis numbers (from goods description anywhere in document) ─────────
  const chassisNumbers: string[] = [];
  const chassisRe = /CHASSIS\s+NO[:\s]+([A-Z0-9]+)/gi;
  let cm: RegExpExecArray | null;
  while ((cm = chassisRe.exec(text)) !== null) {
    const val = cm[1].trim().toUpperCase();
    if (!chassisNumbers.includes(val)) chassisNumbers.push(val);
  }

  // ── Engine numbers ────────────────────────────────────────────────────────
  const engineNumbers: string[] = [];
  const engineRe = /ENGINE\s+NO[:\s]+([A-Z0-9]+)/gi;
  let em: RegExpExecArray | null;
  while ((em = engineRe.exec(text)) !== null) {
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