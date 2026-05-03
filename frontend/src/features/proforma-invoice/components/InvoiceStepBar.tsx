import type { InvoiceType } from "./invoice.types";

const STEPS = [
  "Invoice Type",
  "Select Vehicle",
  "Fill Details",
  "Generate",
];

const prettyType = (type: InvoiceType) => {
  if (type === "INR") return "INR Invoice";
  if (type === "USD") return "USD Invoice";
  return "Commercial Invoice";
};

export default function InvoiceStepBar({
  activeStep,
  type,
}: {
  activeStep: number;
  type: InvoiceType;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Tax Invoice Flow
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {prettyType(type)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === activeStep;
            const isDone = stepNumber < activeStep;

            return (
              <div key={step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="hidden h-px w-10 bg-slate-200 md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
