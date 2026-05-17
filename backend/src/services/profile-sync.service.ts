import { Client } from "../models/Client.model";
import Dealer from "../models/Dealer.model";
import { User, IUser } from "../models/User.model";
import { ROLES } from "../config/constants";
import type { UserRole } from "../types/common.types";
import type { IClientAddressDetailsDto } from "../dto/client.dto";

type DealerBankDetails = {
  bankName?: string;
  accountNo?: string;
  branchIfsc?: string;
};

export type ClientProfileInput = {
  companyName?: string;
  address?: IClientAddressDetailsDto;
};

export type DealerProfileInput = {
  address?: string;
  gstNumber?: string;
  bankDetails?: DealerBankDetails;
};

export type ProfileSyncInput = {
  clientProfile?: ClientProfileInput;
  dealerProfile?: DealerProfileInput;
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();
export const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const getNextClientCode = async () => {
  const lastClient = await Client.findOne({ clientCode: { $exists: true } })
    .sort({ createdAt: -1 })
    .select("clientCode");

  if (!lastClient?.clientCode) return "CL-001";

  const lastNumber = parseInt(lastClient.clientCode.split("-")[1], 10);
  const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `CL-${String(nextNumber).padStart(3, "0")}`;
};

export const getNextDealerId = async () => {
  const latest = await Dealer.findOne({ dealerId: { $exists: true } })
    .sort({ createdAt: -1 })
    .select("dealerId");

  const dealerIdString = latest?.get("dealerId") as string | undefined;
  if (!dealerIdString) return "DL-001";

  const lastNumber = parseInt(dealerIdString.split("-")[1], 10);
  const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;

  return `DL-${String(nextNumber).padStart(3, "0")}`;
};

export const createUserAccountForProfile = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Extract<UserRole, "client" | "dealer">;
}) => {
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.role !== data.role) {
      throw new Error("User with this email already exists with another role");
    }

    existingUser.name = data.name;
    existingUser.phone = phone;
    existingUser.isActive = true;
    existingUser.password = data.password;
    await existingUser.save();
    return existingUser;
  }

  return await User.create({
    name: data.name,
    email,
    password: data.password,
    phone,
    role: data.role,
  });
};

export const createClientProfileForUser = async (
  user: IUser,
  profile?: ClientProfileInput,
) => {
  if (!user.phone) {
    throw new Error("Phone is required to create client profile");
  }
  if (!profile?.companyName) {
    throw new Error("Company name is required to create client profile");
  }
  if (!profile.address?.country) {
    throw new Error("Country is required to create client profile");
  }

  const email = normalizeEmail(user.email);
  const existingClient = await Client.findOne({
    $or: [{ email }, { phone: user.phone }],
  });

  if (existingClient) {
    throw new Error("Client already exists with this email or phone");
  }

  const clientCode = await getNextClientCode();

  return await Client.create({
    clientCode,
    name: user.name,
    email,
    phone: user.phone,
    companyName: profile.companyName,
    address: profile.address,
  });
};

export const createDealerProfileForUser = async (
  user: IUser,
  profile?: DealerProfileInput,
) => {
  if (!user.phone) {
    throw new Error("Contact is required to create dealer profile");
  }
  if (!profile?.gstNumber) {
    throw new Error("GST number is required to create dealer profile");
  }
  if (
    !profile.bankDetails?.bankName ||
    !profile.bankDetails.accountNo ||
    !profile.bankDetails.branchIfsc
  ) {
    throw new Error("Dealer bank details are required");
  }

  const email = normalizeEmail(user.email);
  const existingDealer = await Dealer.findOne({
    $or: [{ email }, { contact: user.phone }],
  });

  if (existingDealer) {
    throw new Error("Dealer already exists with this email or contact");
  }

  const dealerId = await getNextDealerId();

  return await Dealer.create({
    dealerId,
    name: user.name,
    contact: user.phone,
    email,
    address: profile.address,
    gstNumber: profile.gstNumber,
    bankDetails: profile.bankDetails,
  });
};

export const createProfileForUserRole = async (
  user: IUser,
  role: UserRole,
  input: ProfileSyncInput = {},
) => {
  if (role === ROLES.CLIENT) {
    return await createClientProfileForUser(user, input.clientProfile);
  }

  if (role === ROLES.DEALER) {
    return await createDealerProfileForUser(user, input.dealerProfile);
  }

  return null;
};
