import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Anchor,
  ArrowLeft,
  Calendar,
  Globe,
  MapPin,
  PackagePlus,
  Ship,
  User,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  emptyShippingDetail,
  shippingFields,
  ShippingDetailForm,
} from "./shipmentData";
import { shipmentApi } from "../../../services/shipmentApi";

const fieldIcons = {
  customerName: User,
  destinationCountry: Globe,
  portOfLoading: Anchor,
  portOfDischarge: MapPin,
  shippingLine: Ship,
  vesselName: PackagePlus,
  sailingDate: Calendar,
  arrivalDate: Calendar,
};

const AddShipmentDetails = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingDetailForm>(emptyShippingDetail);
  const [saving, setSaving] = useState(false);

  const inputStyle =
    "w-full bg-[#F8F9FB] dark:bg-gray-800 border border-[#F1F3F6] dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

  const labelStyle =
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingField = shippingFields.find(
      (field) => field.required && !String(form[field.key] || "").trim()
    );
    if (missingField) {
      toast.error(`${missingField.label} is required`);
      return;
    }

    try {
      setSaving(true);
      await shipmentApi.create(form);
      navigate("/shipment-planning/list", {
        state: { success: "Shipping details added successfully" },
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add shipping details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Add Shipping Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new shipment schedule
          </p>
        </div>

        <button
          onClick={() => navigate("/shipment-planning/list")}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Shipping Details
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">
              Shipment Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingFields.map((field) => {
              const Icon = fieldIcons[field.key];
              return (
                <div key={field.key}>
                  <label className={labelStyle}>
                    <Icon size={14} className={field.iconTone} /> {field.label}
                    {field.required && <span className="text-rose-600"> *</span>}
                  </label>
                  <input
                    type={field.type ?? "text"}
                    value={form[field.key]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
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
            {saving ? "Saving..." : <><PackagePlus size={18} /> Confirm & Save Details</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddShipmentDetails;
