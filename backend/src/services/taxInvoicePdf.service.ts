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

const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      // headless: "new",
      executablePath: getBrowserExecutablePath(),
      args: ["--no-sandbox"],
    });
  }
  return browserInstance;
};

export const generateTaxInvoicePDF = async (data: any): Promise<Buffer> => {
  const templatePath = path.join(__dirname, "../templates/tax-invoice.hbs");

  const html = fs.readFileSync(templatePath, "utf8");

  const template = handlebars.compile(html);

  const finalHtml = template(data);

  const browser = await getBrowser();

  const page = await browser.newPage();

  await page.setContent(finalHtml, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "A4",

    printBackground: true,

    preferCSSPageSize: true,

    landscape: false,

    scale: 0.72,

    margin: {
      top: "12mm",
      bottom: "12mm",
      left: "16mm",
      right: "16mm",
    },
  });

  await page.close();

  return Buffer.from(pdf);
};
