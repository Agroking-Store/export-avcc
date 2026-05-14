import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { invoiceApi } from "../components/invoiceApi";
import type {
  PIInvoiceContext,
  PIInvoiceVehicle,
} from "../components/invoice.types";

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
    return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Generate Packing List</h1>
      <p className="text-slate-500">
        Select vehicles from PI: {context.piNumber}
      </p>

      <div className="mt-6 rounded-2xl border p-6">
        <div className="mb-4 flex justify-between">
          <h2 className="font-semibold">Vehicles in this PI</h2>
          <span className="text-sm text-slate-500">
            {selectedVehicles.length} selected
          </span>
        </div>

        <div className="space-y-3">
          {context.vehicles.map((vehicle) => (
            <div
              key={vehicle.vehicleId}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedVehicles.includes(vehicle.vehicleId)}
                  onCheckedChange={() => toggleVehicle(vehicle.vehicleId)}
                />
                <div>
                  <p className="font-medium">{vehicle.displayModel}</p>
                  <p className="text-sm text-slate-500">
                    Chassis: {vehicle.chassisNo} | Engine: {vehicle.engineNo}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm">
                {vehicle.totalUSD.toFixed(2)} USD
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={submitting || selectedVehicles.length === 0}
        >
          {submitting ? "Generating..." : "Generate Packing List"}
        </Button>
      </div>
    </div>
  );
}
