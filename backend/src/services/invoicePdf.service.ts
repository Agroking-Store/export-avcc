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
      headless: "new",
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

export const renderInvoicePDF = async ({
  templateName,
  data,
  invoiceNumber: _invoiceNumber,
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
