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

  // LEGACY: handleGenerateTaxInvoiceSubmit — disconnected 2026-05-03
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
    <div className="w-full rounded-[2rem] border border-amber-200 bg-amber-50 px-6 py-8 text-amber-900 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Legacy Tax Invoice Page</h1>
          <p className="mt-2 text-sm text-amber-800">
            This legacy form has been disconnected from PI Details. The new vehicle-wise invoice flow now starts from the Invoice Type modal on the PI details page.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          <ArrowLeft size={16} className="mr-2 inline" />
          Back
        </button>
      </div>

      {/* LEGACY_GENERATE_TAX_INVOICE_START
      <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10">
        <form className="space-y-10">
          [Legacy Generate Tax Invoice JSX preserved here and intentionally disconnected]
        </form>
      </div>
      LEGACY_GENERATE_TAX_INVOICE_END */}
    </div>
  );
};

export default CreateTaxInvoice;
