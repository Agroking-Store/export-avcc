import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";

// Resolve template relative to this file — works on any OS, any cwd
const TEMPLATE_PATH = path.join(__dirname, "../templates/proformaInvoice.hbs");
const OUTPUT_DIR = path.join(__dirname, "../../uploads/pi-pdfs");

// Ensure the output directory exists at startup
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const readTemplate = (): string => {
  return fs.readFileSync(TEMPLATE_PATH, "utf-8");
};

/**
 * Builds the Handlebars data object from a populated PI mongoose doc.
 */
const buildTemplateData = (pi: any): Record<string, any> => {
  const company = pi.company_id || pi.companySnapshot || {};
  const client  = pi.client_id  || pi.clientSnapshot  || {};

  const bankDetails = company.bankDetails || {};

  // Address helper — handles both string and object address
  const formatAddress = (addr: any): string => {
    if (!addr) return "";
    if (typeof addr === "string") return addr;
    return [
      addr.houseBuilding,
      addr.streetArea,
      addr.cityTown,
      addr.state && addr.pincode ? `${addr.state} - ${addr.pincode}` : addr.state || addr.pincode,
      addr.country,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const items = (pi.vehicleDetails || []).map((v: any, idx: number) => {
    const rate   = (Number(v.fob) || 0) + (Number(v.freight) || 0);
    const qty    = Number(v.quantity) || 1;
    const amount = (qty * rate).toFixed(2);

    return {
      slNo: idx + 1,
      description: `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle",
      qty,
      per: "No",
      rate: rate.toFixed(2),
      amount,
      specs: {
        color:           v.color   || v.colour || "",
        chassisNo:       v.chassisNo || "",
        engineCapacity:  v.engineCapacity || v.cc || "",
        fuelType:        v.fuelType || v.fuel || "",
        countryOfOrigin: v.countryOfOrigin || v.origin || "India",
        hsn:             v.commercialHsnCode || v.hsnCode || v.commercialHsn || v.hsn || "",
        yom:             v.yom || v.year || "",
        fob:             v.fob ? Number(v.fob).toFixed(2) : "",
        freight:         v.freight ? Number(v.freight).toFixed(2) : "",
      },
    };
  });

  const totalQty    = items.reduce((s: number, i: any) => s + i.qty, 0);
  const totalAmount = Number(pi.totalAmount || 0).toFixed(2);

  return {
    invoiceNumber: pi.piNumber || "",
    date: pi.createdAt
      ? new Date(pi.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),

    paymentTerms:       pi.paymentTerms || "",
    buyersRef:          pi.buyersRef || "",
    otherRef:           pi.otherRef || pi.piNumber || "",
    dispatchedThrough:  pi.dispatchedThrough || "",
    destination:        pi.portOfDischarge || "",
    termsOfDelivery:    pi.termsOfDelivery || "",
    incoterm:           pi.incoterm || "",
    portOfLoading:      pi.portOfLoading || "",
    portOfDischarge:    pi.portOfDischarge || "",
    amountInWords:      pi.amountInWords || "",

    exporter: {
      name:      company.name || "",
      address:   formatAddress(company.address),
      gstin:     company.gstNumber || company.gstin || "",
      state:     company.address?.state || "",
      stateCode: company.address?.stateCode || "",
    },

    consignee: {
      name:    client.name || client.companyName || "",
      address: formatAddress(client.address),
      state:   client.address?.country || client.country || "",
    },

    buyer: {
      name:    client.name || client.companyName || "",
      address: formatAddress(client.address),
      state:   client.address?.country || client.country || "",
    },

    bankDetails: {
      bankName:   bankDetails.bankName   || pi.company_id?.bankDetails?.bankName   || "",
      accountNo:  bankDetails.accountNo  || pi.company_id?.bankDetails?.accountNo  || "",
      branchIfsc: bankDetails.branchIfsc || pi.company_id?.bankDetails?.branchIfsc || "",
      swiftCode:  bankDetails.swiftCode  || pi.company_id?.bankDetails?.swiftCode  || "",
    },

    items,
    totalQty,
    totalAmount,
  };
};

/**
 * Generates a PDF for the given PI and saves it to uploads/pi-pdfs/.
 * Returns the relative path stored in the DB (e.g. "uploads/pi-pdfs/PI-001.pdf").
 */
export const generateAndStorePIPdf = async (pi: any): Promise<string> => {
  const templateSrc = readTemplate();
  const template    = Handlebars.compile(templateSrc);
  const html        = template(buildTemplateData(pi));

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    // On server: set PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser in .env
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const safeNumber = (pi.piNumber || `pi-${Date.now()}`).replace(/[\/\\:*?"<>|]/g, "-");
    const fileName   = `${safeNumber}.pdf`;
    const filePath   = path.join(OUTPUT_DIR, fileName);

    await page.pdf({
      path:   filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    // Return a relative path — no leading slash, OS-independent
    return `uploads/pi-pdfs/${fileName}`;
  } finally {
    await browser.close();
  }
};
