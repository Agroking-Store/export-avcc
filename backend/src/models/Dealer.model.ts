import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  gstNumber: { type: String },
}, { timestamps: true });

export default mongoose.model("Dealer", dealerSchema);