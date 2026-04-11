import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, Car, AlertCircle, Package, Hash, Globe, Fuel, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { bookingApi } from '../../../services/bookingApi';
import { dealerApi } from '../../../services/dealerApi';
import Select from '../../../components/common/Select';

const DealerVehicleBooking = () => {
  const { orderId } = useParams() as { orderId: string };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState('');

  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);

  const srNoParam = searchParams.get('srNo') || '';
  const vehicleName = searchParams.get('name') || '';
  const vehicleColor = searchParams.get('color') || '';

  const [vehicles, setVehicles] = useState<any[]>([
    {
      hsnCode: '',
      vehicleName: vehicleName,
      exteriorColour: vehicleColor,
      chassisNo: '',
      engineNo: '',
      srNo: srNoParam,
      engineCapacity: '',
      fuelType: '',
      countryOfOrigin: '',
      yom: new Date().getFullYear(),
      fobAmount: 0,
      freight: 0,
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dealerApi.getAll().then((res) => {
      setDealers(res.data || []);
    }).catch(() => toast.error('Failed to load dealers'));
  }, []);

  const handleInputChange = useCallback((field: string, value: any) => {
    if (field === 'dealerId') {
      setSelectedDealer(value);
    } else if (field === 'date') {
      setBookingDate(value);
    } else {
      const newVehicles = [...vehicles];
      const fieldParts = field.split('.');
      if (fieldParts[0] === 'vehicles') {
        newVehicles[0][fieldParts[1]] = value;
        setVehicles(newVehicles);
      }
    }
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, [vehicles]);

  const validateField = (field: string) => {
    const vehicle = vehicles[0];
    switch (field) {
      case 'dealerId':
        if (!selectedDealer) setErrors(prev => ({ ...prev, dealerId: 'Dealer is required' }));
        break;
      case 'date':
        if (!bookingDate) setErrors(prev => ({ ...prev, date: 'Booking date is required' }));
        break;
      case 'vehicles.hsnCode':
        if (!vehicle.hsnCode?.trim()) setErrors(prev => ({ ...prev, [field]: 'HSN Code is required' }));
        break;
      case 'vehicles.vehicleName':
        if (!vehicle.vehicleName?.trim()) setErrors(prev => ({ ...prev, [field]: 'Vehicle name is required' }));
        break;
      case 'vehicles.exteriorColour':
        if (!vehicle.exteriorColour?.trim()) setErrors(prev => ({ ...prev, [field]: 'Color is required' }));
        break;
      case 'vehicles.chassisNo':
        if (!vehicle.chassisNo?.trim()) {
          setErrors(prev => ({ ...prev, [field]: 'Chassis No is required' }));
        } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicle.chassisNo.trim())) {
          setErrors(prev => ({ ...prev, [field]: 'Must be 17 alphanumeric characters (no I, O, Q)' }));
        }
        break;
      case 'vehicles.engineNo':
        if (!vehicle.engineNo?.trim()) setErrors(prev => ({ ...prev, [field]: 'Engine number is required' }));
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const vehicle = vehicles[0];

    if (!selectedDealer) newErrors.dealerId = 'Dealer is required';
    if (!bookingDate) newErrors.date = 'Booking date is required';
    if (!vehicle.hsnCode?.trim()) newErrors['vehicles.hsnCode'] = 'HSN Code is required';
    if (!vehicle.vehicleName?.trim()) newErrors['vehicles.vehicleName'] = 'Vehicle name is required';
    if (!vehicle.exteriorColour?.trim()) newErrors['vehicles.exteriorColour'] = 'Color is required';
    if (!vehicle.chassisNo?.trim()) {
      newErrors['vehicles.chassisNo'] = 'Chassis No is required';
    } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vehicle.chassisNo.trim())) {
      newErrors['vehicles.chassisNo'] = 'Must be 17 alphanumeric characters (no I, O, Q)';
    }
    if (!vehicle.engineNo?.trim()) newErrors['vehicles.engineNo'] = 'Engine number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      await bookingApi.create({
        dealerId: selectedDealer,
        date: bookingDate,
        orderId: orderId,
        vehicles: [{
          hsnCode: vehicles[0].hsnCode,
          name: vehicles[0].vehicleName,
          color: vehicles[0].exteriorColour,
          chassisNo: vehicles[0].chassisNo,
          engineNo: vehicles[0].engineNo,
          engineCapacity: vehicles[0].engineCapacity,
          fuelType: vehicles[0].fuelType,
          countryOfOrigin: vehicles[0].countryOfOrigin,
          yom: vehicles[0].yom,
          fobAmount: vehicles[0].fobAmount,
          freight: vehicles[0].freight,
          quantity: 1,
          srNo: vehicles[0].srNo
        }],
        status: 'Booked' // Explicit save ensuring booked mapping
      });
      toast.success('Vehicle booked successfully');
      navigate(`/dealers/orders/${orderId}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create booking';
      if (msg.includes('already exists') || msg.includes('already booked')) {
        toast.error('Booking failed: Uniqueness conflict');
        if (msg.includes('Engine No') || msg.includes('Chassis No')) {
          setErrors(prev => ({ ...prev, 'vehicles.chassisNo': msg, 'vehicles.engineNo': msg }));
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ── UI Helpers ── */
  const ErrorMessage = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return (
      <p className="mt-1.5 flex items-center gap-1 text-red-600 dark:text-red-400 text-[13px] font-medium animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={14} className="flex-shrink-0" />
        {errors[field]}
      </p>
    );
  };

  const inputBase =
    "w-full px-4 py-3 text-[15px] rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10";

  const inputClass = (field: string) =>
    `${inputBase} ${errors[field]
      ? "border-red-400 dark:border-red-500 bg-red-50/30 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/10"
      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
    }`;

  const labelClass = "block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5";
  const req = <span className="text-red-500 ml-0.5">*</span>;
  const hasErrors = Object.values(errors).filter(Boolean).length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <button
            onClick={() => navigate(`/dealers/orders/${orderId}`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Order
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Book New Vehicle
            <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold tracking-wider uppercase border border-blue-200 dark:border-blue-800/50">
              Booking flow
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Complete the form below to lock in the booking for vehicle slot #{srNoParam}
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-inner">
          <Car className="text-white w-8 h-8" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section 1: Order Routing */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Users className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Booking Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Dealer {req}</label>
              <Select
                value={selectedDealer}
                onChange={(e) => handleInputChange('dealerId', e.target.value)}
                onBlur={() => validateField('dealerId')}
                className={inputClass('dealerId')}
              >
                <option value="">Choose dealer...</option>
                {dealers.map(dealer => (
                  <option key={dealer._id} value={dealer._id}>{dealer.name}</option>
                ))}
              </Select>
              <ErrorMessage field="dealerId" />
            </div>
            <div>
              <label className={labelClass}>Booking Date {req}</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => handleInputChange('date', e.target.value)}
                onBlur={() => validateField('date')}
                className={inputClass('date')}
              />
              <ErrorMessage field="date" />
            </div>
          </div>
        </div>

        {/* Section 2: Core Vehicle Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <Package className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Core Vehicle Identifiers</h2>
          </div>
          <div className="p-6 space-y-6">

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>Vehicle Name {req}</label>
                <input
                  type="text"
                  value={vehicles[0].vehicleName}
                  onChange={(e) => handleInputChange('vehicles.vehicleName', e.target.value)}
                  onBlur={() => validateField('vehicles.vehicleName')}
                  placeholder="e.g. Toyota LC300"
                  className={inputClass('vehicles.vehicleName')}
                />
                <ErrorMessage field="vehicles.vehicleName" />
              </div>
              <div>
                <label className={labelClass}>Exterior Colour {req}</label>
                <input
                  type="text"
                  value={vehicles[0].exteriorColour}
                  onChange={(e) => handleInputChange('vehicles.exteriorColour', e.target.value)}
                  onBlur={() => validateField('vehicles.exteriorColour')}
                  placeholder="e.g. Pearl White"
                  className={inputClass('vehicles.exteriorColour')}
                />
                <ErrorMessage field="vehicles.exteriorColour" />
              </div>
              <div>
                <label className={labelClass}>HSN Code {req}</label>
                <input
                  type="text"
                  value={vehicles[0].hsnCode}
                  onChange={(e) => handleInputChange('vehicles.hsnCode', e.target.value)}
                  onBlur={() => validateField('vehicles.hsnCode')}
                  placeholder="e.g., 8703.21.69"
                  className={inputClass('vehicles.hsnCode')}
                />
                <ErrorMessage field="vehicles.hsnCode" />
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium ml-1">Must be 8-10 characters (e.g., 8703.21.69)</p>
              </div>
            </div>

            <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-6"></div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Engine Number {req}</label>
                <input
                  type="text"
                  value={vehicles[0].engineNo}
                  onChange={(e) => handleInputChange('vehicles.engineNo', e.target.value.toUpperCase())}
                  onBlur={() => validateField('vehicles.engineNo')}
                  placeholder="e.g., ENGINEX12345"
                  className={`${inputClass('vehicles.engineNo')} font-mono uppercase`}
                />
                <ErrorMessage field="vehicles.engineNo" />
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium ml-1">Must be 10-15 characters (e.g., ENGINEX12345)</p>
              </div>

              <div>
                <label className={labelClass}>Chassis Number {req}</label>
                <input
                  type="text"
                  value={vehicles[0].chassisNo}
                  onChange={(e) => handleInputChange('vehicles.chassisNo', e.target.value.toUpperCase())}
                  onBlur={() => validateField('vehicles.chassisNo')}
                  placeholder="e.g., MA1AB2C3D4E5F6G7H"
                  maxLength={17}
                  className={`${inputClass('vehicles.chassisNo')} font-mono uppercase`}
                />
                <ErrorMessage field="vehicles.chassisNo" />
                <p className="text-[12px] text-gray-500 mt-1.5 font-medium ml-1 flex justify-between">
                  <span>Must be 17 characters (e.g., MA1AB2C3D4E5F6G7H)</span>
                  <span className={`${vehicles[0].chassisNo.length === 17 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {vehicles[0].chassisNo.length}/17
                  </span>
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Optional Vehicle Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Additional Specifications</h2>
            <p className="text-xs text-gray-500 mt-0.5">Optional details for logistical tracking.</p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className={labelClass}>Engine Capacity</label>
              <input
                type="text"
                value={vehicles[0].engineCapacity}
                onChange={(e) => handleInputChange('vehicles.engineCapacity', e.target.value)}
                placeholder="e.g. 1496cc"
                className={inputClass('vehicles.engineCapacity')}
              />
            </div>
            <div>
              <label className={labelClass}>Fuel Type</label>
              <input
                type="text"
                value={vehicles[0].fuelType}
                onChange={(e) => handleInputChange('vehicles.fuelType', e.target.value)}
                placeholder="e.g. Petrol"
                className={inputClass('vehicles.fuelType')}
              />
            </div>
            <div>
              <label className={labelClass}>Origin Country</label>
              <input
                type="text"
                value={vehicles[0].countryOfOrigin}
                onChange={(e) => handleInputChange('vehicles.countryOfOrigin', e.target.value)}
                placeholder="e.g. Japan"
                className={inputClass('vehicles.countryOfOrigin')}
              />
            </div>
            <div>
              <label className={labelClass}>Mfg Year (YOM)</label>
              <input
                type="number"
                value={vehicles[0].yom}
                onChange={(e) => handleInputChange('vehicles.yom', parseInt(e.target.value) || 0)}
                placeholder="e.g. 2024"
                className={inputClass('vehicles.yom')}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>FOB Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={vehicles[0].fobAmount || ''}
                  onChange={(e) => handleInputChange('vehicles.fobAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${inputClass('vehicles.fobAmount')} pl-8`}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Freight Cost</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={vehicles[0].freight || ''}
                  onChange={(e) => handleInputChange('vehicles.freight', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`${inputClass('vehicles.freight')} pl-8`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="w-full sm:w-auto">
            {hasErrors && (
              <p className="text-red-500 font-medium text-sm flex items-center gap-1.5">
                <AlertCircle size={16} /> Update invalid required fields
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate(`/dealers/orders/${orderId}`)}
              className="w-full sm:w-auto px-6 py-3.5 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || hasErrors}
              className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Book Vehicle
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default DealerVehicleBooking;