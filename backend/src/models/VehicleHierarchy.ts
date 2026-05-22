const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

const ModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
  },
  { timestamps: true },
);

const VariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },
  },
  { timestamps: true },
);

const ColorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = {
  Brand: mongoose.model("Brand", BrandSchema),
  Model: mongoose.model("Model", ModelSchema),
  Variant: mongoose.model("Variant", VariantSchema),
  Color: mongoose.model("Color", ColorSchema),
};
