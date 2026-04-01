import Dealer from "../models/Dealer.model";

const generateDealerId = async (): Promise<string> => {
  const latest = await Dealer.findOne().sort({ createdAt: -1 }).select("dealerId");
  if (!latest || !latest.get("dealerId")) return "DL-001";
  const num = parseInt(latest.get("dealerId").split("-")[1]) + 1;
  return `DL-${String(num).padStart(3, "0")}`;
};

export const createDealerService = async (data: any) => {
  const dealerId = await generateDealerId();
  const dealer = new Dealer({ ...data, dealerId });
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
  const data = await Dealer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  const total = await Dealer.countDocuments(filter);
  return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
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