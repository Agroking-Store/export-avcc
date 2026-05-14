import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { invoiceApi } from "../components/invoiceApi";
import type { PIInvoiceContext } from "../components/invoice.types";

export default function GeneratePackingList() {
  const { piId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState<PIInvoiceContext | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invoiceApi.getPIContext(piId!);
        setContext(data);
        setForm((prev) => ({
          ...prev,
          invoiceNumber: data.suggestedInvoiceNumber,
        }));
      } catch {
        toast.error("Failed to load PI data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [piId]);

  const toggleVehicle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId],
    );
  };

  const handleGenerate = async () => {
    if (selectedVehicles.length === 0) {
      toast.error("Please select at least one vehicle");
      return;
    }

    try {
      setSubmitting(true);
      const res = await invoiceApi.generatePackingList({
        piId: piId!,
        vehicleIds: selectedVehicles,
        manualFields: form,
      });

      toast.success("Packing List generated successfully");
      window.open(res.packingListUrl, "_blank");
      navigate(`/proforma-invoice/${piId}`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to generate Packing List",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !context)
    return <div className="flex h-[70vh] items-center justify-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Packing List Generation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Generate Packing List
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select vehicles from PI: {context.piNumber}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="h-10 px-4 rounded-2xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Vehicles in this PI
          </h2>
          <span className="text-sm text-slate-500">
            {selectedVehicles.length} selected
          </span>
        </div>

        <div className="space-y-3">
          {context.vehicles.map((vehicle) => {
            const checked = selectedVehicles.includes(vehicle.vehicleId);

            return (
              <div
                key={vehicle.vehicleId}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleVehicle(vehicle.vehicleId)}
                  />

                  <div>
                    <p className="font-medium text-slate-900">
                      {vehicle.displayModel}
                    </p>
                    <p className="text-sm text-slate-500">
                      Chassis: {vehicle.chassisNo} | Engine: {vehicle.engineNo}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm text-slate-600">
                  {vehicle.totalUSD.toFixed(2)} USD
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="rounded-2xl"
        >
          Cancel
        </Button>

        <Button
          onClick={handleGenerate}
          disabled={submitting || selectedVehicles.length === 0}
          className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl"
        >
          {submitting ? "Generating..." : "Generate Packing List"}
        </Button>
      </div>
    </div>
  );
}
