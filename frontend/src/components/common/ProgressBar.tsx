import React from "react";
import { Progress } from "@/components/ui/progress";

// Moved ProgressBar component here from PIList.tsx and OrderDetail.tsx
interface ProgressBarProps {
  value: number; // Percentage value
  statusText: string;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  statusText,
  colorClass,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Progress value={clampedValue} className={`h-2 w-full ${colorClass}`} />
      <span
        className={`mt-1 text-xs font-medium ${colorClass.replace(
          "bg",
          "text"
        )}`}
      >
        {statusText}
      </span>
    </div>
  );
};

export default ProgressBar;
