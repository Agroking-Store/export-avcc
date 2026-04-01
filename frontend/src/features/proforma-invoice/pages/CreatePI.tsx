import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Landmark,
  AlertCircle,
  ChevronDown,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

type VehicleLineItem = {
  vehicle_id: string;
  model: string;
  color: string; // Used for Exterior Color
  engineNo: string;
  chassisNo: string;
  quantity: number;
  fob: number | "";
  freight: number | "";
  hsn: string;
  yom: string;
  fuelType: string;
  countryOfOrigin: string;
  engineCapacity: string;
};

type AddressDetails = {
  houseBuilding: string;
  streetArea: string;
  cityTown: string;
  state: string;
  pincode: string;
  country: string;
};

type PIForm = {
  piNumber: string;
  client_id: string;
  dealer_id: string;
  clientDetails: {
    name: string;
    companyName: string;
    address: AddressDetails;
  };
  dealerDetails: {
    name: string;
    gstin: string;
    address: AddressDetails;
  };
  paymentTerms: string;
  validityDate: string;
  termsOfDelivery: string;
  bankDetails: {
    bankName: string;
    accountNo: string;
    branchIfsc: string;
  };
  vehicleDetails: VehicleLineItem[];
};

const CreatePI = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [clients, setClients] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [previewLoading, setPreviewLoading] = useState(false);

  // Search states for comboboxes
  const [clientSearch, setClientSearch] = useState("");
  const [dealerSearch, setDealerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");

  const defaultAddress: AddressDetails = {
    houseBuilding: "",
    streetArea: "",
    cityTown: "",
    state: "",
    pincode: "",
    country: "",
  };

  const [form, setForm] = useState<PIForm>({
    piNumber: "",
    client_id: "",
    dealer_id: "",
    clientDetails: {
      name: "",
      companyName: "",
      address: { ...defaultAddress },
    },
    dealerDetails: {
      name: "",
      gstin: "",
      address: { ...defaultAddress },
    },
    paymentTerms: "",
    validityDate: "",
    termsOfDelivery: "",
    bankDetails: { bankName: "", accountNo: "", branchIfsc: "" },
    vehicleDetails: [
      {
        vehicle_id: "",
        model: "",
        color: "",
        engineNo: "",
        chassisNo: "",
        quantity: 1,
        hsn: "",
        fob: "",
        freight: "",
        yom: "",
        fuelType: "",
        countryOfOrigin: "",
        engineCapacity: "",
      },
    ],
  });

  const debouncedClientSearch = useDebounce(clientSearch, 500);
  const debouncedDealerSearch = useDebounce(dealerSearch, 500);
  const debouncedVehicleSearch = useDebounce(vehicleSearch, 500);

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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`${apiConfig.baseURL}/clients`, {
          params: { limit: 10, search: debouncedClientSearch },
        });
        console.log("Clients Response:", res.data);
        const data = res.data?.data || res.data;
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };
    const fetchDealers = async () => {
      try {
        const res = await axios.get(`${apiConfig.baseURL}/dealers`, {
          params: { limit: 10, search: debouncedDealerSearch },
        });
        console.log("Dealers Response:", res.data);
        const data = res.data?.data || res.data;
        setDealers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch dealers:", error);
      }
    };
    const fetchVehicles = async () => {
      try {
        const token = getAuthToken();
        const res = await axios.get(`${apiConfig.baseURL}/vehicles`, {
          params: {
            limit: 10,
            status: "Available",
            search: debouncedVehicleSearch,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Vehicles Response:", res.data);
        const data = res.data?.data?.data || res.data?.data || res.data;
        setVehicles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      }
    };
    fetchClients();
    fetchDealers();
    fetchVehicles();
  }, [debouncedClientSearch, debouncedDealerSearch, debouncedVehicleSearch]);

  // Fetch existing PI if in edit mode
  useEffect(() => {
    if (!id) return;
    const fetchPI = async () => {
      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/proforma-invoices/${id}`
        );
        const pi = res.data;
        setForm({
          piNumber: pi.piNumber || "",
          client_id: pi.client_id?._id || pi.client_id || "",
          dealer_id: pi.dealer_id?._id || pi.dealer_id || "",
          clientDetails: pi.clientDetails || {
            name: "",
            companyName: "",
            address: {
              ...defaultAddress,
              streetArea:
                typeof pi.clientDetails?.address === "string"
                  ? pi.clientDetails.address
                  : "",
              state: pi.clientDetails?.state || "",
              country: pi.clientDetails?.country || "",
            },
          },
          dealerDetails: pi.dealerDetails || {
            name: "",
            gstin: "",
            address: {
              ...defaultAddress,
              streetArea:
                typeof pi.dealerDetails?.address === "string"
                  ? pi.dealerDetails.address
                  : "",
              state: pi.dealerDetails?.state || "",
            },
          },
          paymentTerms: pi.paymentTerms || "",
          validityDate: pi.validityDate ? pi.validityDate.split("T")[0] : "",
          termsOfDelivery: pi.termsOfDelivery || "",
          bankDetails: pi.bankDetails || {
            bankName: "",
            accountNo: "",
            branchIfsc: "",
          },
          vehicleDetails:
            pi.vehicleDetails?.length > 0
              ? pi.vehicleDetails.map((v: any) => ({
                  ...v,
                  vehicle_id: v.vehicle_id?._id || v.vehicle_id || "",
                }))
              : [
                  {
                    vehicle_id: "",
                    model: "",
                    color: "",
                    engineNo: "",
                    chassisNo: "",
                    quantity: 1,
                    hsn: "",
                    fob: "",
                    freight: "",
                    yom: "",
                    fuelType: "",
                    countryOfOrigin: "",
                    engineCapacity: "",
                  },
                ],
        });
      } catch (error) {
        console.error("Error fetching PI", error);
      }
    };
    fetchPI();
  }, [id]);

  const handleVehicleChange = (
    index: number,
    field: keyof VehicleLineItem,
    value: any
  ) => {
    const updated = [...form.vehicleDetails];
    (updated[index] as any)[field] = value;
    setForm({ ...form, vehicleDetails: updated });

    // Clear error for this specific field if it exists
    if (errors[`v_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`v_${index}_${field}`]: "" }));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selected = clients.find((c) => c._id === clientId);
    setForm((prev) => ({
      ...prev,
      client_id: clientId,
      clientDetails: {
        name: selected?.name || "",
        companyName: selected?.companyName || "",
        address: {
          ...form.clientDetails.address,
          streetArea: selected?.address || "",
          state: selected?.state || "",
          country: selected?.country || "",
        },
      },
    }));
    if (errors.client_id) {
      setErrors((prev) => ({ ...prev, client_id: "" }));
    }
  };

  const handleDealerSelect = (dealerId: string) => {
    const selected = dealers.find((d) => d._id === dealerId);
    setForm((prev) => ({
      ...prev,
      dealer_id: dealerId,
      dealerDetails: {
        name: selected?.name || "",
        gstin: selected?.gstNumber || "",
        address: {
          ...form.dealerDetails.address,
          streetArea: selected?.address || "",
          state: selected?.state || "",
        },
      },
    }));
  };

  const handleVehicleSelect = (index: number, vehicleId: string) => {
    const selected = vehicles.find(
      (v) => v.id === vehicleId || v._id === vehicleId
    );
    const updated = [...form.vehicleDetails];
    updated[index].vehicle_id = vehicleId;
    if (selected) {
      updated[index].model = selected.name; // Auto-fill model name
      updated[index].color = selected.color || "";
      updated[index].engineNo = selected.engineNo || "";
      updated[index].chassisNo = selected.chassisNo || "";
    }
    setForm({ ...form, vehicleDetails: updated });
  };

  const addVehicle = () => {
    setForm({
      ...form,
      vehicleDetails: [
        ...form.vehicleDetails,
        {
          vehicle_id: "",
          model: "",
          color: "",
          engineNo: "",
          chassisNo: "",
          quantity: 1,
          hsn: "",
          fob: "",
          freight: "",
          yom: "",
          fuelType: "",
          countryOfOrigin: "",
          engineCapacity: "",
        },
      ],
    });
  };

  const removeVehicle = (index: number) => {
    setForm({
      ...form,
      vehicleDetails: form.vehicleDetails.filter((_, i) => i !== index),
    });
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getRate = (v: VehicleLineItem) =>
    (Number(v.fob) || 0) + (Number(v.freight) || 0);
  const getAmount = (v: VehicleLineItem) =>
    getRate(v) * (Number(v.quantity) || 0);

  const totalAmount = form.vehicleDetails.reduce(
    (sum, v) => sum + getAmount(v),
    0
  );

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + convert(n % 100) : "")
        );
      if (n < 1000000)
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
        );
      if (n < 1000000000)
        return (
          convert(Math.floor(n / 1000000)) +
          " Million" +
          (n % 1000000 !== 0 ? " " + convert(n % 1000000) : "")
        );
      return "";
    };
    return "USD " + convert(Math.floor(num)) + " Only";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.client_id) newErrors.client_id = "Client is required";

    form.vehicleDetails.forEach((v, index) => {
      if (!v.model.trim()) newErrors[`v_${index}_model`] = "Model is required";
      if (v.quantity < 1)
        newErrors[`v_${index}_quantity`] = "Quantity must be at least 1";
      if (getRate(v) <= 0) newErrors[`v_${index}_rate`] = "Rate must be > 0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form ⚠️");
      return;
    }

    // Clean up payload (remove empty IDs so mongoose doesn't crash)
    const payload: any = {
      ...form,
      totalAmount,
    };

    if (!payload.dealer_id) delete payload.dealer_id;

    payload.vehicleDetails = payload.vehicleDetails.map((v: any) => {
      const { vehicle_id, ...rest } = v;
      // Include unitPrice for backward compatibility on backend if needed
      return vehicle_id
        ? { vehicle_id, unitPrice: getRate(v), ...rest }
        : { unitPrice: getRate(v), ...rest };
    });

    try {
      setLoading(true);
      if (id) {
        await axios.put(
          `${apiConfig.baseURL}/proforma-invoices/${id}`,
          payload
        );
        toast.success("PI updated successfully ✅");
        navigate(`/proforma-invoice/${id}`);
      } else {
        const res = await axios.post(
          `${apiConfig.baseURL}/proforma-invoices`,
          payload
        );
        toast.success("PI created successfully ✅");
        navigate(`/proforma-invoice/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      console.error("Error submitting PI", err);
      toast.error("Failed to save Proforma Invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!id) {
      toast.info("Please save the invoice first to enable preview.");
      return;
    }
    try {
      setPreviewLoading(true);
      const token = getAuthToken();

      const res = await axios.get(
        `${apiConfig.baseURL}/proforma-invoices/${id}/pdf`,
        {
          responseType: "blob",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch (error) {
      console.error("PDF Preview error", error);
      toast.error("Failed to generate PDF preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const inputClass =
    "w-full h-12 px-4 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base shadow-sm";
  const getInputClass = (errKey?: string) =>
    `w-full h-12 px-4 bg-white border ${
      errKey && errors[errKey]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
    } rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all text-base shadow-sm`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const sectionTitleClass = "text-xl font-medium text-gray-900 mb-6";
  const divider = <hr className="border-gray-200 my-10" />;

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => navigate("/proforma-invoice")}
                variant="ghost"
                size="icon"
                className="h-10 w-10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight">
                {id ? "Edit Proforma Invoice" : "Create Proforma Invoice"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={!id || previewLoading || loading}
                className="h-12 px-6"
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewLoading ? "Loading..." : "Preview PDF"}
              </Button>
              <Button type="submit" disabled={loading} className="h-12 px-8">
                {loading
                  ? "Processing..."
                  : id
                  ? "Save Changes"
                  : "Generate PI"}
              </Button>
            </div>
          </div>

          {/* DOCUMENT DETAILS */}
          <div>
            <h3 className={sectionTitleClass}>Document Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Voucher No (PI Number)</label>
                <input
                  value={form.piNumber}
                  onChange={(e) =>
                    setForm({ ...form, piNumber: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. PI-2026-001"
                />
              </div>
              <div>
                <label className={labelClass}>Validity Date</label>
                <DatePicker
                  date={
                    form.validityDate ? new Date(form.validityDate) : undefined
                  }
                  setDate={(date) =>
                    setForm({
                      ...form,
                      validityDate: date
                        ? date.toISOString().split("T")[0]
                        : "",
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className={labelClass}>Payment Terms</label>
                <input
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({ ...form, paymentTerms: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. 100% Advance"
                />
              </div>
              <div>
                <label className={labelClass}>Terms of Delivery</label>
                <input
                  value={form.termsOfDelivery}
                  onChange={(e) =>
                    setForm({ ...form, termsOfDelivery: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. CIF, Ex-Works"
                />
              </div>
            </div>
          </div>

          {divider}

          {/* BUYER / CLIENT */}
          <div>
            <h3 className={sectionTitleClass}>Buyer / Client Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Buyer (Client) *</label>
                <SearchableCombobox
                  data={clients}
                  value={form.client_id}
                  onValueChange={handleClientSelect}
                  onSearchChange={setClientSearch}
                  displayField="name"
                  valueField="_id"
                  placeholder="Select a client..."
                  searchPlaceholder="Search clients..."
                  emptyMessage="No clients found."
                  error={!!errors.client_id}
                />
                {errors.client_id && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.client_id}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  value={form.clientDetails.companyName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        companyName: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Name</label>
                <input
                  value={form.clientDetails.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        name: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>House/Building</label>
                <input
                  value={form.clientDetails.address.houseBuilding}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          houseBuilding: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Street/Locality/Area</label>
                <input
                  value={form.clientDetails.address.streetArea}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          streetArea: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>City/Town</label>
                <input
                  value={form.clientDetails.address.cityTown}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          cityTown: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input
                  value={form.clientDetails.address.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          state: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Pincode / ZIP</label>
                <input
                  value={form.clientDetails.address.pincode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          pincode: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  value={form.clientDetails.address.country}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      clientDetails: {
                        ...form.clientDetails,
                        address: {
                          ...form.clientDetails.address,
                          country: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {divider}

          {/* EXPORTER / COMPANY DATA */}
          <div>
            <h3 className={sectionTitleClass}>Exporter / Company Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Exporter (Dealer)</label>
                <SearchableCombobox
                  data={dealers}
                  value={form.dealer_id}
                  onValueChange={handleDealerSelect}
                  onSearchChange={setDealerSearch}
                  displayField="name"
                  valueField="_id"
                  placeholder="Select a dealer..."
                  searchPlaceholder="Search dealers..."
                  emptyMessage="No dealers found."
                />
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  value={form.dealerDetails.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        name: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>GSTIN</label>
                <input
                  value={form.dealerDetails.gstin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        gstin: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>House/Building</label>
                <input
                  value={form.dealerDetails.address.houseBuilding}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          houseBuilding: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Street/Locality/Area</label>
                <input
                  value={form.dealerDetails.address.streetArea}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          streetArea: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>City/Town</label>
                <input
                  value={form.dealerDetails.address.cityTown}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          cityTown: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input
                  value={form.dealerDetails.address.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          state: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Pincode / ZIP</label>
                <input
                  value={form.dealerDetails.address.pincode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          pincode: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  value={form.dealerDetails.address.country}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dealerDetails: {
                        ...form.dealerDetails,
                        address: {
                          ...form.dealerDetails.address,
                          country: e.target.value,
                        },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Bank Details (Optional)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  placeholder="Bank Name"
                  value={form.bankDetails.bankName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: {
                        ...form.bankDetails,
                        bankName: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
                <input
                  placeholder="Account No"
                  value={form.bankDetails.accountNo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: {
                        ...form.bankDetails,
                        accountNo: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
                <input
                  placeholder="Branch / IFSC"
                  value={form.bankDetails.branchIfsc}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: {
                        ...form.bankDetails,
                        branchIfsc: e.target.value,
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {divider}

          {/* VEHICLE LINE ITEMS */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className={sectionTitleClass + " mb-0!"}>
                Vehicle Line Items
              </h3>
              <Button
                type="button"
                onClick={addVehicle}
                variant="outline"
                className="h-10"
              >
                <Plus size={18} /> Add Vehicle
              </Button>
            </div>

            <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <div className="col-span-4">Model / Description</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">FOB ($)</div>
                <div className="col-span-1 text-right">Freight ($)</div>
                <div className="col-span-1 text-right">Rate ($)</div>
                <div className="col-span-2 text-right">Amount ($)</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {/* Rows */}
              {form.vehicleDetails.map((v, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 last:border-0"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-1 lg:col-span-4">
                      <div className="mb-3">
                        <SearchableCombobox
                          data={vehicles}
                          value={v.vehicle_id}
                          onValueChange={(val) =>
                            handleVehicleSelect(index, val)
                          }
                          onSearchChange={setVehicleSearch}
                          displayField="name"
                          valueField="_id"
                          placeholder="Select an inventory vehicle..."
                          searchPlaceholder="Search by name/chassis..."
                          emptyMessage="No vehicles found."
                        />
                      </div>
                      <input
                        placeholder="Vehicle Model"
                        value={v.model}
                        onChange={(e) =>
                          handleVehicleChange(index, "model", e.target.value)
                        }
                        className={getInputClass(`v_${index}_model`)}
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-1">
                      <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={v.quantity}
                        onChange={(e) =>
                          handleVehicleChange(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                        className={`${getInputClass(
                          `v_${index}_quantity`
                        )} text-center`}
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                      <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                        FOB ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.fob}
                        onChange={(e) =>
                          handleVehicleChange(
                            index,
                            "fob",
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className={`${inputClass} text-right font-mono`}
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-1">
                      <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                        Freight ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.freight}
                        onChange={(e) =>
                          handleVehicleChange(
                            index,
                            "freight",
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        className={`${inputClass} text-right font-mono`}
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-1 text-right font-mono text-gray-600">
                      <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1 text-right">
                        Rate ($)
                      </label>
                      <span
                        className={
                          errors[`v_${index}_rate`] ? "text-red-500" : ""
                        }
                      >
                        ${getRate(v).toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-1 lg:col-span-2 text-right font-mono font-medium text-gray-900">
                      <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1 text-right">
                        Amount ($)
                      </label>
                      ${getAmount(v).toLocaleString()}
                    </div>
                    <div className="col-span-1 lg:col-span-1 flex justify-end items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => toggleRow(index)}
                        variant="ghost"
                        size="icon"
                        title="Toggle Advanced Fields"
                      >
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            expandedRows[index] ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                      {form.vehicleDetails.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeVehicle(index)}
                          variant="ghost"
                          size="icon"
                          title="Remove Vehicle"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Fields */}
                  {expandedRows[index] && (
                    <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className={labelClass}>Exterior Color</label>
                        <input
                          value={v.color}
                          onChange={(e) =>
                            handleVehicleChange(index, "color", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Engine No</label>
                        <input
                          value={v.engineNo}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "engineNo",
                              e.target.value
                            )
                          }
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Chassis No (VIN)</label>
                        <input
                          value={v.chassisNo}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "chassisNo",
                              e.target.value
                            )
                          }
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Year of Manufacture
                        </label>
                        <input
                          value={v.yom}
                          onChange={(e) =>
                            handleVehicleChange(index, "yom", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>HSN / SAC</label>
                        <input
                          value={v.hsn}
                          onChange={(e) =>
                            handleVehicleChange(index, "hsn", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Fuel Type</label>
                        <input
                          value={v.fuelType}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "fuelType",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Country of Origin</label>
                        <input
                          value={v.countryOfOrigin}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "countryOfOrigin",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Engine Capacity</label>
                        <input
                          value={v.engineCapacity}
                          onChange={(e) =>
                            handleVehicleChange(
                              index,
                              "engineCapacity",
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="e.g. 2000cc"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {divider}

          {/* SUMMARY */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
            <div className="w-full sm:w-1/2">
              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Amount Chargeable (in words)
              </p>
              <p className="text-base font-medium text-gray-900">
                {numberToWords(totalAmount)}
              </p>
            </div>
            <div className="w-full sm:w-auto sm:text-right">
              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Grand Total
              </p>
              <p className="text-4xl font-light text-gray-900 tracking-tight font-mono">
                $
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePI;
