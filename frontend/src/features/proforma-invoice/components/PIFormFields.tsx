import { Landmark, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { PIForm, VehicleLineItem } from "./pi.types";

interface PIFormFieldsProps {
  form: PIForm;
  setForm: React.Dispatch<React.SetStateAction<PIForm>>;
  errors: Record<string, string>;
  clients: any[];
  companies: any[];
  ordersWithDisplay: any[];
  selectedOrder: any | null;
  setClientSearch: React.Dispatch<React.SetStateAction<string>>;
  setCompanySearch: React.Dispatch<React.SetStateAction<string>>;
  setOrderSearch: React.Dispatch<React.SetStateAction<string>>;
  handleSelectOrder: (booking: any) => void;
  handleVehicleChange: (
    index: number,
    field: keyof VehicleLineItem,
    value: any,
  ) => void;
  handleClientSelect: (clientId: string) => void;
  handleCompanySelect: (companyId: string) => void;
  handleClientSnapshotChange: (field: string, value: any) => void;
  handleCompanySnapshotChange: (field: string, value: any) => void;
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
  companies,
  ordersWithDisplay,
  selectedOrder,
  setClientSearch,
  setCompanySearch,
  setOrderSearch,
  handleSelectOrder,
  handleVehicleChange,
  handleClientSelect,
  handleCompanySelect,
  handleClientSnapshotChange,
  handleCompanySnapshotChange,
  expandedRows,
  toggleRow,
  totalAmount,
  numberToWords,
  getRate,
  getAmount,
}) => {
  const inputClass =
    "w-full h-12 px-4 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base shadow-sm";
  const lockedInputClass =
    "w-full h-12 px-4 rounded-md border border-gray-200 bg-gray-50 text-gray-600 placeholder-gray-400 shadow-sm cursor-not-allowed";
  const readOnlyTextClass = `${lockedInputClass} text-right font-mono`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const sectionTitleClass = "text-xl font-medium text-gray-900 mb-6";
  const divider = <hr className="border-gray-200 my-10" />;

  const initialSelectedClient = clients.find((c) => c._id === form.client_id);
  const initialSelectedCompany = companies.find(
    (c) => c._id === form.company_id,
  );

  const displayClient = form.clientSnapshot || initialSelectedClient;
  const displayCompany = form.companySnapshot || initialSelectedCompany;
  const isClientAutofilled = !!form.client_id;
  const isCompanyAutofilled = !!form.company_id;

  const handleVehicleCheckbox = (booking: any, checked: boolean) => {
    console.log("BOOKING:", booking);
    const exists = form.vehicleDetails.some(
      (v: any) => v.chassisNo === booking.chassisNumber
    );

    // REMOVE
    if (!checked) {
      setForm({
        ...form,
        vehicleDetails: form.vehicleDetails.filter(
          (v: any) => v.chassisNo !== booking.chassisNumber
        ),
      });

      return;
    }

    // PREVENT DUPLICATE
    if (exists) return;

    const newVehicle: VehicleLineItem = {
      selected: true,

      model: booking.vehicleName || "",
      quantity: 1,

      fob: booking.vehicleId?.fobAmount || 0,
      freight: booking.vehicleId?.freight || 0,

      color: booking.vehicleId?.color || "",
      engineNo: booking.engineNumber || "",
      chassisNo: booking.chassisNumber || "",
      yom: booking.yom || "",

      commercialHsn: booking.vehicleId?.commercialHsnCode || "",
      exportHsn: booking.vehicleId?.exportHsnCode || "",

      fuelType: booking.fuelType || booking.vehicleId?.fuelType || "",
      countryOfOrigin: booking.vehicleId?.countryOfOrigin || "",
      engineCapacity:
        booking.engineCapacity || booking.vehicleId?.engineCapacity || "",
      vehicle_id: "",
      hsn: ""
    };

    setForm({
      ...form,
      vehicleDetails: [...form.vehicleDetails, newVehicle],
    });
  };
  return (
    <>
      {/* BUYER / CLIENT */}
      <div>
        <h3 className={sectionTitleClass}>Buyer / Client Data</h3>
        {/* FIX: added mb-6 so Country field has gap before next section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className={labelClass}>Client Company Name *</label>
            <SearchableCombobox
              data={clients}
              value={form.client_id}
              onValueChange={handleClientSelect}
              onSearchChange={setClientSearch}
              displayField="displayCompanyName"
              valueField="_id"
              placeholder="Select a client company..."
              searchPlaceholder="Search client companies..."
              emptyMessage="No clients found."
              error={!!errors.client_id}
              renderItem={(item, index) => (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 text-xs text-gray-400 font-mono">
                      {index + 1}.
                    </span>
                    <span className="font-medium truncate">
                      {item.companyName || item.name || "-"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap text-right">
                    <div>{item.name || "-"}</div>
                    <div>{item.phone || "-"}</div>
                  </div>
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
              value={displayClient?.companyName || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("companyName", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Name</label>
            <input
              value={displayClient?.name || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("name", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>House/Building</label>
            <input
              value={displayClient?.address?.houseBuilding || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange(
                  "address.houseBuilding",
                  e.target.value,
                )
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Street/Locality/Area</label>
            <input
              value={displayClient?.address?.streetArea || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("address.streetArea", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City/Town</label>
            <input
              value={displayClient?.address?.cityTown || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("address.cityTown", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              value={displayClient?.address?.state || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("address.state", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={displayClient?.email || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("email", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode / ZIP</label>
            <input
              value={displayClient?.address?.pincode || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("address.pincode", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              value={displayClient?.address?.country || ""}
              readOnly={isClientAutofilled}
              onChange={(e) =>
                handleClientSnapshotChange("address.country", e.target.value)
              }
              className={isClientAutofilled ? lockedInputClass : inputClass}
            />
          </div>
        </div>
      </div>

      {/* LINK ORDER — FIX: added mt-6 so heading doesn't stick to Country field */}
      <div className="mt-6">
        <h3 className={sectionTitleClass}>Fetch Booked Vehicle</h3>
        <div className="max-w-4xl">
          <div>
            <label className={labelClass}>
              Choose Booked Vehicle (Adds Vehicle Row)
            </label>
            <SearchableCombobox
              data={ordersWithDisplay.filter(
                (item) => item.chassisNumber && item.chassisNumber.trim() !== ""
              )}
              disabled={false}
              value={selectedOrder?._id || ""}
              onValueChange={() => { }}
              onSearchChange={setOrderSearch}
              displayField="displayName"
              valueField="_id"
              placeholder={
                form.client_id
                  ? "Search booked vehicle..."
                  : "Select client first"
              }
              searchPlaceholder="Search by Vehicle ID, name, chassis, color or status..."
              emptyMessage={
                form.client_id
                  ? "No booked vehicles with chassis number found."
                  : "Please select client first."
              }
              header={
                <div className="grid grid-cols-[40px_110px_minmax(180px,1fr)_160px_140px_110px_100px] gap-2 px-10 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                  <div>S.No</div>
                  <div>Vehicle ID</div>
                  <div>Vehicle Name</div>
                  <div>Dealer Name</div>
                  <div>Chassis</div>
                  <div>Color</div>
                  <div>Status</div>
                </div>
              }
              renderItem={(item) => {
                const checked = form.vehicleDetails.some(
                  (v: any) => v.chassisNo === item.chassisNumber,
                );

                return (
                  <div className="grid grid-cols-[60px_110px_minmax(180px,1fr)_160px_140px_110px_100px] gap-2 w-full items-center py-1">

                    {/* Checkbox + S.NO */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={(value) =>
                          handleVehicleCheckbox(item, !!value)
                        }
                      />

                      <span className="text-xs text-gray-400 font-mono">
                        {item.serialNumber}.
                      </span>
                    </div>

                    <span className="font-bold text-blue-600 truncate">
                      {item.vehicleDisplayId || "-"}
                    </span>

                    <span className="truncate text-gray-700 font-medium">
                      {item.vehicleName || "-"}
                    </span>

                    <span className="truncate text-gray-700">
                      {item.assignedDealerSnapshot?.name || "-"}
                    </span>

                    <span className="text-[11px] text-gray-500">
                      {item.chassisNumber || "-"}
                    </span>

                    <span className="text-[11px] text-gray-600">
                      {item.color || "-"}
                    </span>

                    <span className="text-[11px] text-gray-600">
                      {item.statusLabel || "-"}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {divider}

      {/* VEHICLE LINE ITEMS */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className={sectionTitleClass + " mb-0!"}>Vehicle Line Items</h3>
          <span className="text-sm text-gray-500">
            Auto-filled from booked vehicle and view only
          </span>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
            <div className="col-span-4 flex items-center gap-3">
              <Checkbox
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
                className="h-6 w-6 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
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
                  <div className="pt-1">
                    <Checkbox
                      checked={v.selected !== false}
                      onCheckedChange={(checked) =>
                        handleVehicleChange(index, "selected", !!checked)
                      }
                      className="h-6 w-6 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      placeholder="Vehicle Model"
                      value={v.model}
                      readOnly
                      className={lockedInputClass}
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
                    readOnly
                    className={`${lockedInputClass} text-center`}
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
                    readOnly
                    className={readOnlyTextClass}
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
                    readOnly
                    className={readOnlyTextClass}
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
                      className={`w-5 h-5 transition-transform ${expandedRows[index] ? "rotate-180" : ""
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
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Engine No</label>
                    <input
                      value={v.engineNo}
                      readOnly
                      className={`${lockedInputClass} font-mono`}
                      placeholder="Mandatory for Tax Invoice"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Chassis No (VIN)</label>
                    <input
                      value={v.chassisNo}
                      readOnly
                      className={`${lockedInputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Year of Manufacture</label>
                    <input
                      value={v.yom}
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Commercial HSN</label>
                    <input
                      value={v.commercialHsn || v.hsn || ""}
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Export HSN</label>
                    <input
                      value={v.exportHsn || v.hsn || ""}
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Fuel Type</label>
                    <input
                      value={v.fuelType}
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Country of Origin</label>
                    <input
                      value={v.countryOfOrigin}
                      readOnly
                      className={lockedInputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Engine Capacity</label>
                    <input
                      value={v.engineCapacity}
                      readOnly
                      className={lockedInputClass}
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

      {divider}

      {/* DOCUMENT DETAILS */}
      <div>
        <h3 className={sectionTitleClass}>Document Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>PI Number / Voucher No.</label>
            <input
              value={form.piNumber}
              readOnly
              className={lockedInputClass}
              placeholder="Auto generated after company selection"
            />
          </div>
          <div>
            <label className={labelClass}>Dated</label>
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
            <label className={labelClass}>Mode / Terms of Payment</label>
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
          <div>
            <label className={labelClass}>Buyer's Ref./Order No.</label>
            <input
              value={form.buyersRef}
              onChange={(e) => setForm({ ...form, buyersRef: e.target.value })}
              className={inputClass}
              placeholder="e.g. PO-12345"
            />
          </div>
          <div>
            <label className={labelClass}>Other References</label>
            <input
              value={form.otherRef}
              onChange={(e) => setForm({ ...form, otherRef: e.target.value })}
              className={inputClass}
              placeholder="e.g. Contract No. ABC"
            />
          </div>
          <div>
            <label className={labelClass}>Dispatched Through</label>
            <input
              value={form.dispatchedThrough}
              onChange={(e) =>
                setForm({ ...form, dispatchedThrough: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. DHL, FedEx"
            />
          </div>
          <div>
            <label className={labelClass}>Destination</label>
            <input
              value={form.destination}
              onChange={(e) =>
                setForm({ ...form, destination: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. Dubai, UAE"
            />
          </div>
        </div>
      </div>

      {divider}

      {/* EXPORTER / COMPANY DATA */}
      <div>
        <h3 className={sectionTitleClass}>Company Details (Exporter)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Exporter (Company)</label>
            <SearchableCombobox
              data={companies}
              value={form.company_id}
              onValueChange={handleCompanySelect}
              onSearchChange={setCompanySearch}
              displayField="name"
              valueField="_id"
              placeholder="Select a company..."
              searchPlaceholder="Search companies..."
              emptyMessage="No companies found."
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
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input
              value={displayCompany?.name || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("name", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>GST Number</label>
            <input
              value={displayCompany?.gstNumber || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("gstNumber", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>House/Building</label>
            <input
              value={displayCompany?.address?.houseBuilding || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "address.houseBuilding",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Street/Locality/Area</label>
            <input
              value={displayCompany?.address?.streetArea || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "address.streetArea",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City/Town</label>
            <input
              value={displayCompany?.address?.cityTown || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("address.cityTown", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              value={displayCompany?.address?.state || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("address.state", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode / ZIP</label>
            <input
              value={displayCompany?.address?.pincode || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("address.pincode", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={displayCompany?.email || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("email", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              value={displayCompany?.address?.country || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange("address.country", e.target.value)
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <input
              placeholder="Bank Name"
              value={displayCompany?.bankDetails?.bankName || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "bankDetails.bankName",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
            <input
              placeholder="Account No"
              value={displayCompany?.bankDetails?.accountNo || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "bankDetails.accountNo",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
            <input
              placeholder="Branch / IFSC"
              value={displayCompany?.bankDetails?.branchIfsc || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "bankDetails.branchIfsc",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
            <input
              placeholder="SWIFT Code"
              value={displayCompany?.bankDetails?.swiftCode || ""}
              readOnly={isCompanyAutofilled}
              onChange={(e) =>
                handleCompanySnapshotChange(
                  "bankDetails.swiftCode",
                  e.target.value,
                )
              }
              className={isCompanyAutofilled ? lockedInputClass : inputClass}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PIFormFields;
