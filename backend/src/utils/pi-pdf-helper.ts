export const formatDate = (dateString: string | Date) => {
  if (!dateString) return "-";
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
    addr.state
      ? `${addr.state}${addr.pincode ? ` - ${addr.pincode}` : ""}`
      : addr.pincode,
    addr.country,
  ].filter(Boolean);

  return addressParts.join("\n"); // Joins with new lines, no braces!
};

export const preparePIDataForService = (pi: any) => {
  const clientForPdf: any = pi.clientSnapshot || pi.client_id;
  const companyForPdf: any = pi.companySnapshot || pi.company_id;

  const items = pi.vehicleDetails.map((v: any, index: number) => {
    const unitPrice = (Number(v.fob) || 0) + (Number(v.freight) || 0);
    return {
      slNo: index + 1,
      description: v.model || "N/A",
      hsn: v.hsn || "",
      qty: v.quantity,
      rate: unitPrice.toFixed(2),
      per: "No",
      amount: (v.quantity * unitPrice).toFixed(2),
      specs: {
        color: v.color,
        chassisNo: v.chassisNo,
        engineNo: v.engineNo,
        yom: v.yom,
        fuelType: v.fuelType,
        countryOfOrigin: v.countryOfOrigin,
        engineCapacity: v.engineCapacity ? `${v.engineCapacity}cc` : "",
        hsn: v.hsn,
        fob: (Number(v.fob) || 0).toFixed(2),
        freight: (Number(v.freight) || 0).toFixed(2),
      },
    };
  });

  return {
    invoiceNumber: pi.piNumber,
    date: pi.validityDate
      ? formatDate(pi.validityDate)
      : formatDate(pi.createdAt),
    voucherNo: pi.piNumber,

    // NEW: Populating separate fields for State Name and Code
    exporter: {
      name: companyForPdf?.name || "N/A",
      address: formatAddress(companyForPdf?.address),
      gstin: companyForPdf?.gstNumber || "N/A",
      state: companyForPdf?.address?.state || "",
      stateCode: companyForPdf?.address?.pincode || "",
    },
    buyer: {
      name: clientForPdf?.companyName || clientForPdf?.name || " ",
      address: formatAddress(clientForPdf?.address),
      state: clientForPdf?.address?.state || "",
      clientCode: clientForPdf?.clientCode || "",
    },
    consignee: {
      name:
        pi.consigneeSnapshot?.name ||
        clientForPdf?.companyName ||
        clientForPdf?.name ||
        " ",
      address: formatAddress(
        pi.consigneeSnapshot?.address || clientForPdf?.address,
      ),
      state:
        pi.consigneeSnapshot?.address?.state ||
        clientForPdf?.address?.state ||
        "-",
    },

    // Delivery fields
    paymentTerms: pi.paymentTerms || "Advance",
    termsOfDelivery: pi.termsOfDelivery || "",
    incoterm: pi.incoterm || "",
    portOfLoading: pi.portOfLoading || "",
    portOfDischarge: pi.portOfDischarge || "",
    dispatchedThrough: pi.dispatchedThrough || "",
    destination: pi.destination || "",
    buyersRef: pi.buyersRef || "",
    otherRef: pi.otherRef || "",

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
    bankDetails: {
      bankName: companyForPdf?.bankDetails?.bankName || "",
      accountNo: companyForPdf?.bankDetails?.accountNo || "",
      branchIfsc: companyForPdf?.bankDetails?.branchIfsc || "",
    },
  };
};
