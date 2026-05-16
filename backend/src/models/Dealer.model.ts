import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema({
  dealerId: { type: String, unique: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    branchIfsc: { type: String, trim: true },
  },
}, { timestamps: true });

export default mongoose.model("Dealer", dealerSchema);
