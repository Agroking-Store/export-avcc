import puppeteer, { Browser } from "puppeteer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

let browserInstance: Browser | null = null;

const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
  }
  return browserInstance;
};

export const generateTaxInvoicePDF = async (
  data: any
): Promise<Buffer> => {
  const templatePath = path.join(
    __dirname,
    "../templates/tax-invoice.hbs"
  );

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