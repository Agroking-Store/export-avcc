import api from "./api";

export type CustomerNameOption = {
  id: string;
  name: string;
};

export const shipmentCustomerApi = {
  listCustomerNames: async (): Promise<CustomerNameOption[]> => {
    const response = await api.get("/shipments/customer-names");
    // backend returns { data: [...] }
    return response.data?.data ?? [];
  },
};

