import { Request, Response } from "express";
import {
  createCompanyService,
  getCompaniesService,
  getCompanyByIdService,
  updateCompanyService,
} from "../services/company.service";
import {
  validateCreateCompany,
  validateUpdateCompany,
} from "../validations/company.validation";

export const createCompany = async (req: Request, res: Response) => {
  try {
    validateCreateCompany(req.body);
    const company = await createCompanyService(req.body);
    res.status(201).json(company);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await getCompaniesService(req.query);
    res.status(200).json(companies);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await getCompanyByIdService(req.params.id as string);
    res.status(200).json(company);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    validateUpdateCompany(req.body);
    const updatedCompany = await updateCompanyService(
      req.params.id as string,
      req.body
    );
    res.status(200).json(updatedCompany);
  } catch (error: any) {
    if (error.message === "Company not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};
