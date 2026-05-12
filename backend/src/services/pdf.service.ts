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
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

// const getBrowser = async (): Promise<Browser> => {
//   if (!browserInstance) {
//     browserInstance = await puppeteer.launch({
//       headless: true,
//       executablePath: getBrowserExecutablePath(),
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage", // Helps prevent memory issues on servers
//         "--disable-gpu",
//         "--no-zygote",
//       ],
//     });
//   }
//   return browserInstance;
// };

const getBrowser = async (): Promise<Browser> => {
  if (browserInstance) {
    try {
      await browserInstance.version();
    } catch (e) {
      browserInstance = null;
    }
  }

  if (!browserInstance) {
    console.log("Launching new browser instance for PDF...");
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: getBrowserExecutablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ],
    });
  }
  return browserInstance;
};

// export const generateProformaInvoicePDF = async (
//   invoiceData: any,
// ): Promise<Buffer> => {
//   let browser: Browser | null = null;
//   let page: any = null;

//   try {
//     const templatePath = path.join(
//       process.cwd(),
//       "src/templates/proforma-invoice.hbs",
//     );
//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = handlebars.compile(templateHtml);
//     const finalHtml = template(invoiceData);

//     browser = await getBrowser();
//     page = await browser.newPage();

//     await page.setContent(finalHtml, {
//       waitUntil: "networkidle0",
//       timeout: 30000,
//     });

//     const pdfUint8Array = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
//     });

//     await page.close();
//     return Buffer.from(pdfUint8Array);
//   } catch (error) {
//     console.error("Error in PDF generation service:", error);
//     if (page) await page.close().catch(() => {});
//     throw new Error("Failed to generate Proforma Invoice PDF");
//   }
// };

export const generateProformaInvoicePDF = async (
  invoiceData: any,
): Promise<Buffer> => {
  // Launch fresh for every request - solves the "Connection Closed" error on Linux
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: getBrowserExecutablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  try {
    // Correct template path using process.cwd() to work in both src and dist
    const templatePath = path.join(
      process.cwd(),
      "src/templates/proforma-invoice.hbs",
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateHtml);
    const finalHtml = template(invoiceData);

    const page = await browser.newPage();
    await page.setContent(finalHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    return Buffer.from(pdfUint8Array);
  } catch (error) {
    console.error("Error in PDF generation service:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
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

// export const savePIPdfToDisk = async (piData: any): Promise<string> => {
//   const pdfBuffer = await generateProformaInvoicePDF(piData);

//   const dirPath = path.join(process.cwd(), "uploads", "proforma-invoices");
//   if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

//   const safeNumber = piData.invoiceNumber.replace(/\//g, "-");
//   const fileName = `doc-${Date.now()}-${safeNumber}.pdf`;
//   const relativePath = path.join("uploads", "proforma-invoices", fileName);
//   const absolutePath = path.join(process.cwd(), relativePath);

//   fs.writeFileSync(absolutePath, pdfBuffer);
//   return relativePath;
// };

export const savePIPdfToDisk = async (piData: any): Promise<string> => {
  const pdfBuffer = await generateProformaInvoicePDF(piData);
  const dirPath = path.join(process.cwd(), "uploads", "proforma-invoices");

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const safeNumber = (piData.invoiceNumber || "PI").replace(/\//g, "-");
  const fileName = `doc-${Date.now()}-${safeNumber}.pdf`;
  const relativePath = path.join("uploads", "proforma-invoices", fileName);
  const absolutePath = path.join(process.cwd(), relativePath);

  fs.writeFileSync(absolutePath, pdfBuffer);
  return relativePath;
};
