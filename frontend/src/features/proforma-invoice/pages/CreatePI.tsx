import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Car,
  Building2,
  CreditCard,
  Landmark,
} from "lucide-react";
import { toast } from "react-toastify";

type VehicleLineItem = {
  vehicle_id: string;
  model: string;
  color: string;
  engineNo: string;
  chassisNo: string;
  quantity: number;
  unitPrice: number;
  hsn: string;
  fob: string;
  freight: string;
  yom: string;
};

type PIForm = {
  client_id: string;
  dealer_id: string;
  clientDetails: {
    name: string;
    companyName: string;
    address: string;
    country: string;
    state: string;
  };
  dealerDetails: {
    name: string;
    address: string;
    state: string;
    stateCode: string;
    gstin: string;
  };
  paymentTerms: string;
  validityDate: string;
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

  const [form, setForm] = useState<PIForm>({
    client_id: "",
    dealer_id: "",
    clientDetails: {
      name: "",
      companyName: "",
      address: "",
      country: "",
      state: "",
    },
    dealerDetails: {
      name: "",
      address: "",
      state: "",
      stateCode: "",
      gstin: "",
    },
    paymentTerms: "",
    validityDate: "",
    bankDetails: { bankName: "", accountNo: "", branchIfsc: "" },
    vehicleDetails: [
      {
        vehicle_id: "",
        model: "",
        color: "",
        engineNo: "",
        chassisNo: "",
        quantity: 1,
        unitPrice: 0,
        hsn: "",
        fob: "",
        freight: "",
        yom: "",
      },
    ],
  });

  useEffect(() => {
    // Fetch Clients independently
    const fetchClients = async () => {
      try {
        const res = await axios.get(`${apiConfig.baseURL}/clients`, {
          params: { limit: 1000 },
        });
        console.log("Clients Response:", res.data);
        const data = res.data?.data || res.data;
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };

    // Fetch Dealers independently
    const fetchDealers = async () => {
      try {
        const res = await axios.get(`${apiConfig.baseURL}/dealers`, {
          params: { limit: 1000 },
        });
        console.log("Dealers Response:", res.data);
        const data = res.data?.data || res.data;
        setDealers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch dealers:", error);
      }
    };

    // Fetch Vehicles independently
    const fetchVehicles = async () => {
      try {
        // Check common token keys
        let token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        // Fallback: If token is nested inside a stringified "user" object
        if (!token && localStorage.getItem("user")) {
          try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            token = userObj.token || userObj.accessToken;
          } catch (e) {}
        }

        // Remove extra quotes if token was saved directly via JSON.stringify
        if (token && token.startsWith('"') && token.endsWith('"')) {
          token = token.slice(1, -1);
        }

        const res = await axios.get(`${apiConfig.baseURL}/vehicles`, {
          params: { limit: 1000, status: "Available" },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Vehicles Response:", res.data);
        const data = res.data?.data?.data || res.data?.data || res.data;
        setVehicles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      }
    };

    // Run all fetches
    fetchClients();
    fetchDealers();
    fetchVehicles();
  }, []);

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
          client_id: pi.client_id?._id || pi.client_id || "",
          dealer_id: pi.dealer_id?._id || pi.dealer_id || "",
          clientDetails: pi.clientDetails || {
            name: "",
            companyName: "",
            address: "",
            country: "",
            state: "",
          },
          dealerDetails: pi.dealerDetails || {
            name: "",
            address: "",
            state: "",
            stateCode: "",
            gstin: "",
          },
          paymentTerms: pi.paymentTerms || "",
          validityDate: pi.validityDate ? pi.validityDate.split("T")[0] : "",
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
                    unitPrice: 0,
                    hsn: "",
                    fob: "",
                    freight: "",
                    yom: "",
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
  };

  const handleClientSelect = (clientId: string) => {
    const selected = clients.find((c) => c._id === clientId);
    setForm((prev) => ({
      ...prev,
      client_id: clientId,
      clientDetails: {
        name: selected?.name || "",
        companyName: selected?.companyName || "",
        address: selected?.address || "",
        country: selected?.country || "",
        state: selected?.state || "",
      },
    }));
  };

  const handleDealerSelect = (dealerId: string) => {
    const selected = dealers.find((d) => d._id === dealerId);
    setForm((prev) => ({
      ...prev,
      dealer_id: dealerId,
      dealerDetails: {
        name: selected?.name || "",
        address: selected?.address || "",
        state: selected?.state || "",
        stateCode: selected?.stateCode || "",
        gstin: selected?.gstNumber || "",
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
          unitPrice: 0,
          hsn: "",
          fob: "",
          freight: "",
          yom: "",
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

  const totalAmount = form.vehicleDetails.reduce(
    (sum, v) => sum + v.quantity * v.unitPrice,
    0
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Clean up payload (remove empty IDs so mongoose doesn't crash)
    const payload: any = {
      ...form,
      totalAmount,
    };

    if (!payload.dealer_id) delete payload.dealer_id;

    payload.vehicleDetails = payload.vehicleDetails.map((v: any) => {
      const { vehicle_id, ...rest } = v;
      return vehicle_id ? { vehicle_id, ...rest } : rest;
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

  return (
    <div className="space-y-6 bg-slate-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8 rounded-xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {id ? "Edit Proforma Invoice" : "Create Proforma Invoice"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-300">
            {id
              ? "Update PI details"
              : "Draft a new proforma invoice for your clients"}
          </p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to PIs
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PARTIES SECTION */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Parties
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buyer (Client) *
                </label>
                <select
                  required
                  value={form.client_id}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Client Details manually */}
              <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-100 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Company Name
                  </label>
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
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Contact Name
                  </label>
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
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <input
                    value={form.clientDetails.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clientDetails: {
                          ...form.clientDetails,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Country
                  </label>
                  <input
                    value={form.clientDetails.country}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clientDetails: {
                          ...form.clientDetails,
                          country: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    State Name
                  </label>
                  <input
                    value={form.clientDetails.state}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clientDetails: {
                          ...form.clientDetails,
                          state: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>

            <hr className="my-4 border-slate-200 dark:border-gray-700" />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exporter (Dealer)
                </label>
                <select
                  value={form.dealer_id}
                  onChange={(e) => handleDealerSelect(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select a Dealer (Optional)</option>
                  {dealers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Dealer Details manually */}
              <div className="grid grid-cols-2 gap-3 mt-2 p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-100 dark:border-gray-700">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Company Name
                  </label>
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
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <input
                    value={form.dealerDetails.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dealerDetails: {
                          ...form.dealerDetails,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    State Name
                  </label>
                  <input
                    value={form.dealerDetails.state}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dealerDetails: {
                          ...form.dealerDetails,
                          state: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    State Code
                  </label>
                  <input
                    value={form.dealerDetails.stateCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dealerDetails: {
                          ...form.dealerDetails,
                          stateCode: e.target.value,
                        },
                      })
                    }
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    GSTIN
                  </label>
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
                    className="w-full border rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TERMS & BANK SECTION */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Terms & Bank
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validity Date
                </label>
                <input
                  type="date"
                  value={form.validityDate}
                  onChange={(e) =>
                    setForm({ ...form, validityDate: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Terms
                </label>
                <input
                  placeholder="e.g. 100% Advance"
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({ ...form, paymentTerms: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="col-span-2 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bank Details (Optional)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Vehicle Line Items
            </h3>
            <button
              type="button"
              onClick={addVehicle}
              className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Plus size={16} /> Add Vehicle
            </button>
          </div>

          {form.vehicleDetails.map((v, index) => (
            <div
              key={index}
              className="relative bg-slate-50 dark:bg-gray-900 p-4 rounded-xl border border-slate-200 dark:border-gray-700 mb-4 transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Core Details */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Select Inventory Vehicle
                  </label>
                  <select
                    value={v.vehicle_id}
                    onChange={(e) => handleVehicleSelect(index, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">-- Custom/Manual Entry --</option>
                    {vehicles.map((veh) => (
                      <option key={veh._id || veh.id} value={veh._id || veh.id}>
                        {veh.name} ({veh.chassisNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Model / Description *
                  </label>
                  <input
                    required
                    placeholder="Vehicle Model"
                    value={v.model}
                    onChange={(e) =>
                      handleVehicleChange(index, "model", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={v.quantity}
                    onChange={(e) =>
                      handleVehicleChange(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-center"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={v.unitPrice}
                    onChange={(e) =>
                      handleVehicleChange(
                        index,
                        "unitPrice",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
                  />
                </div>

                {/* Advanced Details Row */}
                <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-2 pt-4 border-t border-slate-200 dark:border-gray-700/50">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Color
                    </label>
                    <input
                      placeholder="Color"
                      value={v.color}
                      onChange={(e) =>
                        handleVehicleChange(index, "color", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Engine No
                    </label>
                    <input
                      placeholder="Engine No"
                      value={v.engineNo}
                      onChange={(e) =>
                        handleVehicleChange(index, "engineNo", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Chassis No
                    </label>
                    <input
                      placeholder="Chassis No"
                      value={v.chassisNo}
                      onChange={(e) =>
                        handleVehicleChange(index, "chassisNo", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      YOM
                    </label>
                    <input
                      placeholder="Year"
                      value={v.yom}
                      onChange={(e) =>
                        handleVehicleChange(index, "yom", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      HSN/SAC
                    </label>
                    <input
                      placeholder="HSN Code"
                      value={v.hsn}
                      onChange={(e) =>
                        handleVehicleChange(index, "hsn", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      FOB
                    </label>
                    <input
                      placeholder="FOB Point"
                      value={v.fob}
                      onChange={(e) =>
                        handleVehicleChange(index, "fob", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Freight
                    </label>
                    <input
                      placeholder="Freight Info"
                      value={v.freight}
                      onChange={(e) =>
                        handleVehicleChange(index, "freight", e.target.value)
                      }
                      className="w-full border rounded-md px-2.5 py-1.5 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border-slate-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {form.vehicleDetails.length > 1 && (
                <div className="absolute -top-3 -right-3">
                  <button
                    type="button"
                    onClick={() => removeVehicle(index)}
                    className="bg-white dark:bg-gray-800 p-1.5 rounded-full border border-slate-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end mt-4">
            <div className="bg-slate-50 dark:bg-gray-900 px-6 py-3 rounded-lg border border-slate-200 dark:border-gray-700 text-right min-w-50">
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">
                Grand Total
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                $
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/proforma-invoice")}
            className="px-6 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {loading
              ? id
                ? "Updating..."
                : "Creating..."
              : id
              ? "Update PI"
              : "Create PI"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePI;
