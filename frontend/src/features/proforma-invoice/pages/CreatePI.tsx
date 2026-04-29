import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { piApi } from "../components/piApi";
import {
  getRate,
  getAmount,
  validatePIForm,
  numberToWords,
} from "../components/piValidation"; // Keep piValidation imports
import { defaultPIForm } from "../components/piValidation"; // Import defaultPIForm from piValidation
import {
  PIForm,
  VehicleLineItem,
  ProformaInvoiceAPI,
  AddressDetails,
} from "../components/pi.types"; // Import ProformaInvoiceAPI
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
  const [companies, setCompanies] = useState<any[]>([]); // Renamed from dealers
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [previewLoading, setPreviewLoading] = useState(false); // Keep previewLoading

  // Fetch Order states
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Search states for comboboxes
  const [clientSearch, setClientSearch] = useState("");
  const [companySearch, setCompanySearch] = useState(""); // Renamed from dealerSearch

  const [form, setForm] = useState<PIForm>({ ...defaultPIForm });
  const debouncedClientSearch = useDebounce(clientSearch, 500);
  const debouncedCompanySearch = useDebounce(companySearch, 500); // Renamed from debouncedDealerSearch
  const debouncedBookingSearch = useDebounce(bookingSearch, 500);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await piApi.getClients(debouncedClientSearch); // Keep getClients
        setClients(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      }
    };
    const fetchDealers = async () => {
      try {
        const data = await piApi.getCompanies(debouncedCompanySearch); // Use getCompanies
        setCompanies(Array.isArray(data) ? data : []); // Set to companies state
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };
    fetchClients();
    fetchDealers(); // This now fetches companies
  }, [debouncedClientSearch, debouncedCompanySearch]); // Updated dependency

  // Fetch orders for the combobox
  useEffect(() => {
  const fetchBookings = async () => {
    try {
      if (!form.client_id) {
        setBookings([]);
        return;
      }

      const data = await piApi.getBookedVehicleOrders(
        form.client_id,
        debouncedBookingSearch
      );

      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setBookings([]);
    }
  };

  fetchBookings();
}, [form.client_id, debouncedBookingSearch]);

  // Fetch suggested PI number for new PI creation
  useEffect(() => {
    if (!id && form.company_id) {
      // Only for new PI and if a company is selected
      const fetchSuggestedPiNumber = async () => {
        try {
          const suggestedPi = await piApi.getSuggestedNextPiNumber(
            form.company_id
          );
          setForm((prev) => ({ ...prev, piNumber: suggestedPi }));
        } catch (error) {
          console.error("Failed to fetch suggested PI number:", error);
          // Optionally, set a default or leave empty if generation fails
          setForm((prev) => ({ ...prev, piNumber: "" }));
        }
      };
      fetchSuggestedPiNumber();
    }
  }, [id, form.company_id]); // Re-fetch if company_id changes for a new PI

  // Fetch existing PI if in edit mode
  useEffect(() => {
    if (!id) return;
    const fetchPI = async () => {
      try {
        const pi: ProformaInvoiceAPI = await piApi.getPIById(id); // Explicitly type pi
        setForm({
          piNumber: pi.piNumber || "",
          client_id:
            (typeof pi.client_id === "object" && pi.client_id?._id) ||
            (typeof pi.client_id === "string" ? pi.client_id : "") ||
            "",
          company_id:
            (typeof pi.company_id === "object" && pi.company_id?._id) ||
            (typeof pi.company_id === "string" ? pi.company_id : "") ||
            "", // Corrected access for company_id
          paymentTerms: pi.paymentTerms || "",
          validityDate: pi.validityDate ? pi.validityDate.split("T")[0] : "",
          termsOfDelivery: pi.termsOfDelivery || "",
          incoterm: pi.incoterm || "",
          clientSnapshot: (() => {
            if (pi.clientSnapshot) {
              // Ensure address is an object if it was a string in the snapshot
              if (
                pi.clientSnapshot.address &&
                typeof pi.clientSnapshot.address === "string"
              ) {
                pi.clientSnapshot.address = {
                  streetArea: pi.clientSnapshot.address,
                  houseBuilding: "",
                  cityTown: "",
                  state: "",
                  pincode: "",
                  country: "",
                };
              }
              return pi.clientSnapshot;
            }
            if (typeof pi.client_id === "object") {
              let clientAddressForSnapshot: AddressDetails = {
                houseBuilding: "",
                streetArea: "",
                cityTown: "",
                state: "",
                pincode: "",
                country: "",
              };

              if (
                pi.client_id.address &&
                typeof pi.client_id.address === "string"
              ) {
                clientAddressForSnapshot.streetArea = pi.client_id.address;
                if (pi.client_id.country) {
                  clientAddressForSnapshot.country = pi.client_id.country;
                }
              } else if (
                pi.client_id.address &&
                typeof pi.client_id.address === "object"
              ) {
                clientAddressForSnapshot = pi.client_id.address;
              }

              return {
                name: pi.client_id.name,
                companyName: pi.client_id.companyName,
                clientCode: pi.client_id.clientCode,
                email: pi.client_id.email,
                phone: pi.client_id.phone,
                address: clientAddressForSnapshot,
              };
            }
            return undefined;
          })(),
          companySnapshot:
            pi.companySnapshot ||
            (typeof pi.company_id === "object" ? pi.company_id : undefined), // Ensure address and bankDetails are objects if they were strings
          buyersRef: pi.buyersRef || "",
          otherRef: pi.otherRef || "",
          dispatchedThrough: pi.dispatchedThrough || "",
          destination: pi.destination || "",
          portOfLoading: pi.portOfLoading || "",
          portOfDischarge: pi.portOfDischarge || "",
          vehicleBookingIds: pi.vehicleBookingIds || [],
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
    if (form.client_id === clientId) return;
    const selectedClientData = clients.find((c) => c._id === clientId);
    let clientAddressForSnapshot: AddressDetails = {
      houseBuilding: "",
      streetArea: "",
      cityTown: "",
      state: "",
      pincode: "",
      country: "",
    };

    if (
      selectedClientData?.address &&
      typeof selectedClientData.address === "string"
    ) {
      clientAddressForSnapshot.streetArea = selectedClientData.address;
      if (selectedClientData.country) {
        clientAddressForSnapshot.country = selectedClientData.country;
      }
    } else if (
      selectedClientData?.address &&
      typeof selectedClientData.address === "object"
    ) {
      clientAddressForSnapshot = selectedClientData.address;
    }

    setForm((prev) => ({
      ...prev,
      client_id: clientId,
      vehicleBookingIds: [],
      vehicleDetails: [],
      clientSnapshot: {
        name: selectedClientData?.name,
        companyName: selectedClientData?.companyName,
        clientCode: selectedClientData?.clientCode,
        email: selectedClientData?.email,
        phone: selectedClientData?.phone,
        address: clientAddressForSnapshot,
      },
    }));
    setSelectedBooking(null);
    setBookings([]);
    setBookingSearch("");
  };

  // Handle direct change to piNumber field
  const handlePiNumberChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      piNumber: value,
    }));
  };
  // Helper function to update nested state properties
  const updateNestedProperty = (obj: any, path: string, value: any): any => {
    const parts = path.split(".");
    let current = { ...obj }; // Create a shallow copy to start
    let pointer = current;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!pointer[part] || typeof pointer[part] !== "object") {
        pointer[part] = {}; // Initialize if not existing or not an object
      }
      pointer = pointer[part];
    }
    pointer[parts[parts.length - 1]] = value;
    return current;
  };

  const handleClientSnapshotChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      clientSnapshot: updateNestedProperty(prev.clientSnapshot, field, value),
    }));
  };

  const handleCompanySelect = (companyId: string) => {
    // Renamed from handleDealerSelect
    const selectedCompanyData = companies.find((c) => c._id === companyId);
    // Ensure address and bankDetails are also copied if they exist
    setForm((prev) => ({
      ...prev,
      company_id: companyId, // Set company_id
      piNumber: id ? prev.piNumber : "", // Clear piNumber if it's a new PI and company changes, so new suggested number can be fetched
      companySnapshot: selectedCompanyData || {},
    }));
  };

  const handleCompanySnapshotChange = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      companySnapshot: updateNestedProperty(prev.companySnapshot, field, value),
    }));
  };

  // Fetch Order Logic
  const handleSelectBooking = (booking: any) => {
    console.log("BOOKING DATA =", booking);
  setSelectedBooking(booking);

  const vehicle = booking.vehicleId || {};

const newVehicle = {
  booking_id: booking._id,
  vehicle_id: vehicle._id || "",

  model: `${vehicle.brandName || ""} ${vehicle.modelName || ""} ${vehicle.variant || ""}`.trim(),

  color: vehicle.color || "",

  engineNo: booking.engineNumber || "",
  chassisNo: booking.chassisNumber || "",

  quantity: 1,

  hsn: booking.hsnCode || "",

  fob: vehicle.fobAmount || 0,
  freight: booking.paymentAmount || vehicle.freight || 0,

  yom: booking.yom || "",
  fuelType: booking.fuelType || "",
  countryOfOrigin: booking.countryOfOrigin || "",
  engineCapacity: booking.engineCapacity || "",

  selected: true,
};

  setForm((prev) => {
  const alreadyAdded =
    prev.vehicleBookingIds?.includes(booking._id) ?? false;

  if (alreadyAdded) {
    toast.info("Vehicle already added");
    return prev;
  }

  return {
    ...prev,
    vehicleBookingIds: [...(prev.vehicleBookingIds || []), booking._id],
    vehicleDetails: [...prev.vehicleDetails, newVehicle],
  };
});

  setSelectedBooking(null);
toast.success("Vehicle added to invoice");
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
      clientSnapshot: form.clientSnapshot,
      companySnapshot: form.companySnapshot,
    };

    payload.vehicleBookingIds =
    payload.vehicleBookingIds?.filter(Boolean) || [];

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

  const bookingsWithDisplay = bookings.map((b, index) => ({
  ...b,
  serialNumber: index + 1,
  displayName:
  `${b.orderId?.orderNumber || "-"} | ` +
  `${b.vehicleId?.brandName || ""} ${b.vehicleId?.modelName || "-"} | ` +
  `${b.chassisNumber || "No Chassis"}`
}));

  return (
    <div className="bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                size="default"
                className="h-12 w-12 rounded-full border-gray-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-md transition-all duration-200 cursor-pointer"
              >
                <ChevronLeft className="size-6" strokeWidth={2.5} />
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
            clients={clients} // Keep clients
            companies={companies} // Renamed from dealers
            ordersWithDisplay={bookingsWithDisplay}
            selectedOrder={selectedBooking}
            setClientSearch={setClientSearch}
            setCompanySearch={setCompanySearch} // Renamed from setDealerSearch
            setOrderSearch={setBookingSearch}
            handlePiNumberChange={handlePiNumberChange} // Pass the new handler
            handleSelectOrder={handleSelectBooking}
            handleVehicleChange={handleVehicleChange}
            handleClientSelect={handleClientSelect} // Keep handleClientSelect
            handleClientSnapshotChange={handleClientSnapshotChange}
            handleCompanySelect={handleCompanySelect} // Renamed from handleDealerSelect
            handleCompanySnapshotChange={handleCompanySnapshotChange}
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
