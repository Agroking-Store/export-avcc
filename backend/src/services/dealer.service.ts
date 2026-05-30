import Dealer from "../models/Dealer.model";
import {
  getNextDealerId,
  normalizePhone,
} from "./profile-sync.service";

const generateDealerId = async (): Promise<string> => {
  return await getNextDealerId();
};

export const createDealerService = async (data: any) => {
  const email = data.email ? data.email.toLowerCase().trim() : "";
  const contact = normalizePhone(data.contact);

  const dealerId = await generateDealerId();

  const dealerData = { ...data };

  delete dealerData.password;
  delete dealerData.confirmPassword;
  delete dealerData.email;

  const dealer = new Dealer({
    ...dealerData,
    contact,
    ...(email ? { email } : {}),
    dealerId,
  });

  return await dealer.save();
};

export const getDealersService = async (query: any) => {
  const { search, page = 1, limit = 10 } = query;
  const filter: any = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { contact: { $regex: search, $options: "i" } },
      { dealerId: { $regex: search, $options: "i" } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const data = await Dealer.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  const total = await Dealer.countDocuments(filter);
  return {
    data,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

export const getDealerByIdService = async (id: string) => {
  const dealer = await Dealer.findById(id);
  if (!dealer) throw new Error("Dealer not found");
  return dealer;
};

export const updateDealerService = async (id: string, data: any) => {
  return await Dealer.findByIdAndUpdate(id, data, { new: true });
};

export const deleteDealerService = async (id: string) => {
  const dealer = await Dealer.findByIdAndDelete(id);
  if (!dealer) throw new Error("Dealer not found");
};

