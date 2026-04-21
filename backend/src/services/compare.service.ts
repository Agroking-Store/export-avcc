import { ParsedLC } from "./lcParser.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CompareField {
  field: string;
  piValue: string;
  lcValue: string;
  type?: "vehicle"; // marks rows that are per-vehicle details
}

export interface CompareResult {
  status: "PASSED" | "FAILED";
  mismatches: CompareField[];
  matchedFields: CompareField[];
  // Convenience flags for the UI
  vehicleMismatch: boolean;
  wrongLCAttached: boolean; // true when chassis list has zero overlap
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

const normalize = (val: any): string =>
  String(val ?? "")
    .toLowerCase()
    .replace(/[,\.\-\(\)\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeAmount = (val: any): string => {
  const n = parseFloat(String(val ?? "").replace(/[^0-9\.]/g, ""));
  return isNaN(n) ? "" : n.toFixed(2);
};

const portsMatch = (a: string, b: string): boolean => {
  const an = normalize(a), bn = normalize(b);
  if (!an || !bn) return false;
  return an === bn || an.includes(bn) || bn.includes(an);
};

const namesMatch = (a: string, b: string): boolean => {
  const an = normalize(a), bn = normalize(b);
  if (!an || !bn) return false;
  return an === bn || an.includes(bn) || bn.includes(an);
};

// ─── PI data accessor ─────────────────────────────────────────────────────────
//
// getPIData() hits  /proforma-invoices/:id/data  which returns the full PI
// document as populated by Mongoose. The shape may be:
//   { totalAmount, portOfLoading, vehicleDetails: [...], client_id: {...}, ... }
// OR it may be wrapped:
//   { data: { totalAmount, ... } }
//
// We normalise both here so the compare logic never has to worry.

const unwrap = (pi: any): any => {
  if (!pi) return {};
  // If the API wraps in { data: ... } or { proformaInvoice: ... }
  return pi.data ?? pi.proformaInvoice ?? pi;
};

// ─── Main comparison ──────────────────────────────────────────────────────────

export const compareLCWithPI = (lc: ParsedLC, rawPI: any): CompareResult => {
  const pi = unwrap(rawPI);

  const mismatches: CompareField[] = [];
  const matchedFields: CompareField[] = [];

  const add = (match: boolean, entry: CompareField) =>
    (match ? matchedFields : mismatches).push(entry);

  // ── 1. Applicant / Buyer ────────────────────────────────────────────────
  const piApplicant =
    pi.client_id?.name ||
    pi.client_id?.companyName ||
    pi.clientSnapshot?.name ||
    "";
  add(namesMatch(piApplicant, lc.applicant), {
    field: "Applicant / Buyer Name",
    piValue: piApplicant,
    lcValue: lc.applicant,
  });

  // ── 2. Beneficiary / Exporter ───────────────────────────────────────────
  const piBeneficiary =
    pi.company_id?.name || pi.companySnapshot?.name || "";
  if (piBeneficiary || lc.beneficiary) {
    add(namesMatch(piBeneficiary, lc.beneficiary), {
      field: "Beneficiary / Exporter",
      piValue: piBeneficiary,
      lcValue: lc.beneficiary,
    });
  }

  // ── 3. Total Amount ──────────────────────────────────────────────────────
  // totalAmount lives directly on the PI document
  const piAmount = String(pi.totalAmount ?? pi.total_amount ?? "");
  const lcAmt = normalizeAmount(lc.amount);
  const piAmt = normalizeAmount(piAmount);
  add(!!piAmt && !!lcAmt && piAmt === lcAmt, {
    field: "Total Amount",
    piValue: piAmount ? `USD ${piAmt}` : "—",
    lcValue: lc.amount ? `USD ${lcAmt}` : "—",
  });

  // ── 4. Currency ──────────────────────────────────────────────────────────
  const piCurrency = (pi.currency ?? "USD").toUpperCase();
  add(normalize(piCurrency) === normalize(lc.currency), {
    field: "Currency",
    piValue: piCurrency,
    lcValue: lc.currency,
  });

  // ── 5. Port of Loading ───────────────────────────────────────────────────
  add(portsMatch(pi.portOfLoading ?? "", lc.portOfLoading), {
    field: "Port of Loading",
    piValue: pi.portOfLoading ?? "—",
    lcValue: lc.portOfLoading,
  });

  // ── 6. Port of Discharge ─────────────────────────────────────────────────
  add(portsMatch(pi.portOfDischarge ?? "", lc.portOfDischarge), {
    field: "Port of Discharge",
    piValue: pi.portOfDischarge ?? "—",
    lcValue: lc.portOfDischarge,
  });

  // ── 7. Payment Terms ─────────────────────────────────────────────────────
  const piPayment = pi.paymentTerms ?? "";
  const lcPayment = lc.paymentTerms;
  const payNorm = (s: string) =>
    normalize(s).replace(/\bat\b/g, "").replace(/\bby\b/g, "").trim();
  add(payNorm(piPayment) === payNorm(lcPayment) ||
    payNorm(piPayment).includes(payNorm(lcPayment)) ||
    payNorm(lcPayment).includes(payNorm(piPayment)), {
    field: "Payment Terms",
    piValue: piPayment || "—",
    lcValue: lcPayment,
  });

  // ── 8. Incoterm ──────────────────────────────────────────────────────────
  const piIncoterm = (pi.incoterm ?? "").toUpperCase();
  const lcIncoterm = lc.incoterm.toUpperCase();
  if (piIncoterm || lcIncoterm) {
    add(normalize(piIncoterm) === normalize(lcIncoterm), {
      field: "Incoterm",
      piValue: piIncoterm || "—",
      lcValue: lcIncoterm || "—",
    });
  }

  // ── 9. HS Code ───────────────────────────────────────────────────────────
  const piHsn = (pi.vehicleDetails?.[0]?.hsn ?? "").replace(/\./g, "");
  const lcHsn = lc.hsCode.replace(/\./g, "");
  if (piHsn || lcHsn) {
    add(!!piHsn && !!lcHsn && piHsn === lcHsn, {
      field: "HS Code",
      piValue: pi.vehicleDetails?.[0]?.hsn ?? "—",
      lcValue: lc.hsCode,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── 10. Vehicle / Chassis / Engine matching ───────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  //
  // Strategy:
  //   - Collect all chassis numbers and engine numbers from the PI
  //   - Compare with what the LC extracted
  //   - Any chassis in the LC that's NOT in the PI = mismatch (wrong LC)
  //   - Any chassis in the PI that's NOT in the LC = mismatch (vehicle missing from LC)

  const piVehicles: { chassisNo: string; engineNo: string; model: string }[] =
    (pi.vehicleDetails ?? []).map((v: any) => ({
      chassisNo: (v.chassisNo ?? "").toUpperCase().trim(),
      engineNo: (v.engineNo ?? "").toUpperCase().trim(),
      model: v.model ?? "",
    }));

  const piChassisList = piVehicles.map((v) => v.chassisNo).filter(Boolean);
  const piEngineList = piVehicles.map((v) => v.engineNo).filter(Boolean);
  const lcChassisList = lc.chassisNumbers; // already uppercase from parser
  const lcEngineList = lc.engineNumbers;

  // ── Chassis comparison ──────────────────────────────────────────────────

  if (lcChassisList.length > 0 || piChassisList.length > 0) {
    // Chassis in LC but NOT in PI  →  wrong/different LC
    const extraInLC = lcChassisList.filter((c) => !piChassisList.includes(c));
    // Chassis in PI but NOT in LC  →  vehicle not covered by LC
    const missingFromLC = piChassisList.filter((c) => !lcChassisList.includes(c));
    // Perfect match set
    const matched = lcChassisList.filter((c) => piChassisList.includes(c));

    if (extraInLC.length === 0 && missingFromLC.length === 0) {
      matchedFields.push({
        field: "Chassis Numbers",
        piValue: piChassisList.join(", "),
        lcValue: lcChassisList.join(", "),
        type: "vehicle",
      });
    } else {
      if (extraInLC.length > 0) {
        mismatches.push({
          field: "Chassis in LC not found in PI",
          piValue: piChassisList.join(", ") || "—",
          lcValue: extraInLC.join(", "),
          type: "vehicle",
        });
      }
      if (missingFromLC.length > 0) {
        mismatches.push({
          field: "PI Chassis not covered by LC",
          piValue: missingFromLC.join(", "),
          lcValue: lcChassisList.join(", ") || "—",
          type: "vehicle",
        });
      }
      // Also show matched chassis for context
      if (matched.length > 0) {
        matchedFields.push({
          field: `Chassis Matched (${matched.length}/${piChassisList.length})`,
          piValue: matched.join(", "),
          lcValue: matched.join(", "),
          type: "vehicle",
        });
      }
    }
  }

  // ── Engine comparison ────────────────────────────────────────────────────
  // LC often doesn't list engine numbers (they're in the PI only)
  // Only compare if LC actually extracted engine numbers
  if (lcEngineList.length > 0) {
    const extraEngines = lcEngineList.filter((e) => !piEngineList.includes(e));
    const missingEngines = piEngineList.filter((e) => !lcEngineList.includes(e));

    if (extraEngines.length === 0 && missingEngines.length === 0) {
      matchedFields.push({
        field: "Engine Numbers",
        piValue: piEngineList.join(", "),
        lcValue: lcEngineList.join(", "),
        type: "vehicle",
      });
    } else {
      if (extraEngines.length > 0) {
        mismatches.push({
          field: "Engine Numbers in LC not found in PI",
          piValue: piEngineList.join(", ") || "—",
          lcValue: extraEngines.join(", "),
          type: "vehicle",
        });
      }
    }
  }

  // ── Quantity check ────────────────────────────────────────────────────────
  // LC qty derived from how many chassis it lists vs PI vehicle count
  if (lcChassisList.length > 0 && piChassisList.length > 0) {
    const piQty = piChassisList.length;
    const lcQty = lcChassisList.length;
    if (piQty !== lcQty) {
      mismatches.push({
        field: "Vehicle Quantity",
        piValue: `${piQty} vehicle${piQty > 1 ? "s" : ""}`,
        lcValue: `${lcQty} vehicle${lcQty > 1 ? "s" : ""}`,
        type: "vehicle",
      });
    } else {
      matchedFields.push({
        field: "Vehicle Quantity",
        piValue: `${piQty}`,
        lcValue: `${lcQty}`,
        type: "vehicle",
      });
    }
  }

  // ── wrongLCAttached flag ──────────────────────────────────────────────────
  // If LC has chassis numbers but NONE of them match any PI chassis,
  // this is almost certainly a completely wrong LC document.
  const overlapCount = lcChassisList.filter((c) => piChassisList.includes(c)).length;
  const wrongLCAttached =
    lcChassisList.length > 0 && piChassisList.length > 0 && overlapCount === 0;

  const vehicleMismatch = mismatches.some((m) => m.type === "vehicle");

  return {
    status: mismatches.length === 0 ? "PASSED" : "FAILED",
    mismatches,
    matchedFields,
    vehicleMismatch,
    wrongLCAttached,
  };
};