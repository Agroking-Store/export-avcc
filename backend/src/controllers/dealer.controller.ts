import { Request, Response } from "express";
import Dealer from "../models/Dealer.model";

// Create a dealer
export const createDealer = async (req: Request, res: Response) => {
  try {
    const dealer = await Dealer.create(req.body);
    res.status(201).json({ success: true, data: dealer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all dealers
export const getDealers = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};
    const dealers = await Dealer.find(query).limit(limit).skip((page - 1) * limit);
    const total = await Dealer.countDocuments(query);
    res.status(200).json({ success: true, data: dealers, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single dealer by ID
export const getDealerById = async (req: Request, res: Response) => {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
      res.status(404).json({ success: false, message: "Dealer not found" });
      return;
    }
    res.status(200).json({ success: true, data: dealer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a dealer
export const updateDealer = async (req: Request, res: Response) => {
  try {
    const dealer = await Dealer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dealer) {
      res.status(404).json({ success: false, message: "Dealer not found" });
      return;
    }
    res.status(200).json({ success: true, data: dealer });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a dealer
export const deleteDealer = async (req: Request, res: Response) => {
  try {
    const dealer = await Dealer.findByIdAndDelete(req.params.id);
    if (!dealer) {
      res.status(404).json({ success: false, message: "Dealer not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Dealer deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};