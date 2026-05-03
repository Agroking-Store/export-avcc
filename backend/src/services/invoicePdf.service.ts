import puppeteer, { Browser } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

let browserInstance: Browser | null = null;

const getBrowserExecutablePath = () => {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const getBrowser = async (): Promise<Browser> => {
  if (!browserInstance) {
    const executablePath = getBrowserExecutablePath();

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    });
  }

  return browserInstance;
};

const templateCache = new Map<string, HandlebarsTemplateDelegate<any>>();

const getTemplate = (templateName: string) => {
  if (!templateCache.has(templateName)) {
    const templatePath = path.join(
      __dirname,
      "../templates",
      `${templateName}.hbs`,
    );
    const html = fs.readFileSync(templatePath, "utf8");
    templateCache.set(templateName, handlebars.compile(html));
  }

  return templateCache.get(templateName)!;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const renderInvoicePDF = async ({
  templateName,
  data,
  invoiceNumber,
}: {
  templateName: "usdInvoice" | "commercialInvoice" | "inrInvoice" | "packingList";
  data: Record<string, any>;
  invoiceNumber: string;
}): Promise<Buffer> => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const template = getTemplate(templateName);
    const html = template(data);

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: false,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width:100%; font-size:8px; color:#000; padding:0 12mm; box-sizing:border-box; font-family: Arial, Helvetica, sans-serif;">
          <div style="display:flex; justify-content:space-between; width:100%;">
            <span>${escapeHtml(invoiceNumber)}</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        </div>
      `,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "12mm",
        right: "12mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
};
