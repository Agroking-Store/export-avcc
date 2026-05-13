import {
  FileText,
  Package2,
  PencilLine,
  Eye,
  Download,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { invoiceApi } from "./invoiceApi";
import type { InvoiceType, PIInvoiceContext } from "./invoice.types";

const CARD_CONFIG: Array<{
  key: InvoiceType | "PACKING_LIST";
  title: string;
  description: string;
  accent: string;
  iconBg: string;
  iconColor: string;
}> = [
  {
    key: "INR",
    title: "INR Invoice",
    description: "GST export tax invoice in Indian Rupees",
    accent: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
  },
  {
    key: "USD",
    title: "USD Invoice",
    description: "Export invoice in US Dollars",
    accent: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
  },
  {
    key: "COMMERCIAL",
    title: "Commercial Invoice",
    description: "Bank and LC commercial document with declarations",
    accent: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
  },
  {
    key: "PACKING_LIST",
    title: "Packing List",
    description: "Auto-generated together with the USD invoice",
    accent: "from-violet-500 to-fuchsia-500",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
  },
];

const getTypeCount = (
  context: PIInvoiceContext,
  type: InvoiceType | "PACKING_LIST",
) => {
  if (type === "PACKING_LIST") {
    return context.existingInvoices.filter((i) => !!i.hasPackingList).length;
  }
  return context.existingInvoices.filter((i) => i.type === type).length;
};

const getLatestInvoice = (
  context: PIInvoiceContext,
  type: InvoiceType | "PACKING_LIST",
) => {
  const ordered = [...context.existingInvoices].sort(
    (a, b) =>
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
  if (type === "PACKING_LIST") return ordered.find((i) => !!i.hasPackingList);
  return ordered.find((i) => i.type === type);
};

const getChipLabel = (type: InvoiceType | "PACKING_LIST", count: number) => {
  if (type === "PACKING_LIST")
    return count > 0 ? `${count} available` : "Auto with USD";
  return count > 0 ? `${count} generated` : "Not generated";
};

export default function InvoiceTypeModal({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: PIInvoiceContext | null;
}) {
  const navigate = useNavigate();

  if (!context) return null;

  const vehiclesMissingData = context.vehicles.filter(
    (v) => !v.engineNo || !v.chassisNo,
  );

  const isDataIncomplete = vehiclesMissingData.length > 0;

  // const handleGenerate = (type: InvoiceType) => {
  //   onOpenChange(false);
  //   navigate(`/invoices/generate/${context._id}/${type}`);
  // };

  const handleGenerate = (type: InvoiceType) => {
    if (isDataIncomplete) {
      toast.error(
        `Cannot generate ${type} Invoice. ${vehiclesMissingData.length} vehicle(s) are missing Engine or Chassis numbers.`,
      );
      return;
    }
    onOpenChange(false);
    navigate(`/invoices/generate/${context._id}/${type}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        style={{ width: "min(1200px, calc(100vw - 48px))", maxWidth: "none" }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
      >
        {/* ── Header ── */}
        <DialogHeader className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-blue-700">
                <Sparkles className="h-2.5 w-2.5" />
                Invoice Generator
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                Generate Tax Invoice
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-slate-500">
                Pick a document type — INR, USD &amp; Commercial can each be
                generated separately per PI.
              </DialogDescription>
            </div>

            <div className="flex shrink-0 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  PI Number
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {context.piNumber}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Buyer
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {context.buyerName || "—"}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isDataIncomplete && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-medium">
              Important: Some vehicles in this PI do not have Engine or Chassis
              numbers. You must update the PI with these details before
              generating Tax Invoices.
            </p>
          </div>
        )}

        {/* ── Cards — forced 4 columns ── */}
        <div
          className="p-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          {CARD_CONFIG.map((card) => {
            const count = getTypeCount(context, card.key);
            const latest = getLatestInvoice(context, card.key);
            const isPacking = card.key === "PACKING_LIST";

            return (
              <div
                key={card.key}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${card.accent}`} />

                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* Icon + status chip */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                    >
                      {isPacking ? (
                        <Package2 className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        count > 0
                          ? "bg-slate-100 text-slate-600"
                          : isPacking
                            ? "bg-violet-50 text-violet-600"
                            : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {getChipLabel(card.key, count)}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 className="text-[15px] font-bold leading-snug text-slate-900">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {card.description}
                    </p>
                  </div>

                  {/* Status box */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Current Status
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-slate-800">
                      {latest
                        ? `Latest: ${latest.invoiceNumber}`
                        : isPacking
                          ? "Appears after USD invoice generation."
                          : "No invoice generated yet."}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto flex flex-col gap-2">
                    {!isPacking && (
                      // <Button
                      //   size="sm"
                      //   className="h-9 w-full justify-between rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                      //   onClick={() => handleGenerate(card.key as InvoiceType)}
                      // >
                      //   <span>
                      //     {latest ? "Generate / Edit" : "Start Generation"}
                      //   </span>
                      //   <ArrowRight className="h-3.5 w-3.5" />
                      // </Button>
                      <Button
                        size="sm"
                        // 3. Visual feedback: Change button style if incomplete
                        className={`h-9 w-full justify-between rounded-lg px-3 text-xs font-semibold text-white transition-all 
                        ${
                          isDataIncomplete
                            ? "bg-slate-300 cursor-not-allowed grayscale"
                            : "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                        }`}
                        onClick={() => handleGenerate(card.key as InvoiceType)}
                      >
                        <span>Start Generation</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <div className="flex gap-1.5">
                      {latest && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg px-2 text-xs"
                          onClick={() =>
                            window.open(
                              isPacking
                                ? invoiceApi.getPackingListViewUrl(latest._id)
                                : invoiceApi.getInvoiceViewUrl(latest._id),
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      )}

                      {latest && isPacking && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg px-2 text-xs"
                          onClick={() =>
                            invoiceApi.downloadFile(
                              invoiceApi.getPackingListViewUrl(latest._id),
                              `${latest.invoiceNumber}-packing.pdf`,
                            )
                          }
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Download
                        </Button>
                      )}

                      {latest && !isPacking && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 rounded-lg px-2 text-xs"
                          onClick={() =>
                            handleGenerate(card.key as InvoiceType)
                          }
                        >
                          <PencilLine className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3">
          <p className="text-xs text-slate-400">
            Packing List is view/download only — stays linked to the USD
            invoice.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
