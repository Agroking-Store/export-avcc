import { Request, Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import ProformaInvoice from "../models/ProformaInvoice.model";
import LetterOfCredit from "../models/LetterOfCredit.model";
import { VehicleBooking } from "../models/VehicleBooking.model";
import Invoice from "../models/Invoice.model";
import { Client } from "../models/Client.model";
import { ROLES } from "../config/constants";

const getFileSize = (relPath: string): number | undefined => {
  try {
    if (!relPath) return undefined;
    const cleanPath = relPath.startsWith("/") ? relPath.substring(1) : relPath;
    const absPath = path.isAbsolute(relPath) ? relPath : path.resolve(process.cwd(), cleanPath);
    if (fs.existsSync(absPath)) {
      return fs.statSync(absPath).size;
    }
  } catch (err) {
    // ignore
  }
  return undefined;
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userEmail = (req as any).user?.email;

    const search = req.query.search ? String(req.query.search).trim() : "";
    const docType = req.query.docType ? String(req.query.docType) : "";
    const entityType = req.query.entityType ? String(req.query.entityType) : "";
    const sortBy = req.query.sortBy === "name" ? "name" : "date";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 20));

    let clientId: mongoose.Types.ObjectId | null = null;
    if (userRole === ROLES.CLIENT) {
      if (!userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const clientProfile = await Client.findOne({ email: userEmail.toLowerCase().trim() });
      if (!clientProfile) {
        return res.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
      clientId = clientProfile._id as mongoose.Types.ObjectId;
    }

    // Role-based document category restrictions
    const canAccessTrade = userRole === ROLES.ADMIN || userRole === ROLES.ACCOUNTANT || userRole === ROLES.CLIENT;
    const canAccessSourcing = userRole === ROLES.ADMIN || userRole === ROLES.SOURCING || userRole === ROLES.CLIENT;

    // Direct filter based on requested document types or entity types
    const queryPI = canAccessTrade && (!entityType || entityType === "proforma_invoice") && 
      (!docType || ["proforma_invoice", "hbl_document"].includes(docType));

    const queryLC = canAccessTrade && (!entityType || entityType === "lc") && 
      (!docType || docType === "letter_of_credit");

    const queryInvoice = canAccessTrade && (!entityType || entityType === "invoice") && (!docType || ["invoice", "invoice_usd", "invoice_inr", "invoice_commercial", "packing_list"].includes(docType));

    const queryBooking = canAccessSourcing && (!entityType || entityType === "vehicle_booking") && 
      (!docType || ["form20", "form21", "form22", "tempRegCert", "bvCertificate", "dealerInvoice", "hblDocument", "shippingBill", "quotation", "clientCorrection"].includes(docType));

    const promises: Promise<any[]>[] = [];

    // 1. Proforma Invoice PDFs & HBL PDFs
    if (queryPI) {
      const piQuery: any = {};
      if (clientId) piQuery.client_id = clientId;

      promises.push(
        ProformaInvoice.find(piQuery)
          .populate("client_id", "name companyName")
          .lean()
          .then((pis: any[]) => {
            const list: any[] = [];
            for (const pi of pis) {
              const buyerName = pi.clientSnapshot?.name || pi.client_id?.name || "N/A";
              
              if (pi.pdfPath && (!docType || docType === "proforma_invoice")) {
                const downloadUrl = `/api/v1/proforma-invoices/${pi._id}/pdf`;
                list.push({
                  id: `${pi._id}_pi_pdf`,
                  fileName: pi.pdfPath.split("/").pop()?.split("\\").pop() || `${pi.piNumber || "PI"}.pdf`,
                  documentType: "proforma_invoice",
                  documentTypeName: "Proforma Invoice",
                  relatedEntity: `Proforma Invoice (PI Number: ${pi.piNumber || "Draft"})`,
                  relatedEntityId: pi._id.toString(),
                  relatedEntityType: "proforma_invoice",
                  uploadDate: pi.createdAt || new Date(),
                  uploadedBy: "System",
                  fileSize: getFileSize(pi.pdfPath),
                  downloadUrl,
                  viewUrl: downloadUrl,
                  buyerName,
                  // Navigation helpers
                  piId: pi._id.toString(),
                });
              }
              if (pi.hblPath && (!docType || docType === "hbl_document")) {
                const downloadUrl = `/api/v1/proforma-invoices/${pi._id}/hbl/view`;
                list.push({
                  id: `${pi._id}_hbl_pdf`,
                  fileName: pi.hblPath.split("/").pop()?.split("\\").pop() || `HBL-${pi.piNumber || "Draft"}.pdf`,
                  documentType: "hbl_document",
                  documentTypeName: "House Bill of Lading",
                  relatedEntity: `Proforma Invoice (PI Number: ${pi.piNumber || "Draft"})`,
                  relatedEntityId: pi._id.toString(),
                  relatedEntityType: "proforma_invoice",
                  uploadDate: pi.updatedAt || pi.createdAt || new Date(),
                  uploadedBy: "Admin",
                  fileSize: getFileSize(pi.hblPath),
                  downloadUrl,
                  viewUrl: downloadUrl,
                  buyerName,
                  // Navigation helpers
                  piId: pi._id.toString(),
                });
              }
            }
            return list;
          })
      );
    }

    // 2. Letters of Credit (LC)
    if (queryLC) {
      let lcQuery: any = {};
      let getLCs = async () => {
        if (clientId) {
          const clientPis = await ProformaInvoice.find({ client_id: clientId }).select("_id").lean();
          const piIds = clientPis.map(p => p._id);
          lcQuery.pi_id = { $in: piIds };
        }
        const lcs = await LetterOfCredit.find(lcQuery)
          .populate("pi_id", "piNumber clientSnapshot client_id")
          .lean() as any[];

        return lcs.map(lc => {
          const pi = lc.pi_id || {};
          const piNumber = pi.piNumber || "N/A";
          const buyerName = pi.clientSnapshot?.name || pi.client_id?.name || "N/A";
          const downloadUrl = `/api/v1/proforma-invoices/${pi._id || "unknown"}/lc/view`;

          return {
            id: `${lc._id}_lc`,
            fileName: lc.documentUrl.split("/").pop()?.split("\\").pop() || `LC-${piNumber}.pdf`,
            documentType: "letter_of_credit",
            documentTypeName: "Letter of Credit",
            relatedEntity: `Proforma Invoice (PI Number: ${piNumber})`,
            relatedEntityId: pi._id?.toString() || "",
            relatedEntityType: "proforma_invoice",
            uploadDate: lc.uploadedAt || lc.createdAt || new Date(),
            uploadedBy: "Client",
            fileSize: getFileSize(lc.documentUrl),
            downloadUrl,
            viewUrl: downloadUrl,
            buyerName,
            // Navigation helpers
            piId: pi._id?.toString() || "",
          };
        });
      };
      promises.push(getLCs());
    }

    // 3. Invoices & Packing Lists
    if (queryInvoice) {
      let getInvoices = async () => {
        const invoiceQuery: any = { active: true };
        if (clientId) {
          const clientPis = await ProformaInvoice.find({ client_id: clientId }).select("_id").lean();
          const piIds = clientPis.map(p => p._id);
          invoiceQuery.piId = { $in: piIds };
        }

        const invoices = await Invoice.find(invoiceQuery)
          .populate("piId", "piNumber clientSnapshot client_id")
          .lean() as any[];

        const list: any[] = [];
        for (const inv of invoices) {
          const pi = inv.piId || {};
          const piNumber = pi.piNumber || "N/A";
          const buyerName = pi.clientSnapshot?.name || pi.client_id?.name || "N/A";

          // Include invoice PDFs even when buffer is empty/undefined.
          // The download endpoints restore/generate buffers if needed.
          if (inv.type !== "PACKING_LIST") {
            const docTypeVal =
              inv.type === "INR"
                ? "invoice_inr"
                : inv.type === "COMMERCIAL"
                  ? "invoice_commercial"
                  : "invoice_usd";

            const docTypeName =
              inv.type === "INR"
                ? "INR Invoice"
                : inv.type === "COMMERCIAL"
                  ? "Commercial Invoice"
                  : "USD Invoice";

            if (docType && docType !== "invoice" && docType !== docTypeVal) continue;

            const downloadUrl = `/api/v1/invoices/${inv._id}/download`;
            const fileSize =
              inv.invoicePdf && Buffer.isBuffer(inv.invoicePdf)
                ? inv.invoicePdf.length
                : undefined;

            list.push({
              id: `${inv._id}_invoice`,
              fileName: `${inv.invoiceNumber}.pdf`,
              documentType: docTypeVal,
              documentTypeName: docTypeName,
              relatedEntity: `Commercial Invoice (Number: ${inv.invoiceNumber})`,
              relatedEntityId: inv._id.toString(),
              relatedEntityType: "invoice",
              uploadDate: inv.generatedAt || inv.createdAt || new Date(),
              uploadedBy: "System",
              fileSize,
              downloadUrl,
              viewUrl: downloadUrl,
              buyerName,
              // Navigation helpers
              piId: pi._id?.toString() || "",
            });
          }

          // Packing list: include even if buffer length is 0.
          if (inv.type === "PACKING_LIST") {
            if (docType && docType !== "invoice" && docType !== "packing_list") continue;

            const downloadUrl = `/api/v1/invoices/${inv._id}/download-packing`;
            const fileSize =
              inv.packingListPdf && Buffer.isBuffer(inv.packingListPdf)
                ? inv.packingListPdf.length
                : undefined;

            list.push({
              id: `${inv._id}_packing_list`,
              fileName: `${inv.invoiceNumber}-packing.pdf`,
              documentType: "packing_list",
              documentTypeName: "Packing List",
              relatedEntity: `Commercial Invoice (Number: ${inv.invoiceNumber})`,
              relatedEntityId: inv._id.toString(),
              relatedEntityType: "invoice",
              uploadDate: inv.generatedAt || inv.createdAt || new Date(),
              uploadedBy: "System",
              fileSize,
              downloadUrl,
              viewUrl: downloadUrl,
              buyerName,
              // Navigation helpers
              piId: pi._id?.toString() || "",
            });
          }
        }
        return list;
      };
      promises.push(getInvoices());
    }

    // 4. Vehicle Booking Documents, Quotation Files, and Client Corrections
    if (queryBooking) {
      const bookingQuery: any = {};
      if (clientId) bookingQuery.assignedClientId = clientId;

      promises.push(
        VehicleBooking.find(bookingQuery)
          .populate("orderId", "orderNumber")
          .lean()
          .then((bookings: any[]) => {
            const list: any[] = [];
            const docFields = [
              { key: "form20", name: "Form 20" },
              { key: "form21", name: "Form 21" },
              { key: "form22", name: "Form 22" },
              { key: "tempRegCert", name: "Temporary Registration Certificate" },
              { key: "bvCertificate", name: "Bureau Veritas Certificate" },
              { key: "dealerInvoice", name: "Dealer Invoice" },
              { key: "hblDocument", name: "House Bill of Lading" },
              { key: "shippingBill", name: "Shipping Bill" }
            ];

            for (const b of bookings) {
              const chassis = b.chassisNumber || "N/A";
              const engine = b.engineNumber || "N/A";
              const buyerName = b.assignedClientSnapshot?.name || "N/A";
              const relatedEntity = `Vehicle (Chassis: ${chassis}, Engine: ${engine})`;

              const bookingOrderId = b.orderId?._id?.toString() || b.orderId?.toString() || "";
              const bookingVehicleIndex = b.vehicleIndex ?? 0;

              // Sourcing files
              if (b.documents) {
                for (const field of docFields) {
                  const filePath = b.documents[field.key];
                  if (filePath && filePath.trim() !== "" && (!docType || docType === field.key)) {
                    const downloadUrl = `/api/v1/vehicle-bookings/${b._id}/files/${field.key}`;
                    list.push({
                      id: `${b._id}_booking_${field.key}`,
                      fileName: filePath.split("/").pop()?.split("\\").pop() || `${field.name}.pdf`,
                      documentType: field.key,
                      documentTypeName: field.name,
                      relatedEntity,
                      relatedEntityId: b._id.toString(),
                      relatedEntityType: "vehicle_booking",
                      uploadDate: b.updatedAt || b.createdAt || new Date(),
                      uploadedBy: "Sourcing Team",
                      fileSize: getFileSize(filePath),
                      downloadUrl,
                      viewUrl: downloadUrl,
                      buyerName,
                      // Navigation helpers
                      bookingOrderId,
                      bookingVehicleIndex,
                    });
                  }
                }
              }

              // Quotation
              if (b.quotationFile && b.quotationFile.trim() !== "" && (!docType || docType === "quotation")) {
                const downloadUrl = `/api/v1/vehicle-bookings/${b._id}/files/quotationFile`;
                list.push({
                  id: `${b._id}_booking_quotation`,
                  fileName: b.quotationFile.split("/").pop()?.split("\\").pop() || "Quotation.pdf",
                  documentType: "quotation",
                  documentTypeName: "Quotation",
                  relatedEntity,
                  relatedEntityId: b._id.toString(),
                  relatedEntityType: "vehicle_booking",
                  uploadDate: b.quotationDetails?.savedAt || b.updatedAt || b.createdAt || new Date(),
                  uploadedBy: "Sourcing Team",
                  fileSize: getFileSize(b.quotationFile),
                  downloadUrl,
                  viewUrl: downloadUrl,
                  buyerName,
                  // Navigation helpers
                  bookingOrderId,
                  bookingVehicleIndex,
                });
              }

              // Client Corrections
              if (b.clientCorrections && Array.isArray(b.clientCorrections)) {
                for (const corr of b.clientCorrections) {
                  if (corr.filePath && corr.filePath.trim() !== "" && (!docType || docType === "clientCorrection")) {
                    const downloadUrl = `/api/v1/vehicle-bookings/${b._id}/client-corrections/${corr._id || corr.uploadedAt?.getTime()}`;
                    list.push({
                      id: `${b._id}_correction_${corr._id || corr.uploadedAt?.getTime()}`,
                      fileName: corr.originalName || corr.filePath.split("/").pop()?.split("\\").pop() || "Correction.pdf",
                      documentType: "clientCorrection",
                      documentTypeName: "Client Correction",
                      relatedEntity,
                      relatedEntityId: b._id.toString(),
                      relatedEntityType: "vehicle_booking",
                      uploadDate: corr.uploadedAt || b.updatedAt || new Date(),
                      uploadedBy: "Client",
                      fileSize: getFileSize(corr.filePath),
                      downloadUrl,
                      viewUrl: downloadUrl,
                      buyerName,
                      // Navigation helpers
                      bookingOrderId,
                      bookingVehicleIndex,
                    });
                  }
                }
              }
            }
            return list;
          })
      );
    }

    const allResultsArrays = await Promise.all(promises);
    let allDocs = allResultsArrays.reduce((acc, curr) => acc.concat(curr), []);

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      allDocs = allDocs.filter((doc: any) => 
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.relatedEntity.toLowerCase().includes(searchLower) ||
        doc.documentTypeName.toLowerCase().includes(searchLower) ||
        doc.buyerName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name or date
    allDocs.sort((a: any, b: any) => {
      let valA: any = sortBy === "name" ? a.fileName.toLowerCase() : new Date(a.uploadDate).getTime();
      let valB: any = sortBy === "name" ? b.fileName.toLowerCase() : new Date(b.uploadDate).getTime();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Paginate
    const total = allDocs.length;
    const startIndex = (page - 1) * limit;
    const paginatedDocs = allDocs.slice(startIndex, startIndex + limit);

    return res.json({
      data: paginatedDocs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[Documents List] Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
