import { Request, Response } from "express";
const { Brand, Model, Variant, Color } = require("../models/VehicleHierarchy");

// ─── BRANDS ───
export const getBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.status(200).json(brands);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch brands", error: error.message });
  }
};

export const addBrand = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Brand name is required" });

    const exists = await Brand.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (exists)
      return res.status(400).json({ message: "Brand already exists" });

    const brand = await Brand.create({ name });
    res.status(201).json(brand);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to add brand", error: error.message });
  }
};

// ─── MODELS ───
export const getModels = async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;
    if (!brandId)
      return res.status(400).json({ message: "brandId is required" });

    const models = await Model.find({ brandId }).sort({ name: 1 });
    res.status(200).json(models);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch models", error: error.message });
  }
};

export const addModel = async (req: Request, res: Response) => {
  try {
    const { name, brandId } = req.body;
    if (!name || !brandId)
      return res.status(400).json({ message: "Name and brandId are required" });

    const model = await Model.create({ name, brandId });
    res.status(201).json(model);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to add model", error: error.message });
  }
};

// ─── VARIANTS ───
export const getVariants = async (req: Request, res: Response) => {
  try {
    const { modelId } = req.query;
    if (!modelId)
      return res.status(400).json({ message: "modelId is required" });

    const variants = await Variant.find({ modelId }).sort({ name: 1 });
    res.status(200).json(variants);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch variants", error: error.message });
  }
};

export const addVariant = async (req: Request, res: Response) => {
  try {
    const { name, modelId } = req.body;
    if (!name || !modelId)
      return res.status(400).json({ message: "Name and modelId are required" });

    const variant = await Variant.create({ name, modelId });
    res.status(201).json(variant);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to add variant", error: error.message });
  }
};

// ─── COLORS ───
export const getColors = async (req: Request, res: Response) => {
  try {
    const { variantId } = req.query;
    if (!variantId)
      return res.status(400).json({ message: "variantId is required" });

    const colors = await Color.find({ variantId }).sort({ name: 1 });
    res.status(200).json(colors);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch colors", error: error.message });
  }
};

export const addColor = async (req: Request, res: Response) => {
  try {
    const { name, variantId } = req.body;
    if (!name || !variantId)
      return res
        .status(400)
        .json({ message: "Name and variantId are required" });

    const color = await Color.create({ name, variantId });
    res.status(201).json(color);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to add color", error: error.message });
  }
};
