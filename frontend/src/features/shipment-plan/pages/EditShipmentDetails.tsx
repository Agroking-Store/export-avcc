import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Anchor,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Globe,
  MapPin,
  Package,
  PackagePlus,
  Search,
  Ship,
  User,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  emptyShippingDetail,
  shippingFields,
  ShippingDetailForm,
  type ShippingDetail,
} from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";
import {
  shipmentCustomerApi,
  type CustomerNameOption,
} from "../../../services/shipmentCustomerApi";
import { useAuth } from "../../../hooks/useAuth";

const fieldIcons: Record<
  keyof ShippingDetailForm,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  customerName: User,
  destinationCountry: Globe,
  portOfLoading: Anchor,
  portOfDischarge: MapPin,
  shippingLine: Ship,
  vesselName: PackagePlus,
  sailingDate: Calendar,
  arrivalDate: Calendar,
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const inputStyle =
  "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

const labelStyle =
  "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

const EditShipmentDetails = () => {
  const navigate = useNavigate();
  const { shipmentId } = useParams();
  const { isClient } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shipment, setShipment] = useState<ShippingDetail | null>(null);
  const [form, setForm] = useState<ShippingDetailForm>(emptyShippingDetail);

  const [customerOptions, setCustomerOptions] = useState<CustomerNameOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(
    () =>
      customerOptions.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [customerOptions, searchQuery],
  );

  useEffect(() => {
    if (!shipmentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await shipmentApi.getById(shipmentId);
        setShipment(data);
        setForm({
          customerName: data.customerName || "",
          destinationCountry: data.destinationCountry || "",
          portOfLoading: data.portOfLoading || "",
          portOfDischarge: data.portOfDischarge || "",
          shippingLine: data.shippingLine || "",
          vesselName: data.vesselName || "",
          sailingDate: data.sailingDate
            ? new Date(data.sailingDate).toISOString().slice(0, 10)
            : "",
          arrivalDate: data.arrivalDate
            ? new Date(data.arrivalDate).toISOString().slice(0, 10)
            : "",
        });
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load shipment");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [shipmentId]);

  useEffect(() => {
    if (isClient) return;
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const list = await shipmentCustomerApi.listCustomerNames();
        setCustomerOptions(list);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to load customer list");
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, [isClient]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const panel = document.getElementById("shipment-customer-dropdown");
      if (panel && !panel.contains(target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSaving(true);
      await shipmentApi.update(shipmentId as string, form);
      navigate("/shipment-planning/list", {
        state: { success: "Shipping details updated successfully" },
      });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update shipping details");
    } finally {
      setSaving(false);
    }
  };


  if (isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Loading shipment...
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-white p-10 text-center text-rose-600 shadow-sm">
        Shipment not found.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Edit Shipping Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Shipment ID: #{shipment._id.slice(-6).toUpperCase()}
          </p>
        </div>

        <button
          onClick={() => navigate("/shipment-planning/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Shipping Details
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Shipment Information
            </h2>
          </div>

          {/* <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800 text-sm font-semibold">
            Edit Save ke liye backend update API abhi available nahi hai. UI prefill dikhane ke liye page create kiya gaya hai.
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingFields.map((field) => {
              const Icon = fieldIcons[field.key as keyof ShippingDetailForm];

              if (field.key === "customerName") {
                return (
                  <div key={field.key} className="relative">
                    <label className={labelStyle}>
                      <Icon size={14} className={field.iconTone} /> {field.label}
                      {field.required && <span className="text-rose-600"> *</span>}
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen((prev) => !prev);
                        setSearchQuery("");
                      }}
                      disabled={loadingCustomers}
                      className={`${inputStyle} flex items-center justify-between gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {form.customerName ? (
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                            {initials(form.customerName)}
                          </span>
                          {form.customerName}
                        </span>
                      ) : (
                        <span className="text-[#A0AEC0]">
                          {loadingCustomers ? "Loading..." : "Select customer"}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        id="shipment-customer-dropdown"
                        className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
                          <Search size={14} className="text-gray-400 flex-shrink-0" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                            >
                              <X
                                size={14}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              />
                            </button>
                          )}
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          {filteredCustomers.length === 0 ? (
                            <div className="px-4 py-4 text-sm text-gray-400 text-center">
                              No customers found
                            </div>
                          ) : (
                            filteredCustomers.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setForm((cur) => ({ ...cur, customerName: c.name }));
                                  setDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                                  form.customerName === c.name
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center flex-shrink-0 ${
                                    form.customerName === c.name
                                      ? "bg-indigo-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                                  }`}
                                >
                                  {initials(c.name)}
                                </span>
                                {c.name}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={field.key}>
                  <label className={labelStyle}>
                    <Icon size={14} className={field.iconTone} /> {field.label}
                    {field.required && <span className="text-rose-600"> *</span>}
                  </label>
                  <input
                    type={field.type ?? "text"}
                    value={form[field.key] as unknown as string}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: event.target.value as any,
                      }))
                    }
                    className={inputStyle}
                    placeholder={field.type === "date" ? "" : field.label}
                    required={field.required}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/shipment-planning/list")}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : <><Package size={16} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditShipmentDetails;

