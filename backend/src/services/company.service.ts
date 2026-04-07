import { Company } from "../models/Company.model";
import { CreateCompanyDto, UpdateCompanyDto } from "../dto/company.dto";

// Helper to generate unique companyId (e.g., CO-001, CO-002)
const generateCompanyId = async (): Promise<string> => {
  const latest = await Company.findOne()
    .sort({ createdAt: -1 })
    .select("companyId");
  if (!latest || !latest.get("companyId")) return "CO-001";
  const num = parseInt(latest.get("companyId").split("-")[1]) + 1;
  return `CO-${String(num).padStart(3, "0")}`;
};

// Create a new company
export const createCompanyService = async (data: CreateCompanyDto) => {
  // Check for duplicate company name to prevent conflicts
  const existingCompany = await Company.findOne({ name: data.name });
  if (existingCompany) {
    throw new Error("Company with this name already exists.");
  }

  const companyId = await generateCompanyId();
  const company = new Company({
    ...data,
    companyId,
  });

  return await company.save();
};

// Get all companies with search and pagination
export const getCompaniesService = async (query: any) => {
  const {
    search,
    page = 1,
    limit = 10,
    status = "all",
    sortBy = "createdAt", // Default sort by createdAt
    sortOrder = "desc", // Default sort order descending
  } = query; // Added status, sortBy, sortOrder

  let filter: any = {};

  // Apply search filter across multiple fields
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { companyId: { $regex: search, $options: "i" } },
      { "address.country": { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { gstNumber: { $regex: search, $options: "i" } },
    ];
  }

  // Apply status filter
  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const companies = await Company.find(filter)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 }) // Use dynamic sortBy and sortOrder
    .skip(skip)
    .limit(Number(limit));

  const total = await Company.countDocuments(filter);

  return {
    data: companies,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// Get a single company by ID
export const getCompanyByIdService = async (id: string) => {
  const company = await Company.findById(id);

  if (!company) {
    throw new Error("Company not found");
  }

  return company;
};

// Update an existing company
export const updateCompanyService = async (
  id: string,
  data: UpdateCompanyDto
) => {
  const updated = await Company.findByIdAndUpdate(id, data, { new: true }); // `new: true` returns the updated document

  if (!updated) {
    throw new Error("Company not found");
  }

  return updated;
};
