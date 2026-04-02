import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { piApi } from "../components/piApi";
import {
  defaultAddress,
  defaultPIForm,
  getRate,
  getAmount,
  validatePIForm,
  numberToWords,
} from "../components/piValidation";
import { PIForm, VehicleLineItem } from "../components/pi.types";
import PIFormFields from "../components/PIFormFields"; // Import the new component

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CreatePI = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [clients, setClients] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [previewLoading, setPreviewLoading] = useState(false);

  // Import from Order states
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Search states for comboboxes
  const [clientSearch, setClientSearch] = useState("");
  const [dealerSearch, setDealerSearch] = useState("");

  const [form, setForm] = useState<PIForm>({ ...defaultPIForm });
  const debouncedClientSearch = useDebounce(clientSearch, 500);
  const debouncedDealerSearch = useDebounce(dealerSearch, 500);
  const debouncedOrderSearch = useDebounce(orderSearch, 500);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await piApi.getClients(debouncedClientSearch);
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };
    const fetchDealers = async () => {
      try {
        const data = await piApi.getDealers(debouncedDealerSearch);
        setDealers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch dealers:", error);
      }
    };
    fetchClients();
    fetchDealers();
  }, [debouncedClientSearch, debouncedDealerSearch]);

  // Fetch orders for the combobox
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrders(await piApi.getOrders(debouncedOrderSearch));
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
  }, [debouncedOrderSearch]);

  // Fetch existing PI if in edit mode
  useEffect(() => {
    if (!id) return;
    const fetchPI = async () => {
      try {
        const pi = await piApi.getPIById(id);
        setForm({
          piNumber: pi.piNumber || "",
          client_id: pi.client_id?._id || pi.client_id || "",
          dealer_id: pi.dealer_id?._id || pi.dealer_id || "",
          clientDetails: {
            name: pi.clientDetails?.name || "",
            companyName: pi.clientDetails?.companyName || "",
            address: {
              ...defaultAddress,
              ...(typeof pi.clientDetails?.address === "object" &&
              pi.clientDetails.address
                ? pi.clientDetails.address
                : typeof pi.clientDetails?.address === "string"
                ? { streetArea: pi.clientDetails.address }
                : {}),
            },
          },
          dealerDetails: {
            name: pi.dealerDetails?.name || "",
            gstin: pi.dealerDetails?.gstin || "",
            address: {
              ...defaultAddress,
              ...(typeof pi.dealerDetails?.address === "object" &&
              pi.dealerDetails.address
                ? pi.dealerDetails.address
                : typeof pi.dealerDetails?.address === "string"
                ? { streetArea: pi.dealerDetails.address }
                : {}),
            },
          },
          paymentTerms: pi.paymentTerms || "",
          validityDate: pi.validityDate ? pi.validityDate.split("T")[0] : "",
          termsOfDelivery: pi.termsOfDelivery || "",
          incoterm: pi.incoterm || "",
          portOfLoading: pi.portOfLoading || "",
          portOfDischarge: pi.portOfDischarge || "",
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
                  selected: true,
                }))
              : [],
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
          ...(typeof selected?.address === "object" && selected.address
            ? selected.address
            : { streetArea: selected?.address || "" }),
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
          ...(typeof selected?.address === "object" && selected.address
            ? selected.address
            : { streetArea: selected?.address || "" }),
          state: selected?.state || "",
        },
      },
    }));
  };

  // Import from Order Logic
  const handleSelectOrder = async (orderId: string) => {
    if (!orderId) return;
    try {
      const orderData = await piApi.getOrderById(orderId);
      setSelectedOrder(orderData);

      // Map all vehicles from order
      const mappedVehicles = (orderData.vehicles || []).map((v: any) => ({
        vehicle_id: v.vehicle_id || v._id || "",
        model: v.name || v.vehicleName || "",
        color: v.color || v.exteriorColour || "",
        engineNo: v.engineNo || "",
        chassisNo: v.chassisNo || "",
        quantity: Number(v.quantity) || Number(v.qty) || 1,
        hsn: v.hsnCode || "",
        fob: v.fobAmount || 0,
        freight: v.freight || 0,
        yom: v.yom ? String(v.yom) : "",
        fuelType: v.fuelType || "",
        countryOfOrigin: v.countryOfOrigin || "",
        engineCapacity: v.engineCapacity || "",
        selected: true,
      }));

      // Populate Dealer
      const dId = orderData.dealerId?._id || orderData.dealerId;
      if (dId) {
        const dealerInState = dealers.find((d) => d._id === dId);
        if (dealerInState) {
          handleDealerSelect(dId);
        } else {
          try {
            const d = await piApi.getDealerById(dId);
            setForm((prev) => ({
              ...prev,
              dealer_id: dId,
              dealerDetails: {
                name: d.name || "",
                gstin: d.gstNumber || "",
                address: {
                  ...prev.dealerDetails.address,
                  ...(typeof d.address === "object" && d.address
                    ? d.address
                    : { streetArea: d.address || "" }),
                  state: d.state || "",
                },
              },
            }));
          } catch (e) {
            setForm((prev) => ({
              ...prev,
              dealer_id: dId,
              dealerDetails: {
                ...prev.dealerDetails,
                name: orderData.dealerName || "",
              },
            }));
          }
        }
      }

      setForm((prev) => ({
        ...prev,
        vehicleDetails: mappedVehicles,
      }));

      toast.success("Order details imported successfully!");
    } catch (err) {
      toast.error("Failed to load order details");
    }
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const totalAmount = form.vehicleDetails.reduce(
    (sum, v) => (v.selected !== false ? sum + getAmount(v) : sum),
    0
  );

  const validateForm = () => {
    const { isValid, errors: newErrors, errorMessage } = validatePIForm(form);
    if (!isValid && errorMessage) {
      toast.error(errorMessage);
      return false;
    }
    setErrors(newErrors);
    return isValid;
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

    payload.vehicleDetails = payload.vehicleDetails
      .filter((v: any) => v.selected !== false)
      .map((v: any) => {
        const { vehicle_id, selected, ...rest } = v;
        // Include unitPrice for backward compatibility on backend if needed
        return vehicle_id
          ? { vehicle_id, unitPrice: getRate(v), ...rest }
          : { unitPrice: getRate(v), ...rest };
      });

    try {
      setLoading(true);
      if (id) {
        await piApi.updatePI(id, payload);
        toast.success("PI updated successfully ✅");
        navigate(`/proforma-invoice/${id}`);
      } else {
        const res = await piApi.createPI(payload);
        toast.success("PI created successfully ✅");
        navigate(`/proforma-invoice/${res._id || res.id}`);
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
      const res = await piApi.previewPDF(id);

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

  const ordersWithDisplay = orders.map((o) => {
    let extractedDealerName = o.dealerName || o.dealer?.[0]?.name;
    if (!extractedDealerName && o.dealerId) {
      const dId = typeof o.dealerId === "object" ? o.dealerId._id : o.dealerId;
      const foundDealer = dealers.find((d) => d._id === dId);
      if (foundDealer) extractedDealerName = foundDealer.name;
    }
    extractedDealerName = extractedDealerName || "Unknown";

    return {
      ...o,
      dealerName: extractedDealerName,
      displayName: `${o.orderId} - ${extractedDealerName} (${
        o.date ? new Date(o.date).toLocaleDateString() : "-"
      })`,
    };
  });

  return (
    <div className="bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => navigate("/proforma-invoice")}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-200"
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
                className="h-12 px-6 text-blue-600 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewLoading ? "Loading..." : "Preview PDF"}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              >
                {loading
                  ? "Processing..."
                  : id
                  ? "Save Changes"
                  : "Generate PI"}
              </Button>
            </div>
          </div>

          <PIFormFields
            form={form}
            setForm={setForm}
            errors={errors}
            clients={clients}
            dealers={dealers}
            ordersWithDisplay={ordersWithDisplay}
            selectedOrder={selectedOrder}
            setClientSearch={setClientSearch}
            setDealerSearch={setDealerSearch}
            setOrderSearch={setOrderSearch}
            handleSelectOrder={handleSelectOrder}
            handleVehicleChange={handleVehicleChange}
            handleClientSelect={handleClientSelect}
            handleDealerSelect={handleDealerSelect}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            totalAmount={totalAmount}
            numberToWords={numberToWords}
            getRate={getRate}
            getAmount={getAmount}
          />
        </form>
      </div>
    </div>
  );
};

export default CreatePI;
