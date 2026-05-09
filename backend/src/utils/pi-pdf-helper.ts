// backend/src/utils/pi-pdf-helper.ts
export const formatDate = (dateString: string | Date) => {
  const d = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate().toString().padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

export const formatAddress = (addr: any) => {
  if (!addr) return "-";
  if (typeof addr === "string") return addr;
  const addressParts = [
    addr.houseBuilding,
    addr.streetArea,
    addr.cityTown,
    [addr.state, addr.pincode].filter(Boolean).join(" - "),
    addr.country,
  ].filter(Boolean);
  return addressParts.join("\n");
};

export const preparePIDataForService = (pi: any) => {
  const clientForPdf: any = pi.clientSnapshot || pi.client_id;
  const companyForPdf: any = pi.companySnapshot || pi.company_id;

  const items = pi.vehicleDetails.map((v: any, index: number) => {
    const unitPrice = (Number(v.fob) || 0) + (Number(v.freight) || 0);
    return {
      slNo: index + 1,
      description: v.model || "N/A",
      qty: v.quantity,
      rate: unitPrice.toFixed(2),
      amount: (v.quantity * unitPrice).toFixed(2),
      specs: {
        color: v.color,
        chassisNo: v.chassisNo,
        engineNo: v.engineNo,
        yom: v.yom,
        fuelType: v.fuelType,
        countryOfOrigin: v.countryOfOrigin,
        hsn: v.hsn,
      },
    };
  });

  return {
    invoiceNumber: pi.piNumber,
    date: new Date(pi.createdAt).toLocaleDateString("en-GB"),
    exporter: {
      name: companyForPdf?.name || "N/A",
      address: companyForPdf?.address || "N/A",
      gstin: companyForPdf?.gstNumber || "N/A",
    },
    buyer: {
      name: clientForPdf?.companyName || clientForPdf?.name || " ",
      address: clientForPdf?.address || clientForPdf?.country || "",
    },
    items,
    totalQty: pi.vehicleDetails.reduce(
      (sum: number, v: any) => sum + v.quantity,
      0,
    ),
    totalAmount: pi.totalAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    }),
    currency: pi.currency || "USD",
    amountInWords: pi.amountInWords || "N/A",
    bankDetails: companyForPdf?.bankDetails || {},
  };
};
