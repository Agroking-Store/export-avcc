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
  MapPin,
  Globe,
  Scale,
  MessageSquare,
} from "lucide-react";

import { apiConfig } from "@/config/apiConfig";

/* =====================================================
   REUSABLE FIELD COMPONENT (OUTSIDE = FIXED TYPING BUG)
===================================================== */

type FieldProps = {
  label: string;
  name?: string;
  value?: any;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  disabled?: boolean;
  type?: string;
  icon?: any;
};

const inputStyle =
  "w-full bg-[#F8F9FB] border border-[#E8EDF5] rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none";

const labelStyle =
  "flex items-center gap-2 text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-2";

const Field = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  type = "text",
  icon: Icon,
}: FieldProps) => {
  return (
    <div>
      <label className={labelStyle}>
        {Icon ? (
          <Icon
            size={12}
            className="text-blue-500"
          />
        ) : null}
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className={`${inputStyle} ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : ""
        }`}
      />
    </div>
  );
};

/* =====================================================
   MAIN COMPONENT
===================================================== */

const CreateTaxInvoice = () => {
  const navigate = useNavigate();
  const { id: piId } = useParams();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [savedId, setSavedId] =
    useState("");

  const [vehicles, setVehicles] =
    useState<any[]>([]);

  const [form, setForm] =
    useState({
      taxInvoiceNo: "",
      invoiceDate:
        new Date()
          .toISOString()
          .slice(0, 10),

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

      countryOrigin:
        "INDIA",
      countryDestination:
        "",

      shipmentMode:
        "BY SEA",
      totalCartons: "1",

      termsOfDelivery:
        "",

      stateOfOrigin:
        "Maharashtra",
      districtOfOrigin:
        "Pune",

      drawbackShipment:
        "YES",
      rodtepSchemeCode:
        "",
      endUseCode: "",
      igstPaymentStatus:
        "YES",
      shipmentExportUnderIgst:
        "YES",
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

  /* ==============================
     CHANGE HANDLER
  ============================== */

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

  /* ==============================
     FETCH PI
  ============================== */

  useEffect(() => {
    const fetchPI =
      async () => {
        try {
          const res =
            await axios.get(
              `${apiConfig.baseURL}/proforma-invoices/${piId}`
            );

          const pi =
            res.data;

          setVehicles(
            pi.vehicleDetails ||
              []
          );

          setForm(
            (prev) => ({
              ...prev,

              taxInvoiceNo:
                "TI-" +
                Date.now()
                  .toString()
                  .slice(
                    -6
                  ),

              piNo:
                pi.piNumber ||
                "",

              piDate:
                pi.createdAt?.slice(
                  0,
                  10
                ) || "",

              portOfLoading:
                pi.portOfLoading ||
                "",

              portOfDischarge:
                pi.portOfDischarge ||
                "",

              placeDelivery:
                pi.destination ||
                "",

              countryDestination:
                pi
                  .clientSnapshot
                  ?.address
                  ?.country ||
                pi
                  .clientSnapshot
                  ?.country ||
                "",

              termsOfDelivery:
                pi.termsOfDelivery ||
                "",

              bankName:
                pi
                  .companySnapshot
                  ?.bankDetails
                  ?.bankName ||
                "",

              accountNo:
                pi
                  .companySnapshot
                  ?.bankDetails
                  ?.accountNo ||
                "",

              ifsc:
                pi
                  .companySnapshot
                  ?.bankDetails
                  ?.branchIfsc ||
                "",

              swiftCode:
                pi
                  .companySnapshot
                  ?.bankDetails
                  ?.swiftCode ||
                "",

              totalCartons:
                String(
                  pi
                    .vehicleDetails
                    ?.length ||
                    1
                ),
            })
          );
        } catch {
          toast.error(
            "Failed to load PI details"
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchPI();
  }, [piId]);

  /* ==============================
     TOTALS
  ============================== */

  const subtotal =
    useMemo(() => {
      return vehicles.reduce(
        (
          sum,
          v
        ) =>
          sum +
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
              )),
        0
      );
    }, [vehicles]);

  const gstAmount =
    useMemo(() => {
      return (
        subtotal *
        (Number(
          form.gstPercent
        ) /
          100)
      );
    }, [
      subtotal,
      form.gstPercent,
    ]);

  const grandTotal =
    useMemo(() => {
      return (
        subtotal +
        gstAmount
      );
    }, [
      subtotal,
      gstAmount,
    ]);

  /* ==============================
     SAVE
  ============================== */

  const handleSave =
    async () => {
      try {
        setSaving(
          true
        );

        const res =
          await axios.post(
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
      } catch {
        toast.error(
          "Failed to save Tax Invoice"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handlePreview =
    () => {
      if (!savedId)
        return;

      window.open(
        `${apiConfig.baseURL}/tax-invoices/${savedId}/pdf`,
        "_blank"
      );
    };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mt-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-5 py-2 rounded-xl">
            <span className="text-white font-black text-sm tracking-[0.2em]">
              NEW TAX INVOICE
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Generate Export Invoice
            </h1>

            <p className="text-xs text-slate-400 uppercase">
              From PI: {form.piNo}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            navigate(-1)
          }
          className="px-4 py-2 rounded-xl border bg-white"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">

        {/* LEFT */}
        <div className="col-span-9 space-y-8">

          {/* BASIC */}
          <div className="bg-white rounded-3xl border p-8">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="text-blue-500" />
              <h2 className="font-bold text-lg">
                Basic Details
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <Field label="Tax Invoice No" name="taxInvoiceNo" value={form.taxInvoiceNo} onChange={handleChange} icon={Hash} />
              <Field label="Invoice Date" name="invoiceDate" value={form.invoiceDate} onChange={handleChange} type="date" icon={Calendar} />
              <Field label="PI Number" value={form.piNo} disabled icon={FileText} />
              <Field label="PI Date" value={form.piDate} disabled icon={Calendar} />
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <Field label="Buyer Order & Date" name="buyerOrderDate" value={form.buyerOrderDate} onChange={handleChange} icon={Truck} />
              <Field label="Other Reference" name="otherReference" value={form.otherReference} onChange={handleChange} icon={Hash} />
            </div>
          </div>

          {/* SHIPPING */}
          <div className="bg-white rounded-3xl border p-8">
            <div className="flex items-center gap-3 mb-6">
              <Ship className="text-cyan-500" />
              <h2 className="font-bold text-lg">
                Shipping Details
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-6">
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

            <div className="mt-6">
              <Field label="Terms Of Delivery" name="termsOfDelivery" value={form.termsOfDelivery} onChange={handleChange} />
            </div>
          </div>

          {/* EXPORT BENEFITS */}
          <div className="bg-white rounded-3xl border p-8">
            <div className="flex items-center gap-3 mb-6">
              <BadgeDollarSign className="text-emerald-500" />
              <h2 className="font-bold text-lg">
                Export Benefits
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <Field label="Drawback Shipment" name="drawbackShipment" value={form.drawbackShipment} onChange={handleChange} />
              <Field label="RODTEP Scheme Code" name="rodtepSchemeCode" value={form.rodtepSchemeCode} onChange={handleChange} />
              <Field label="End Use Code" name="endUseCode" value={form.endUseCode} onChange={handleChange} />

              <Field label="IGST Payment Status" name="igstPaymentStatus" value={form.igstPaymentStatus} onChange={handleChange} />
              <Field label="Shipment Under IGST" name="shipmentExportUnderIgst" value={form.shipmentExportUnderIgst} onChange={handleChange} />
              <Field label="AD Code" name="adCode" value={form.adCode} onChange={handleChange} />
            </div>
          </div>

          {/* VEHICLES */}
          <div className="bg-white rounded-3xl border p-8">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="text-indigo-500" />
              <h2 className="font-bold text-lg">
                Vehicle Summary
              </h2>
            </div>

            <div className="space-y-4">
              {vehicles.map(
                (
                  v,
                  i
                ) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-4 p-4 border rounded-2xl bg-slate-50 text-sm"
                  >
                    <div>
                      <b>
                        Model:
                      </b>{" "}
                      {v.model}
                    </div>

                    <div>
                      <b>
                        Qty:
                      </b>{" "}
                      {
                        v.quantity
                      }
                    </div>

                    <div>
                      <b>
                        Rate:
                      </b>{" "}
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
                      <b>
                        Amount:
                      </b>{" "}
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
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-6">

          {/* BANK */}
          <div className="bg-white rounded-3xl border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Landmark className="text-blue-500" />
              <h2 className="font-bold">
                Bank Details
              </h2>
            </div>

            <div className="space-y-4">
              <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
              <Field label="Account Number" name="accountNo" value={form.accountNo} onChange={handleChange} />
              <Field label="IFSC" name="ifsc" value={form.ifsc} onChange={handleChange} />
              <Field label="SWIFT" name="swiftCode" value={form.swiftCode} onChange={handleChange} />
            </div>
          </div>

          {/* WEIGHT */}
          <div className="bg-white rounded-3xl border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Scale className="text-purple-500" />
              <h2 className="font-bold">
                Weight
              </h2>
            </div>

            <div className="space-y-4">
              <Field label="Net Weight" name="netWeight" value={form.netWeight} onChange={handleChange} />
              <Field label="Gross Weight" name="grossWeight" value={form.grossWeight} onChange={handleChange} />
            </div>
          </div>

          {/* TOTALS */}
          <div className="bg-white rounded-3xl border p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="text-green-500" />
              <h2 className="font-bold">
                Totals
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>
                  Subtotal
                </span>
                <span className="font-bold">
                  $
                  {subtotal.toFixed(
                    2
                  )}
                </span>
              </div>

              <Field label="GST %" name="gstPercent" value={form.gstPercent} onChange={handleChange} />

              <div className="flex justify-between">
                <span>
                  Tax Amount
                </span>
                <span className="font-bold">
                  $
                  {gstAmount.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="bg-blue-600 rounded-2xl p-5 text-white">
                <p className="text-xs uppercase opacity-70">
                  Grand Total
                </p>

                <h3 className="text-3xl font-black">
                  $
                  {grandTotal.toFixed(
                    2
                  )}
                </h3>
              </div>
            </div>
          </div>

          {/* REMARKS */}
          <div className="bg-white rounded-3xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-orange-500" />
              <h2 className="font-bold">
                Remarks
              </h2>
            </div>

            <Field label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />
          </div>

          {/* ACTION */}
          <div className="bg-slate-900 rounded-3xl p-6 space-y-3">
            <button
              onClick={
                handleSave
              }
              disabled={
                saving
              }
              className="w-full py-4 rounded-2xl bg-white font-bold"
            >
              <Save
                size={16}
                className="inline mr-2"
              />
              {saving
                ? "Saving..."
                : "Save Invoice"}
            </button>

            <button
              onClick={
                handlePreview
              }
              disabled={
                !savedId
              }
              className="w-full py-4 rounded-2xl bg-slate-800 text-white disabled:opacity-30"
            >
              <Eye
                size={16}
                className="inline mr-2"
              />
              Preview PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaxInvoice;