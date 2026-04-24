import mongoose from "mongoose";

const taxInvoiceSchema =
  new mongoose.Schema(
    {
      piId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProformaInvoice",
        required: true,
      },

      /* BASIC */
      taxInvoiceNo: String,
      invoiceDate: String,
      piDate: String,

      buyerOrderDate: String,
      otherReference: String,

      /* SHIPPING */
      preCarriage: String,
      placeReceipt: String,
      vesselFlight: String,

      portOfLoading: String,
      portOfDischarge: String,
      placeDelivery: String,

      countryOrigin: {
        type: String,
        default: "INDIA",
      },

      countryDestination: String,

      containerNo: String,

      shipmentMode: {
        type: String,
        default: "BY SEA",
      },

      totalCartons: String,

      /* DELIVERY */
      termsOfDelivery: String,

      stateOfOrigin: String,
      districtOfOrigin: String,

      /* EXPORT BENEFITS */
      drawbackShipment: {
        type: String,
        default: "YES",
      },

      rodtepSchemeCode: String,
      endUseCode: String,

      igstPaymentStatus: {
        type: String,
        default: "YES",
      },

      shipmentExportUnderIgst: {
        type: String,
        default: "YES",
      },

      adCode: String,

      /* BANK */
      bankName: String,
      accountNo: String,
      ifsc: String,
      swiftCode: String,

      /* TOTALS */
      subtotal: Number,
      gstPercent: Number,
      gstAmount: Number,
      grandTotal: Number,

      /* EXTRA */
      remarks: String,
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "TaxInvoice",
  taxInvoiceSchema
);