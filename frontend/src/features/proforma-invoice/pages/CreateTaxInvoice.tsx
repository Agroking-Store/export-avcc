import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Save, Eye, ArrowLeft } from "lucide-react";
import { apiConfig } from "@/config/apiConfig";

/* =====================================================
   FIELD
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
        className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none
        ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-500"
            : "bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        }`}
      />
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

    lcNo: "",
    lcDate: "",

    buyerOrderDate: "",
    otherReference: "",

    paymentTerms: "",
    dispatchedThrough: "",
    destination: "",

    portOfLoading: "",
    portOfDischarge: "",
    countryDestination: "",

    exportInspectionNo: "",
    exportInspectionDate: "",

    bankName: "",
    accountNo: "",
    ifsc: "",
    swiftCode: "",

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

          taxInvoiceNo: "CI-" + Date.now().toString().slice(-6),

          piNo: pi.piNumber || "",
          piDate: pi.createdAt?.slice(0, 10) || "",

          paymentTerms: pi.termsOfDelivery || "",
          destination: pi.destination || "",

          portOfLoading: pi.portOfLoading || "",
          portOfDischarge: pi.portOfDischarge || "",

          countryDestination:
            pi.clientSnapshot?.address?.country ||
            pi.clientSnapshot?.country ||
            "",

          bankName:
            pi.companySnapshot?.bankDetails?.bankName || "",

          accountNo:
            pi.companySnapshot?.bankDetails?.accountNo || "",

          ifsc:
            pi.companySnapshot?.bankDetails?.branchIfsc || "",

          swiftCode:
            pi.companySnapshot?.bankDetails?.swiftCode || "",
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
     TOTAL
  ===================================================== */

  const grandTotal = useMemo(() => {
    return vehicles.reduce(
      (sum, v) =>
        sum +
        Number(v.quantity || 0) *
          (Number(v.fob || 0) + Number(v.freight || 0)),
      0
    );
  }, [vehicles]);

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
          subtotal: grandTotal,
          gstAmount: 0,
          grandTotal,
        }
      );

      setSavedId(res.data.data._id);

      toast.success("Commercial Invoice Saved");
    } catch {
      toast.error("Failed to save invoice");
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
    <div className="w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 px-6 py-8 md:px-10 md:py-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Generate Commercial Invoice
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Create invoice from PI {form.piNo}
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <form className="space-y-10">

        {/* BASIC */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Basic Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Invoice No" name="taxInvoiceNo" value={form.taxInvoiceNo} onChange={handleChange} />
            <Field label="Invoice Date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} type="date" />
            <Field label="PI No" value={form.piNo} disabled />
            <Field label="PI Date" value={form.piDate} disabled />
            <Field label="LC No" name="lcNo" value={form.lcNo} onChange={handleChange} />
            <Field label="LC Date" name="lcDate" value={form.lcDate} onChange={handleChange} type="date" />
          </div>
        </div>

        {/* SHIPPING */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Shipment Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Payment Terms" name="paymentTerms" value={form.paymentTerms} onChange={handleChange} />
            <Field label="Dispatched Through" name="dispatchedThrough" value={form.dispatchedThrough} onChange={handleChange} />
            <Field label="Destination" name="destination" value={form.destination} onChange={handleChange} />

            <Field label="Port Of Loading" name="portOfLoading" value={form.portOfLoading} onChange={handleChange} />
            <Field label="Port Of Discharge" name="portOfDischarge" value={form.portOfDischarge} onChange={handleChange} />
            <Field label="Country Destination" name="countryDestination" value={form.countryDestination} onChange={handleChange} />
          </div>
        </div>

        {/* CERTIFICATE */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Certification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Export Inspection No" name="exportInspectionNo" value={form.exportInspectionNo} onChange={handleChange} />
            <Field label="Inspection Date" name="exportInspectionDate" value={form.exportInspectionDate} onChange={handleChange} type="date" />
          </div>
        </div>

        {/* BANK */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Bank Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <Field label="Account No" name="accountNo" value={form.accountNo} onChange={handleChange} />
            <Field label="IFSC" name="ifsc" value={form.ifsc} onChange={handleChange} />
            <Field label="SWIFT" name="swiftCode" value={form.swiftCode} onChange={handleChange} />
          </div>
        </div>

        {/* TOTAL */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Total Amount
          </h2>

          <div className="rounded-2xl bg-indigo-600 text-white p-6 w-fit min-w-[240px]">
            <p className="text-xs uppercase opacity-70">Grand Total</p>
            <p className="text-3xl font-black">
              ${grandTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* REMARKS */}
        <div>
          <h2 className="text-base font-bold mb-5 text-gray-700">
            Remarks
          </h2>

          <Field
            label="Remarks"
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
          />
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">

          <button
            type="button"
            onClick={handlePreview}
            disabled={!savedId}
            className="px-8 py-3 rounded-xl border border-gray-200 font-semibold disabled:opacity-40"
          >
            <Eye size={16} className="inline mr-2" />
            Preview
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            <Save size={16} className="inline mr-2" />
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTaxInvoice;