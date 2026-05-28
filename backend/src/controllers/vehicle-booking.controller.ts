import fs from "fs";
import path from "path";
import { Request, Response } from "express";
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
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const origin = `${req.protocol}://${req.get("host")}`;
    const apiRoot = req.baseUrl.replace(/\/vehicle-bookings$/, "");
    const bookingBase = `${origin}${req.baseUrl}/${booking._id}`;
    const apiBase = `${origin}${apiRoot}`;

    const commercialInvoice = booking.commercialInvoices?.find(
      (invoice: any) => invoice.type === "COMMERCIAL",
    );

    const docs = [
      commercialInvoice
        ? {
            label: "Commercial Invoice",
            url: `${apiBase}/invoices/${commercialInvoice._id}/download${tokenParam}`,
          }
        : null,
      booking.documents?.hblDocument
        ? {
            label: "HBL",
            url: `${bookingBase}/files/hblDocument${tokenParam}`,
          }
        : null,
      booking.documents?.bvCertificate
        ? {
            label: "BV Certificate",
            url: `${bookingBase}/files/bvCertificate${tokenParam}`,
          }
        : null,
      booking.documents?.shippingBill
        ? {
            label: "Shipping Bill",
            url: `${bookingBase}/files/shippingBill${tokenParam}`,
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; url: string }>;

    const sections = docs
      .map(
        (doc, index) => `
          <section>
            <h2>${index + 1}. ${doc.label}</h2>
            <iframe src="${doc.url}" title="${doc.label}"></iframe>
          </section>
        `,
      )
      .join("");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`
      <!doctype html>
      <html>
        <head>
          <title>Merged Vehicle Documents</title>
          <style>
            body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
            header { position: sticky; top: 0; background: white; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; z-index: 1; }
            h1 { margin: 0; font-size: 18px; }
            p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
            main { padding: 20px; display: grid; gap: 20px; }
            section { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
            h2 { margin: 0; padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
            iframe { width: 100%; height: 860px; border: 0; display: block; background: white; }
            .empty { padding: 48px; text-align: center; color: #64748b; background: white; border: 1px dashed #cbd5e1; border-radius: 16px; }
          </style>
        </head>
        <body>
          <header>
            <h1>Merged Vehicle Documents</h1>
            <p>Commercial Invoice -> HBL -> BV Certificate -> Shipping Bill</p>
          </header>
          <main>${sections || '<div class="empty">No client-visible documents uploaded yet.</div>'}</main>
        </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
