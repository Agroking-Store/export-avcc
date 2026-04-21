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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiConfig } from "@/config/apiConfig";

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

    portOfLoading: "",
    portOfDischarge: "",
    placeDelivery: "",

    countryOrigin: "INDIA",
    countryDestination: "",

    shipmentMode: "BY SEA",
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

  const inputStyle =
    "w-full bg-[#F8F9FB] border border-[#E8EDF5] rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  const labelStyle =
    "block text-[11px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2";

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

          taxInvoiceNo:
            "TI-" +
            Date.now()
              .toString()
              .slice(-6),

          piNo: pi.piNumber || "",

          piDate:
            pi.createdAt?.slice(0, 10) || "",

          portOfLoading:
            pi.portOfLoading || "",

          portOfDischarge:
            pi.portOfDischarge || "",

          placeDelivery:
            pi.destination || "",

          countryDestination:
            pi.clientSnapshot?.address
              ?.country ||
            pi.clientSnapshot
              ?.country ||
            "",

          termsOfDelivery:
            pi.termsOfDelivery || "",

          bankName:
            pi.companySnapshot
              ?.bankDetails
              ?.bankName || "",

          accountNo:
            pi.companySnapshot
              ?.bankDetails
              ?.accountNo || "",

          ifsc:
            pi.companySnapshot
              ?.bankDetails
              ?.branchIfsc || "",

          swiftCode:
            pi.companySnapshot
              ?.bankDetails
              ?.swiftCode || "",

          totalCartons: String(
            pi.vehicleDetails
              ?.length || 1
          ),
        }));
      } catch (error) {
        toast.error(
          "Failed to load PI details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPI();
  }, [piId]);

  const subtotal = useMemo(() => {
    return vehicles.reduce(
      (sum, v) =>
        sum +
        Number(v.quantity || 0) *
          (Number(v.fob || 0) +
            Number(
              v.freight || 0
            )),
      0
    );
  }, [vehicles]);

  const gstAmount = useMemo(() => {
    return (
      subtotal *
      (Number(
        form.gstPercent
      ) /
        100)
    );
  }, [subtotal, form.gstPercent]);

  const grandTotal = useMemo(() => {
    return subtotal + gstAmount;
  }, [subtotal, gstAmount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

      setSavedId(
        res.data.data._id
      );

      toast.success(
        "Tax Invoice Saved"
      );
    } catch (error) {
      toast.error(
        "Failed to save Tax Invoice"
      );
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
      <div className="p-8">
        Loading...
      </div>
    );
  }

  const Field = ({
    label,
    name,
    value,
    disabled = false,
    type = "text",
  }: any) => (
    <div>
      <label className={labelStyle}>
        {label}
      </label>

      <Input
        name={name}
        value={value}
        type={type}
        disabled={disabled}
        onChange={
          handleChange
        }
        className={inputStyle}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Create Tax Invoice
              </h1>
              <p className="text-sm text-slate-500">
                Export Invoice Generator
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* BASIC */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5">
            Basic Details
          </h2>

          <div className="grid grid-cols-4 gap-5">
            <Field
              label="Tax Invoice No"
              name="taxInvoiceNo"
              value={
                form.taxInvoiceNo
              }
            />

            <Field
              label="Invoice Date"
              name="invoiceDate"
              type="date"
              value={
                form.invoiceDate
              }
            />

            <Field
              label="PI Number"
              value={form.piNo}
              disabled
            />

            <Field
              label="PI Date"
              value={form.piDate}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-5 mt-5">
            <Field
              label="Buyer Order & Date"
              name="buyerOrderDate"
              value={
                form.buyerOrderDate
              }
            />

            <Field
              label="Other Reference"
              name="otherReference"
              value={
                form.otherReference
              }
            />
          </div>
        </div>

        {/* SHIPPING */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Shipping Details
          </h2>

          <div className="grid grid-cols-4 gap-5">
            <Field label="Pre Carriage" name="preCarriage" value={form.preCarriage} />
            <Field label="Place Receipt" name="placeReceipt" value={form.placeReceipt} />
            <Field label="Vessel / Flight" name="vesselFlight" value={form.vesselFlight} />
            <Field label="Shipment Mode" name="shipmentMode" value={form.shipmentMode} />

            <Field label="Port Of Loading" name="portOfLoading" value={form.portOfLoading} />
            <Field label="Port Of Discharge" name="portOfDischarge" value={form.portOfDischarge} />
            <Field label="Place Delivery" name="placeDelivery" value={form.placeDelivery} />
            <Field label="Destination Country" name="countryDestination" value={form.countryDestination} />

            <Field label="Country Origin" name="countryOrigin" value={form.countryOrigin} />
            <Field label="Total Cartons" name="totalCartons" value={form.totalCartons} />
            <Field label="State Of Origin" name="stateOfOrigin" value={form.stateOfOrigin} />
            <Field label="District Of Origin" name="districtOfOrigin" value={form.districtOfOrigin} />
          </div>

          <div className="mt-5">
            <Field
              label="Terms Of Delivery"
              name="termsOfDelivery"
              value={
                form.termsOfDelivery
              }
            />
          </div>
        </div>

        {/* BENEFITS */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5" />
            Export Benefits
          </h2>

          <div className="grid grid-cols-3 gap-5">
            <Field label="Drawback Shipment" name="drawbackShipment" value={form.drawbackShipment} />
            <Field label="RODTEP Scheme Code" name="rodtepSchemeCode" value={form.rodtepSchemeCode} />
            <Field label="End Use Code" name="endUseCode" value={form.endUseCode} />

            <Field label="IGST Payment Status" name="igstPaymentStatus" value={form.igstPaymentStatus} />
            <Field label="Shipment Under IGST" name="shipmentExportUnderIgst" value={form.shipmentExportUnderIgst} />
            <Field label="AD Code" name="adCode" value={form.adCode} />
          </div>
        </div>

        {/* BANK */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            Bank / Weight Details
          </h2>

          <div className="grid grid-cols-4 gap-5">
            <Field label="Bank Name" name="bankName" value={form.bankName} />
            <Field label="Account Number" name="accountNo" value={form.accountNo} />
            <Field label="IFSC Code" name="ifsc" value={form.ifsc} />
            <Field label="SWIFT Code" name="swiftCode" value={form.swiftCode} />

            <Field label="Net Weight" name="netWeight" value={form.netWeight} />
            <Field label="Gross Weight" name="grossWeight" value={form.grossWeight} />
          </div>
        </div>

        {/* VEHICLES */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Vehicle Summary
          </h2>

          <div className="space-y-3">
            {vehicles.map(
              (v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 gap-4 border rounded-xl p-4 text-sm bg-slate-50"
                >
                  <div>
                    <b>Model:</b>{" "}
                    {v.model}
                  </div>

                  <div>
                    <b>Qty:</b>{" "}
                    {v.quantity}
                  </div>

                  <div>
                    <b>Rate:</b>{" "}
                    {(
                      Number(
                        v.fob ||
                          0
                      ) +
                      Number(
                        v.freight ||
                          0
                      )
                    ).toFixed(
                      2
                    )}
                  </div>

                  <div>
                    <b>Amount:</b>{" "}
                    {(
                      Number(
                        v.quantity ||
                          0
                      ) *
                      (Number(
                        v.fob ||
                          0
                      ) +
                        Number(
                          v.freight ||
                            0
                        ))
                    ).toFixed(
                      2
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* TOTALS */}
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-5">
            Amount Summary
          </h2>

          <div className="grid grid-cols-4 gap-5">
            <Field label="Subtotal" value={subtotal.toFixed(2)} disabled />
            <Field label="GST %" name="gstPercent" value={form.gstPercent} />
            <Field label="GST Amount" value={gstAmount.toFixed(2)} disabled />
            <Field label="Grand Total" value={grandTotal.toFixed(2)} disabled />
          </div>

          <div className="mt-5">
            <Field
              label="Remarks"
              name="remarks"
              value={
                form.remarks
              }
            />
          </div>
        </div>

        {/* ACTION */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={!savedId}
            onClick={
              handlePreview
            }
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving
              ? "Saving..."
              : "Save Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaxInvoice;