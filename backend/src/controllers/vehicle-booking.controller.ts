import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { PDFDocument } from "pdf-lib";
import Invoice from "../models/Invoice.model";
import { ROLES } from "../config/constants";
import {
  getBookingsByOrderId,
  getOrCreateBooking,
  uploadQuotation,
  saveQuotationDetails,
  approveBooking,
  rejectBooking,
  confirmPayment,
  addPayment,
  updateChassisEngine,
  updateBookingStatus,
  assignClientToBooking,
  assignDealerToBooking,
  getBookingById,
  getReminderDueBookings,
  uploadBookingDocuments,
  uploadClientCorrectionDocument,
  getBookingFile,
  getClientCorrectionFile,
  getAllVehicleBookingsService,
  deleteVehicleBooking,
  cancelVehicleBooking,
  resetVehicleBooking,
} from "../services/vehicle-booking.service";

export const getAllBookingsHandler = async (req: Request, res: Response) => {
  try {
    const result = await getAllVehicleBookingsService(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBookingsByOrder = async (req: Request, res: Response) => {
  try {
    const bookings = await getBookingsByOrderId(req.params.orderId as string);
    res.json(bookings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const initBooking = async (req: Request, res: Response) => {
  try {
    const { orderId, vehicleIndex } = req.body;
    if (!orderId || vehicleIndex === undefined) {
      throw new Error("orderId and vehicleIndex are required");
    }
    const booking = await getOrCreateBooking(orderId, Number(vehicleIndex));
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadQuotationHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }
    const filePath = `/uploads/quotations/${req.file.filename}`;
    const booking = await uploadQuotation(req.params.id as string, filePath);
    res.json(booking);
  } catch (error: any) {
    if (req.file?.filename) {
      const uploadedAbsolutePath = path.join(
        process.cwd(),
        "uploads",
        "quotations",
        req.file.filename,
      );

      if (fs.existsSync(uploadedAbsolutePath)) {
        fs.unlinkSync(uploadedAbsolutePath);
      }
    }

    res.status(400).json({ message: error.message });
  }
};

export const saveQuotationDetailsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const booking = await saveQuotationDetails(req.params.id as string, req.body);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveHandler = async (req: Request, res: Response) => {
  try {
    const booking = await approveBooking(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectHandler = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const booking = await rejectBooking(req.params.id as string, reason);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const confirmPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const booking = await confirmPayment(
      req.params.id as string,
      Number(amount),
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { amount, date, reference, remarks } = req.body;
    const booking = await addPayment(req.params.id as string, {
      amount: Number(amount),
      date,
      reference,
      remarks,
    });
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateChassisEngineHandler = async (req: Request, res: Response) => {
  try {
    const {
      chassisNumber,
      engineNumber,
      deliveryDate,
      engineCapacity,
      fuelType,
      countryOfOrigin,
      yom,
      commercialHsnCode,
      exportHsnCode,
    } = req.body;
    const userRole = (req as any).user?.role;
    const bookingId = req.params.id as string;

    // If sourcing_team, enforce payment_done status restriction
    if (userRole === ROLES.SOURCING) {
      const booking = await getBookingById(bookingId);
      if (booking.status !== "payment_done") {
        return res.status(403).json({ message: "Sourcing team can only update engine/chassis after payment is completed" });
      }
    }

    const booking = await updateChassisEngine(bookingId, {
      chassisNumber,
      engineNumber,
      deliveryDate,
      engineCapacity,
      fuelType,
      countryOfOrigin,
      yom,
      commercialHsnCode,
      exportHsnCode,
    });
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStatusHandler = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) throw new Error("Status is required");
    const booking = await updateBookingStatus(
      req.params.id as string,
      status,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBookingHandler = async (req: Request, res: Response) => {
  try {
    await deleteVehicleBooking(req.params.id as string);
    res.json({ message: "Vehicle entry deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const assignDealerHandler = async (req: Request, res: Response) => {
  try {
    const { dealerId } = req.body;
    if (!dealerId) throw new Error("Dealer is required");

    const booking = await assignDealerToBooking(
      req.params.id as string,
      dealerId,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const assignClientHandler = async (req: Request, res: Response) => {
  try {
    const { clientId } = req.body;
    if (!clientId) throw new Error("Client is required");

    const booking = await assignClientToBooking(
      req.params.id as string,
      clientId,
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getBookingByIdHandler = async (req: Request, res: Response) => {
  try {
    const booking = await getBookingById(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getDueRemindersHandler = async (req: Request, res: Response) => {
  try {
    const intervalHours = Number(req.query.hours || 2);
    const due = await getReminderDueBookings(
      req.params.orderId as string,
      intervalHours,
    );
    res.json(due);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadBookingDocumentsHandler = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const booking = await uploadBookingDocuments(req.params.id as string, files);
    return res.json({
      success: true,
      message: "Booking documents updated",
      data: booking,
    });
  } catch (error: any) {
    console.error("Booking document upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadClientCorrectionHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const booking = await uploadClientCorrectionDocument(
      req.params.id as string,
      req.file,
    );
    return res.json({
      success: true,
      message: "Correction document uploaded",
      data: booking,
    });
  } catch (error: any) {
    console.error("Client correction upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingFileHandler = async (req: Request, res: Response) => {
  try {
    const field = Array.isArray(req.params.field)
      ? req.params.field[0]
      : req.params.field;
    const { download } = req.query;

    const filePath = await getBookingFile(req.params.id as string, field);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    if (download === "true") {
      return res.download(filePath);
    } else {
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getClientCorrectionFileHandler = async (req: Request, res: Response) => {
  try {
    const { download } = req.query;
    const correction = await getClientCorrectionFile(
      req.params.id as string,
      req.params.correctionId as string,
    );

    if (!fs.existsSync(correction.filePath)) {
      return res.status(404).json({ message: "File missing on server" });
    }

    if (download === "true") {
      return res.download(correction.filePath, correction.originalName);
    }

    return res.sendFile(path.resolve(correction.filePath));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getClientMergedDocumentsHandler = async (req: Request, res: Response) => {
  try {
    const booking = await getBookingById(req.params.id as string);

    // Each source is either a Buffer (from MongoDB) or a file path (from disk)
    const pdfSources: Array<{ label: string; data: Buffer }> = [];

    // ── 1. Commercial Invoice — stored as binary buffer in Invoice collection ──
    const commercialInvoiceRef = booking.commercialInvoices?.find(
      (inv: any) => inv.type === "COMMERCIAL",
    );
    if (commercialInvoiceRef?._id) {
      const invoiceDoc = await Invoice.findById(commercialInvoiceRef._id);
      if (invoiceDoc?.invoicePdf && invoiceDoc.invoicePdf.length > 0) {
        pdfSources.push({ label: "Commercial Invoice", data: invoiceDoc.invoicePdf });
      }
    }

    // ── 2. Booking document files — stored on disk ──
    const docFields = ["hblDocument", "bvCertificate", "shippingBill"] as const;
    for (const field of docFields) {
      const relativePath = booking.documents?.[field];
      if (relativePath) {
        const absPath = path.isAbsolute(relativePath)
          ? relativePath
          : path.join(process.cwd(), relativePath);
        if (fs.existsSync(absPath)) {
          pdfSources.push({ label: field, data: fs.readFileSync(absPath) });
        }
      }
    }

    if (pdfSources.length === 0) {
      return res.status(404).json({ message: "No documents available to merge" });
    }

    // Merge all PDFs using pdf-lib
    const mergedPdf = await PDFDocument.create();

    for (const source of pdfSources) {
      try {
        const srcDoc = await PDFDocument.load(source.data, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (err) {
        console.warn(`Skipping "${source.label}" (not a valid PDF or unreadable):`, err);
      }
    }

    const mergedBytes = await mergedPdf.save();

    const isDownload = req.query.download === "true";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", mergedBytes.length);
    res.setHeader(
      "Content-Disposition",
      isDownload
        ? `attachment; filename="merged-documents-${booking._id}.pdf"`
        : `inline; filename="merged-documents-${booking._id}.pdf"`,
    );

    return res.end(Buffer.from(mergedBytes));
  } catch (error: any) {
    console.error("Merged PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const cancelBookingHandler = async (req: Request, res: Response) => {
  try {
    const booking = await cancelVehicleBooking(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetBookingHandler = async (req: Request, res: Response) => {
  try {
    const booking = await resetVehicleBooking(req.params.id as string);
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};