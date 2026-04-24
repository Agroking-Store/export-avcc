import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  FileText,
  Save,
  Eye,
  ArrowLeft,
  Ship,
  Landmark,
  BadgeDollarSign,
  ClipboardList,
  Calculator,
  Hash,
  Calendar,
  Truck,
  Scale,
  MessageSquare,
} from "lucide-react";

import { apiConfig } from "@/config/apiConfig";

/* =====================================================
   REUSABLE FIELD
===================================================== */

type FieldProps = {
  label: string;
  name?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
};

const Field = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  type = "text",
}: FieldProps) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-all
        ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-500"
            : "bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        }`}
      />
    </div>
  );
};

/* =====================================================
   SECTION WRAPPER
===================================================== */

const SectionCard = ({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-2xl flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <h2 className="text-lg font-black text-slate-800">{title}</h2>
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
};

/* =====================================================
   MAIN
===================================================== */

const CreateTaxInvoice = () => {
  const navigate = useNavigate();
  const { id: piId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [form, setForm] = useState({
    taxInvoiceNo: "",
    invoiceDate: new Date().toISOString().slice(0, 10),

    piNo: "",
    piDate: "",

    buyerOrderDate: "",
    otherReference: "",

    preCarriage: "",
    placeReceipt: "",
    vesselFlight: "",
    shipmentMode: "BY SEA",

    portOfLoading: "",
    portOfDischarge: "",
    placeDelivery: "",
    countryDestination: "",

    countryOrigin: "INDIA",
    totalCartons: "1",
    termsOfDelivery: "",

    stateOfOrigin: "Maharashtra",
    districtOfOrigin: "Pune",

    drawbackShipment: "YES",
    rodtepSchemeCode: "",
    endUseCode: "",
    igstPaymentStatus: "YES",
    shipmentExportUnderIgst: "YES",
    adCode: "",

    bankName: "",
    accountNo: "",
    ifsc: "",
    swiftCode: "",

    netWeight: "",
    grossWeight: "",

    gstPercent: 0,
    remarks: "",
  });

  /* =====================================================
     CHANGE
  ===================================================== */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     FETCH PI
  ===================================================== */

  useEffect(() => {
    const fetchPI = async () => {
      try {
        const res = await axios.get(
          `${apiConfig.baseURL}/proforma-invoices/${piId}`
        );

        const pi = res.data;

        setVehicles(pi.vehicleDetails || []);

        setForm((prev) => ({
          ...prev,
          taxInvoiceNo: "TI-" + Date.now().toString().slice(-6),

          piNo: pi.piNumber || "",
          piDate: pi.createdAt?.slice(0, 10) || "",

          portOfLoading: pi.portOfLoading || "",
          portOfDischarge: pi.portOfDischarge || "",
          placeDelivery: pi.destination || "",

          countryDestination:
            pi.clientSnapshot?.address?.country ||
            pi.clientSnapshot?.country ||
            "",

          termsOfDelivery: pi.termsOfDelivery || "",

          bankName:
            pi.companySnapshot?.bankDetails?.bankName || "",
          accountNo:
            pi.companySnapshot?.bankDetails?.accountNo || "",
          ifsc:
            pi.companySnapshot?.bankDetails?.branchIfsc || "",
          swiftCode:
            pi.companySnapshot?.bankDetails?.swiftCode || "",

          totalCartons: String(
            pi.vehicleDetails?.length || 1
          ),
        }));
      } catch {
        toast.error("Failed to load PI details");
      } finally {
        setLoading(false);
      }
    };

    fetchPI();
  }, [piId]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const subtotal = useMemo(() => {
    return vehicles.reduce(
      (sum, v) =>
        sum +
        Number(v.quantity || 0) *
          (Number(v.fob || 0) + Number(v.freight || 0)),
      0
    );
  }, [vehicles]);

  const gstAmount = useMemo(() => {
    return subtotal * (Number(form.gstPercent) / 100);
  }, [subtotal, form.gstPercent]);

  const grandTotal = useMemo(() => {
    return subtotal + gstAmount;
  }, [subtotal, gstAmount]);

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await axios.post(
        `${apiConfig.baseURL}/tax-invoices`,
        {
          piId,
          ...form,
          subtotal,
          gstAmount,
          grandTotal,
        }
      );

      setSavedId(res.data.data._id);

      toast.success("Tax Invoice Saved");
    } catch {
      toast.error("Failed to save Tax Invoice");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!savedId) return;

    window.open(
      `${apiConfig.baseURL}/tax-invoices/${savedId}/pdf`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
  <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Generate Export Invoice
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create tax invoice from PI {form.piNo}
        </p>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>
    </div>

    <form className="space-y-10">

      {/* BASIC DETAILS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Basic Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Tax Invoice No" name="taxInvoiceNo" value={form.taxInvoiceNo} onChange={handleChange} />
          <Field label="Invoice Date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} type="date" />
          <Field label="PI Number" value={form.piNo} disabled />
          <Field label="PI Date" value={form.piDate} disabled />
          <Field label="Buyer Order & Date" name="buyerOrderDate" value={form.buyerOrderDate} onChange={handleChange} />
          <Field label="Other Reference" name="otherReference" value={form.otherReference} onChange={handleChange} />
        </div>
      </div>

      {/* SHIPPING */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-cyan-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Shipping Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Pre Carriage" name="preCarriage" value={form.preCarriage} onChange={handleChange} />
          <Field label="Place Receipt" name="placeReceipt" value={form.placeReceipt} onChange={handleChange} />
          <Field label="Vessel / Flight" name="vesselFlight" value={form.vesselFlight} onChange={handleChange} />
          <Field label="Shipment Mode" name="shipmentMode" value={form.shipmentMode} onChange={handleChange} />

          <Field label="Port Loading" name="portOfLoading" value={form.portOfLoading} onChange={handleChange} />
          <Field label="Port Discharge" name="portOfDischarge" value={form.portOfDischarge} onChange={handleChange} />
          <Field label="Place Delivery" name="placeDelivery" value={form.placeDelivery} onChange={handleChange} />
          <Field label="Destination Country" name="countryDestination" value={form.countryDestination} onChange={handleChange} />

          <Field label="Country Origin" name="countryOrigin" value={form.countryOrigin} onChange={handleChange} />
          <Field label="Total Cartons" name="totalCartons" value={form.totalCartons} onChange={handleChange} />
          <Field label="State Of Origin" name="stateOfOrigin" value={form.stateOfOrigin} onChange={handleChange} />
          <Field label="District Of Origin" name="districtOfOrigin" value={form.districtOfOrigin} onChange={handleChange} />
        </div>

        <Field label="Terms Of Delivery" name="termsOfDelivery" value={form.termsOfDelivery} onChange={handleChange} />
      </div>

      {/* BANK DETAILS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Bank Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
          <Field label="Account No" name="accountNo" value={form.accountNo} onChange={handleChange} />
          <Field label="IFSC" name="ifsc" value={form.ifsc} onChange={handleChange} />
          <Field label="SWIFT" name="swiftCode" value={form.swiftCode} onChange={handleChange} />
        </div>
      </div>

      {/* WEIGHT DETAILS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-purple-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Weight Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Net Weight" name="netWeight" value={form.netWeight} onChange={handleChange} />
          <Field label="Gross Weight" name="grossWeight" value={form.grossWeight} onChange={handleChange} />
        </div>
      </div>

      {/* TOTALS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Totals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Field label="GST %" name="gstPercent" value={form.gstPercent} onChange={handleChange} />

          <div className="bg-[#F8F9FB] rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Subtotal</p>
            <p className="font-bold text-lg">${subtotal.toFixed(2)}</p>
          </div>

          <div className="bg-[#F8F9FB] rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase">Tax</p>
            <p className="font-bold text-lg">${gstAmount.toFixed(2)}</p>
          </div>

          <div className="bg-indigo-600 text-white rounded-xl p-4">
            <p className="text-xs uppercase opacity-70">Grand Total</p>
            <p className="font-bold text-xl">${grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* REMARKS */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="h-5 w-1 bg-orange-500 rounded-full"></div>
          <h2 className="text-base font-bold text-gray-700">
            Remarks
          </h2>
        </div>

        <Field label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />
      </div>

      {/* FOOTER */}
      <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100">

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handlePreview}
          disabled={!savedId}
          className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-xs uppercase tracking-widest disabled:opacity-40"
        >
          <Eye size={16} /> Preview
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Invoice"}
        </button>
      </div>
    </form>
  </div>
);
};

export default CreateTaxInvoice;