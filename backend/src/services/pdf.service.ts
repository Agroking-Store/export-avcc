import puppeteer, { Browser } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

// Keep a single browser instance alive for faster PDF generation
let browserInstance: Browser | null = null;

const getBrowserExecutablePath = () => {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  const candidates = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const getBrowser = async (): Promise<Browser> => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: getBrowserExecutablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Helps prevent memory issues on servers
        "--disable-gpu",
        "--no-zygote",
      ],
    });
  }
  return browserInstance;
};

export const generateProformaInvoicePDF = async (
  invoiceData: any,
): Promise<Buffer> => {
  try {
    // 1. Resolve template path (Make sure you move proforma-invoice.hbs to this location)
    const templatePath = path.join(
      __dirname,
      "../templates/proforma-invoice.hbs",
    );

    // 2. Read and compile the Handlebars template
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateHtml);
    const finalHtml = template(invoiceData);

    // 3. Get the persistent browser instance and open a new tab (page)
    const browser = await getBrowser();
    const page = await browser.newPage();

    // 4. Inject our HTML into the page
    // waitUntil: 'networkidle0' ensures any remote assets (like web fonts or logos) load before printing
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    // 5. Generate the PDF buffer natively via Chrome
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true, // Ensures CSS background colors are printed
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    // 6. Close the tab to free up memory (but keep browser open!)
    await page.close();

    // 7. Return Node.js Buffer
    return Buffer.from(pdfUint8Array);
  } catch (error) {
    console.error("Error in PDF generation service:", error);
    throw new Error("Failed to generate Proforma Invoice PDF");
  }
};

export const savePIPdfLocally = async (
  piId: string | any,
  piNumber: string,
  invoiceData: any,
): Promise<string> => {
  const pdfBuffer = await generateProformaInvoicePDF(invoiceData);

  const uploadDir = path.join(process.cwd(), "uploads", "proforma-invoices");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `PI-${piNumber.replace(/\//g, "-")}-${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, pdfBuffer);

  return `/uploads/proforma-invoices/${fileName}`;
};

export const savePIPdfToDisk = async (piData: any): Promise<string> => {
  const pdfBuffer = await generateProformaInvoicePDF(piData);

  const dirPath = path.join(process.cwd(), "uploads", "proforma-invoices");
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const safeNumber = piData.invoiceNumber.replace(/\//g, "-");
  const fileName = `doc-${Date.now()}-${safeNumber}.pdf`;
  const relativePath = path.join("uploads", "proforma-invoices", fileName);
  const absolutePath = path.join(process.cwd(), relativePath);

  fs.writeFileSync(absolutePath, pdfBuffer);
  return relativePath;
};
