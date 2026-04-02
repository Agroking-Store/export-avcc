import { Landmark, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { VehicleLineItem, PIForm } from "./pi.types";

interface PIFormFieldsProps {
  form: PIForm;
  setForm: React.Dispatch<React.SetStateAction<PIForm>>;
  errors: Record<string, string>;
  clients: any[];
  dealers: any[];
  ordersWithDisplay: any[];
  selectedOrder: any | null;
  setClientSearch: React.Dispatch<React.SetStateAction<string>>;
  setDealerSearch: React.Dispatch<React.SetStateAction<string>>;
  setOrderSearch: React.Dispatch<React.SetStateAction<string>>;
  handleSelectOrder: (orderId: string) => Promise<void>;
  handleVehicleChange: (
    index: number,
    field: keyof VehicleLineItem,
    value: any
  ) => void;
  handleClientSelect: (clientId: string) => void;
  handleDealerSelect: (dealerId: string) => void;
  expandedRows: Record<number, boolean>;
  toggleRow: (index: number) => void;
  totalAmount: number;
  numberToWords: (num: number) => string;
  getRate: (v: VehicleLineItem) => number;
  getAmount: (v: VehicleLineItem) => number;
}

const PIFormFields: React.FC<PIFormFieldsProps> = ({
  form,
  setForm,
  errors,
  clients,
  dealers,
  ordersWithDisplay,
  selectedOrder,
  setClientSearch,
  setDealerSearch,
  setOrderSearch,
  handleSelectOrder,
  handleVehicleChange,
  handleClientSelect,
  handleDealerSelect,
  expandedRows,
  toggleRow,
  totalAmount,
  numberToWords,
  getRate,
  getAmount,
}) => {
  const inputClass =
    "w-full h-12 px-4 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base shadow-sm";
  const getInputClass = (errKey?: string) =>
    `w-full h-12 px-4 bg-white border ${
      errKey && errors[errKey]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-600 focus:ring-blue-600"
    } rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all text-base shadow-sm`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const sectionTitleClass = "text-xl font-medium text-gray-900 mb-6";
  const divider = <hr className="border-gray-200 my-10" />;

  return (
    <>
      {/* LINK ORDER */}
      <div>
        <h3 className={sectionTitleClass}>Link Dealer Order</h3>
        <div className="max-w-md">
          <div>
            <label className={labelClass}>
              Select Order (Auto-fills Dealer & Vehicles)
            </label>
            <SearchableCombobox
              data={ordersWithDisplay}
              value={selectedOrder?._id || ""}
              onValueChange={handleSelectOrder}
              onSearchChange={setOrderSearch}
              displayField="displayName"
              valueField="_id"
              placeholder="Search and select an order..."
              searchPlaceholder="Search by Order ID..."
              emptyMessage="No orders found."
              renderItem={(item, index) => (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 text-xs text-gray-400 font-mono">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate">
                      {item.orderId} - {item.dealerName || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap text-right">
                    {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                  </span>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {divider}

      {/* DOCUMENT DETAILS */}
      <div>
        <h3 className={sectionTitleClass}>Document Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Voucher No (PI Number)</label>
            <input
              value={form.piNumber}
              onChange={(e) => setForm({ ...form, piNumber: e.target.value })}
              className={inputClass}
              placeholder="e.g. PI-2026-001"
            />
          </div>
          <div>
            <label className={labelClass}>Validity Date</label>
            <DatePicker
              date={
                form.validityDate
                  ? new Date(form.validityDate + "T00:00:00")
                  : undefined
              }
              setDate={(date) =>
                setForm({
                  ...form,
                  validityDate: date ? format(date, "yyyy-MM-dd") : "",
                })
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className={labelClass}>Payment Terms</label>
            <input
              value={form.paymentTerms}
              onChange={(e) =>
                setForm({ ...form, paymentTerms: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. 100% Advance"
            />
          </div>
          <div>
            <label className={labelClass}>Terms of Delivery</label>
            <input
              value={form.termsOfDelivery}
              onChange={(e) =>
                setForm({ ...form, termsOfDelivery: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. CIF, Ex-Works"
            />
          </div>
          <div>
            <label className={labelClass}>Incoterm</label>
            <input
              value={form.incoterm}
              onChange={(e) => setForm({ ...form, incoterm: e.target.value })}
              className={inputClass}
              placeholder="e.g. CIF"
            />
          </div>
          <div>
            <label className={labelClass}>Port of Loading</label>
            <input
              value={form.portOfLoading}
              onChange={(e) =>
                setForm({ ...form, portOfLoading: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. Mundra, India"
            />
          </div>
          <div>
            <label className={labelClass}>Port of Discharge</label>
            <input
              value={form.portOfDischarge}
              onChange={(e) =>
                setForm({
                  ...form,
                  portOfDischarge: e.target.value,
                })
              }
              className={inputClass}
              placeholder="e.g. Jebel Ali, UAE"
            />
          </div>
        </div>
      </div>

      {divider}

      {/* BUYER / CLIENT */}
      <div>
        <h3 className={sectionTitleClass}>Buyer / Client Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Buyer (Client) *</label>
            <SearchableCombobox
              data={clients}
              value={form.client_id}
              onValueChange={handleClientSelect}
              onSearchChange={setClientSearch}
              displayField="name"
              valueField="_id"
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              emptyMessage="No clients found."
              error={!!errors.client_id}
              renderItem={(item, index) => (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 text-xs text-gray-400 font-mono">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap text-right">
                    {item.phone || "-"}
                  </span>
                </div>
              )}
            />
            {errors.client_id && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.client_id}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Company Name</label>
            <input
              value={form.clientDetails.companyName}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    companyName: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Name</label>
            <input
              value={form.clientDetails.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    name: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>House/Building</label>
            <input
              value={form.clientDetails.address.houseBuilding}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      houseBuilding: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Street/Locality/Area</label>
            <input
              value={form.clientDetails.address.streetArea}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      streetArea: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City/Town</label>
            <input
              value={form.clientDetails.address.cityTown}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      cityTown: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              value={form.clientDetails.address.state}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      state: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode / ZIP</label>
            <input
              value={form.clientDetails.address.pincode}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      pincode: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              value={form.clientDetails.address.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  clientDetails: {
                    ...form.clientDetails,
                    address: {
                      ...form.clientDetails.address,
                      country: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {divider}

      {/* EXPORTER / COMPANY DATA */}
      <div>
        <h3 className={sectionTitleClass}>Exporter / Company Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Exporter (Dealer)</label>
            <SearchableCombobox
              data={dealers}
              value={form.dealer_id}
              onValueChange={handleDealerSelect}
              onSearchChange={setDealerSearch}
              displayField="name"
              valueField="_id"
              placeholder="Select a dealer..."
              searchPlaceholder="Search dealers..."
              emptyMessage="No dealers found."
              renderItem={(item, index) => (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 text-xs text-gray-400 font-mono">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap text-right">
                    {item.contact || "-"}
                  </span>
                </div>
              )}
            />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              value={form.dealerDetails.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    name: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>GSTIN</label>
            <input
              value={form.dealerDetails.gstin}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    gstin: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>House/Building</label>
            <input
              value={form.dealerDetails.address.houseBuilding}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      houseBuilding: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Street/Locality/Area</label>
            <input
              value={form.dealerDetails.address.streetArea}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      streetArea: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City/Town</label>
            <input
              value={form.dealerDetails.address.cityTown}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      cityTown: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              value={form.dealerDetails.address.state}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      state: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode / ZIP</label>
            <input
              value={form.dealerDetails.address.pincode}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      pincode: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              value={form.dealerDetails.address.country}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealerDetails: {
                    ...form.dealerDetails,
                    address: {
                      ...form.dealerDetails.address,
                      country: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Bank Details (Optional)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              placeholder="Bank Name"
              value={form.bankDetails.bankName}
              onChange={(e) =>
                setForm({
                  ...form,
                  bankDetails: {
                    ...form.bankDetails,
                    bankName: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
            <input
              placeholder="Account No"
              value={form.bankDetails.accountNo}
              onChange={(e) =>
                setForm({
                  ...form,
                  bankDetails: {
                    ...form.bankDetails,
                    accountNo: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
            <input
              placeholder="Branch / IFSC"
              value={form.bankDetails.branchIfsc}
              onChange={(e) =>
                setForm({
                  ...form,
                  bankDetails: {
                    ...form.bankDetails,
                    branchIfsc: e.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {divider}

      {/* VEHICLE LINE ITEMS */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className={sectionTitleClass + " mb-0!"}>Vehicle Line Items</h3>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
            <div className="col-span-4 flex items-center gap-3">
              <Switch
                checked={
                  form.vehicleDetails.length > 0 &&
                  form.vehicleDetails.every((v) => v.selected !== false)
                }
                onCheckedChange={(checked) => {
                  setForm((prev) => ({
                    ...prev,
                    vehicleDetails: prev.vehicleDetails.map((v) => ({
                      ...v,
                      selected: !!checked,
                    })),
                  }));
                }}
                className="scale-125 ml-1 data-[state=checked]:bg-blue-600"
              />
              Model / Description
            </div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">FOB ($)</div>
            <div className="col-span-1 text-right">Freight ($)</div>
            <div className="col-span-1 text-right">Rate ($)</div>
            <div className="col-span-2 text-right">Amount ($)</div>
            <div className="col-span-1 text-right"></div>
          </div>

          {/* Rows */}
          {form.vehicleDetails.map((v, index) => (
            <div key={index} className="border-b border-gray-200 last:border-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-1 lg:col-span-4 flex gap-3 items-start">
                  <div className="pt-3">
                    <Switch
                      checked={v.selected !== false}
                      onCheckedChange={(checked) =>
                        handleVehicleChange(index, "selected", !!checked)
                      }
                      className="scale-125 ml-1 data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      placeholder="Vehicle Model"
                      value={v.model}
                      onChange={(e) =>
                        handleVehicleChange(index, "model", e.target.value)
                      }
                      className={getInputClass(`v_${index}_model`)}
                    />
                  </div>
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={v.quantity}
                    onChange={(e) =>
                      handleVehicleChange(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className={`${getInputClass(
                      `v_${index}_quantity`
                    )} text-center`}
                  />
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                    FOB ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={v.fob}
                    onChange={(e) =>
                      handleVehicleChange(
                        index,
                        "fob",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className={`${inputClass} text-right font-mono`}
                  />
                </div>
                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1">
                    Freight ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={v.freight}
                    onChange={(e) =>
                      handleVehicleChange(
                        index,
                        "freight",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className={`${inputClass} text-right font-mono`}
                  />
                </div>
                <div className="col-span-1 lg:col-span-1 text-right font-mono text-gray-600">
                  <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1 text-right">
                    Rate ($)
                  </label>
                  <span
                    className={errors[`v_${index}_rate`] ? "text-red-500" : ""}
                  >
                    ${getRate(v).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-1 lg:col-span-2 text-right font-mono font-medium text-gray-900">
                  <label className="block lg:hidden text-xs font-medium text-gray-500 mb-1 text-right">
                    Amount ($)
                  </label>
                  ${getAmount(v).toLocaleString()}
                </div>
                <div className="col-span-1 lg:col-span-1 flex justify-end items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => toggleRow(index)}
                    variant="ghost"
                    size="icon"
                    title="Toggle Advanced Fields"
                  >
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${
                        expandedRows[index] ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {/* Expanded Fields */}
              {expandedRows[index] && (
                <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className={labelClass}>Exterior Color</label>
                    <input
                      value={v.color}
                      onChange={(e) =>
                        handleVehicleChange(index, "color", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Engine No</label>
                    <input
                      value={v.engineNo}
                      onChange={(e) =>
                        handleVehicleChange(index, "engineNo", e.target.value)
                      }
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Chassis No (VIN)</label>
                    <input
                      value={v.chassisNo}
                      onChange={(e) =>
                        handleVehicleChange(index, "chassisNo", e.target.value)
                      }
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Year of Manufacture</label>
                    <input
                      value={v.yom}
                      onChange={(e) =>
                        handleVehicleChange(index, "yom", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>HSN / SAC</label>
                    <input
                      value={v.hsn}
                      onChange={(e) =>
                        handleVehicleChange(index, "hsn", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fuel Type</label>
                    <input
                      value={v.fuelType}
                      onChange={(e) =>
                        handleVehicleChange(index, "fuelType", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country of Origin</label>
                    <input
                      value={v.countryOfOrigin}
                      onChange={(e) =>
                        handleVehicleChange(
                          index,
                          "countryOfOrigin",
                          e.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Engine Capacity</label>
                    <input
                      value={v.engineCapacity}
                      onChange={(e) =>
                        handleVehicleChange(
                          index,
                          "engineCapacity",
                          e.target.value
                        )
                      }
                      className={inputClass}
                      placeholder="e.g. 2000cc"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {divider}

      {/* SUMMARY */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
        <div className="w-full sm:w-1/2">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Amount Chargeable (in words)
          </p>
          <p className="text-base font-medium text-gray-900">
            {numberToWords(totalAmount)}
          </p>
        </div>
        <div className="w-full sm:w-auto sm:text-right">
          <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Grand Total
          </p>
          <p className="text-4xl font-light text-gray-900 tracking-tight font-mono">
            $
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </>
  );
};

export default PIFormFields;
