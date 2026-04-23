import ProformaInvoice from "../models/ProformaInvoice.model";

export const getPIData = async (id: string) => {
  const pi = await ProformaInvoice.findById(id)
    .populate("client_id", "name companyName clientCode email phone address country")
    .populate("company_id", "name email phone gstNumber address bankDetails")
    .lean(); // returns a plain JS object — faster and easier to inspect

  if (!pi) throw new Error(`ProformaInvoice not found: ${id}`);
  return pi;
};

export { updatePIStatusService } from "./proforma-invoice.service";