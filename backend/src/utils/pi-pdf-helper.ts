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

const firstFilled = (...values: Array<unknown>): string => {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }

    return String(value);
  }

  return "";
};

const vehicleLabel = ({
  line,
  vehicleRef,
  orderVehicle,
}: {
  line: any;
  vehicleRef: any;
  orderVehicle: any;
}) => {
  const make = firstFilled(vehicleRef?.brandName, orderVehicle?.brandName);
  const model = firstFilled(
    vehicleRef?.modelName,
    orderVehicle?.modelName,
    line.model,
  );

  return [make, model].filter(Boolean).join(" ").trim() || "N/A";
};

const formatEngineCapacity = (...values: Array<unknown>) => {
  const value = firstFilled(...values);

  if (!value) {
    return "";
  }

  return /cc$/i.test(value) ? value : `${value}cc`;
};

export const preparePIDataForService = (pi: any) => {
  const clientForPdf: any = pi.clientSnapshot || pi.client_id;
  const companyForPdf: any = pi.companySnapshot || pi.company_id;

  const items = pi.vehicleDetails.map((v: any, index: number) => {
    const booking = pi.vehicleBookingIds?.[index] || {};
    const vehicleRef = booking?.vehicleId || v.vehicle_id || {};
    const orderVehicle = booking?.orderId?.vehicleSnapshot || {};
    const unitPrice = (Number(v.fob) || 0) + (Number(v.freight) || 0);
    const commercialHsn = firstFilled(
      v.commercialHsn,
      v.hsn,
      booking?.commercialHsnCode,
      booking?.hsnCode,
      vehicleRef?.commercialHsnCode,
      vehicleRef?.hsnCode,
      orderVehicle?.commercialHsnCode,
      orderVehicle?.hsnCode,
    );
    const countryOfOrigin = firstFilled(
      v.countryOfOrigin,
      booking?.countryOfOrigin,
      orderVehicle?.countryOfOrigin,
      "INDIA",
    );

    return {
      slNo: index + 1,
      description: vehicleLabel({ line: v, vehicleRef, orderVehicle }),
      hsn: commercialHsn,
      qty: v.quantity || 1,
      rate: unitPrice.toFixed(2),
      per: "No",
      amount: ((v.quantity || 1) * unitPrice).toFixed(2),
      specs: {
        color: firstFilled(v.color, orderVehicle?.color, vehicleRef?.color),
        chassisNo: firstFilled(v.chassisNo, booking?.chassisNumber),
        engineNo: firstFilled(v.engineNo, booking?.engineNumber),
        yom: firstFilled(v.yom, booking?.yom),
        fuelType: firstFilled(v.fuelType, booking?.fuelType),
        countryOfOrigin,
        engineCapacity: formatEngineCapacity(
          v.engineCapacity,
          booking?.engineCapacity,
          vehicleRef?.engineCapacity,
          orderVehicle?.engineCapacity,
        ),
        hsn: commercialHsn,
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
    paymentTerms: pi.paymentTerms || "",
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
      bankName: companyForPdf?.bankDetails?.bankName || pi.company_id?.bankDetails?.bankName || "",
      accountNo: companyForPdf?.bankDetails?.accountNo || pi.company_id?.bankDetails?.accountNo || "",
      branchIfsc: companyForPdf?.bankDetails?.branchIfsc || pi.company_id?.bankDetails?.branchIfsc || "",
      swiftCode: companyForPdf?.bankDetails?.swiftCode || pi.company_id?.bankDetails?.swiftCode || "",
    },
  };
};