import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";
import { CreateCompanyForm, UpdateCompanyForm, Company } from "./company.types";

const getAuthToken = () => {
  let token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token && localStorage.getItem("user")) {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      token = userObj.token || userObj.accessToken;
    } catch (e) {}
  }
  if (token && token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  return token;
};

export const companyApi = {
  getCompanies: async (
    search: string = "",
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) => {
    const res = await axios.get(`${apiConfig.baseURL}/companies`, {
      params: { search, page, limit, sortBy, sortOrder },
      headers: getAuthToken()
        ? { Authorization: `Bearer ${getAuthToken()}` }
        : {},
    });
    return res.data;
  },

  getCompanyById: async (id: string) => {
    const res = await axios.get<Company>(
      `${apiConfig.baseURL}/companies/${id}`,
      {
        headers: getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {},
      }
    );
    return res.data;
  },

  createCompany: async (payload: CreateCompanyForm) => {
    const res = await axios.post<Company>(
      `${apiConfig.baseURL}/companies`,
      payload,
      {
        headers: getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {},
      }
    );
    return res.data;
  },

  updateCompany: async (id: string, payload: UpdateCompanyForm) => {
    const res = await axios.put<Company>(
      `${apiConfig.baseURL}/companies/${id}`,
      payload,
      {
        headers: getAuthToken()
          ? { Authorization: `Bearer ${getAuthToken()}` }
          : {},
      }
    );
    return res.data;
  },

  deleteCompany: async (id: string) => {
    await axios.delete(`${apiConfig.baseURL}/companies/${id}`, {
      headers: getAuthToken()
        ? { Authorization: `Bearer ${getAuthToken()}` }
        : {},
    });
  },
};
