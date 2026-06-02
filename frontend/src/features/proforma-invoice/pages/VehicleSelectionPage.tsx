import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import InvoiceStepBar from "../components/InvoiceStepBar";
import { invoiceApi } from "../components/invoiceApi";
import type { InvoiceType, PIInvoiceContext } from "../components/invoice.types";

const prettyType = (type: InvoiceType) =>
  type === "COMMERCIAL" ? "Commercial" : type;

export default function VehicleSelectionPage() {
  const navigate = useNavigate();
  const { piId = "", type = "" } = useParams();
  const invoiceType = type as InvoiceType;

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<PIInvoiceContext | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getPIContext(piId);
        setContext(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load PI vehicles");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [piId]);

  const selectedVehicle = useMemo(
    () => context?.vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId),
    [context, selectedVehicleId],
  );

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Unable to load the vehicle selection page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Invoice Generation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Select Vehicle for {prettyType(invoiceType)} Invoice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            PI {context.piNumber} • {context.buyerName}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <InvoiceStepBar activeStep={2} type={invoiceType} />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Vehicles in this PI</h2>
          <p className="mt-1 text-sm text-slate-500">
            One vehicle can generate one invoice of each type. Existing generated badges are
            shown so you know what is already available.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Select</th>
                <th className="px-6 py-4">VIN</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Variant</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Existing</th>
              </tr>
            </thead>
            <tbody>
              {context.vehicles.map((vehicle) => (
                <tr
                  key={vehicle.vehicleId}
                  className={`border-t border-slate-200 ${
                    selectedVehicleId === vehicle.vehicleId ? "bg-blue-50/70" : "bg-white"
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="radio"
                      name="invoiceVehicle"
                      checked={selectedVehicleId === vehicle.vehicleId}
                      onChange={() => setSelectedVehicleId(vehicle.vehicleId)}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">
                    {vehicle.chassisNo || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{vehicle.model || "—"}</div>
                    <div className="mt-1 text-xs text-slate-500">{vehicle.make || "—"}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{vehicle.variant || "—"}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    USD {vehicle.totalUSD.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(["INR", "USD", "COMMERCIAL"] as InvoiceType[]).map((badgeType) => (
                        <span
                          key={badgeType}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                            vehicle.invoices[badgeType]
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {vehicle.invoices[badgeType] && <CheckCircle2 className="h-3 w-3" />}
                          {badgeType === "COMMERCIAL" ? "COM" : badgeType}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-5">
          <div className="text-sm text-slate-500">
            {selectedVehicle
              ? `Selected: ${selectedVehicle.displayModel || selectedVehicle.model}`
              : "Choose one vehicle to continue"}
          </div>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={!selectedVehicleId}
            onClick={() => {
              if (!selectedVehicle) return;
              const engineNoMissing = !selectedVehicle.engineNo || !selectedVehicle.engineNo.trim();
              if (engineNoMissing) {
                toast.error("Engine No not got. Please update engine number for this vehicle.");
                return;
              }
              navigate(`/invoices/generate/${piId}/${invoiceType}/${selectedVehicleId}`);
            }}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>

        </div>
      </div>
    </div>
  );
}
