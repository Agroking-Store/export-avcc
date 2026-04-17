import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Users, Car, AlertCircle, Package, Hash, 
  Globe, Fuel, DollarSign, X, CheckCircle2, Calendar 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { bookingApi } from '../../../services/bookingApi';
import { dealerApi } from '../../../services/dealerApi';
import Select from '../../../components/ui/select';


const DealerVehicleBooking = () => {
  const { orderId } = useParams() as { orderId: string };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitLoading, setSubmitLoading] = useState(false);

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
      newErrors['vehicles.chassisNo'] = 'Invalid Chassis (17 chars)';
    }
    if (!vehicle.engineNo?.trim()) {
      newErrors['vehicles.engineNo'] = 'Engine number is required';
    } else if (!/^[A-Z0-9]{10,12}$/i.test(vehicle.engineNo.trim())) {
      newErrors['vehicles.engineNo'] = 'Invalid format (10-12 alphanumeric, e.g. G3LCSM578833)';
    }

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
        status: 'Booked'
      });
      toast.success('Vehicle booked successfully');
      navigate(`/dealers/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputStyle = (field: string) => 
    `w-full bg-[#F8F9FB] dark:bg-gray-800 border ${errors[field] ? 'border-red-300' : 'border-[#F1F3F6]'} dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-[#4A5568] dark:text-gray-200 placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`;

  const labelStyle = 
    "flex items-center gap-2 text-[11px] font-bold text-[#8E99AF] dark:text-gray-400 uppercase tracking-wider mb-2";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-8 md:px-10 md:py-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Book Vehicle</h1>
          <p className="text-sm text-gray-500 mt-1">Assign dealer and unit details for slot #{srNoParam}</p>
        </div>

        <button
          onClick={() => navigate(`/dealers/orders/${orderId}`)}
          className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Order
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* BOOKING INFO SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Assignment Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Users size={14} className="text-indigo-500" /> Authorized Dealer
              </label>
              <Select
                value={selectedDealer}
                onChange={(e) => handleInputChange('dealerId', e.target.value)}
                className={inputStyle('dealerId')}
              >
                <option value="">Choose dealer...</option>
                {dealers.map(dealer => (
                  <option key={dealer._id} value={dealer._id}>{dealer.name}</option>
                ))}
              </Select>
              {errors.dealerId && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.dealerId}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Calendar size={14} className="text-blue-400" /> Booking Date
              </label>

              <input
                type="date"
                value={bookingDate}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={inputStyle('date')}
              />
              {errors.date && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors.date}</p>}
            </div>
          </div>
        </div>

        {/* VEHICLE IDENTIFIERS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Vehicle Identification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelStyle}>
                <Car size={14} className="text-indigo-500" /> Vehicle Model / variant Name
              </label>
              <input
                type="text"
                value={vehicles[0].vehicleName}
                onChange={(e) => handleInputChange('vehicles.vehicleName', e.target.value)}
                className={inputStyle('vehicles.vehicleName')}
                placeholder="e.g. Toyota LC300"
              />
              {errors['vehicles.vehicleName'] && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors['vehicles.vehicleName']}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <Hash size={14} className="text-emerald-500" /> HSN Code
              </label>
              <input
                type="text"
                value={vehicles[0].hsnCode}
                onChange={(e) => handleInputChange('vehicles.hsnCode', e.target.value)}
                className={inputStyle('vehicles.hsnCode')}
                placeholder="8703.23.01"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Example: 8703.23.01 (8-digit code)</p>
              {errors['vehicles.hsnCode'] && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors['vehicles.hsnCode']}</p>}
            </div>

            <div>
              <label className={labelStyle}>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: vehicles[0].exteriorColour.toLowerCase() || 'transparent' }}></div>
                Exterior Colour
              </label>
              <input
                type="text"
                value={vehicles[0].exteriorColour}
                onChange={(e) => handleInputChange('vehicles.exteriorColour', e.target.value)}
                className={inputStyle('vehicles.exteriorColour')}
                placeholder="Pearl White"
              />
              {errors['vehicles.exteriorColour'] && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors['vehicles.exteriorColour']}</p>}
            </div>

            <div>
              <label className={labelStyle}>Chassis Number</label>
              <input
                type="text"
                value={vehicles[0].chassisNo}
                onChange={(e) => handleInputChange('vehicles.chassisNo', e.target.value.toUpperCase())}
                className={`${inputStyle('vehicles.chassisNo')} font-mono tracking-wider`}
                placeholder="A1B2C3D4E5F6G7H8I"
                maxLength={17}
              />
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Example: JN1AAB300X0123456 (17 alphanumeric)</p>
              {errors['vehicles.chassisNo'] && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors['vehicles.chassisNo']}</p>}
            </div>

            <div>
              <label className={labelStyle}>Engine Number</label>
              <input
                type="text"
                value={vehicles[0].engineNo}
                onChange={(e) => handleInputChange('vehicles.engineNo', e.target.value.toUpperCase())}
                className={`${inputStyle('vehicles.engineNo')} font-mono tracking-wider`}
placeholder="G3LCSM578833"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Example: G3LCSM578833 (10-12 alphanumeric chars)</p>
              {errors['vehicles.engineNo'] && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{errors['vehicles.engineNo']}</p>}
            </div>
          </div>
        </div>

        {/* LOGISTICS & SPECS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800">
            <div className="h-5 w-1 bg-purple-500 rounded-full"></div>
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-200">Logistics & Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className={labelStyle}><Fuel size={14} className="text-blue-400" /> Fuel Type</label>
              <input
                type="text"
                value={vehicles[0].fuelType}
                onChange={(e) => handleInputChange('vehicles.fuelType', e.target.value)}
                className={inputStyle('')}
                placeholder="Petrol / Diesel"
              />
            </div>

            <div>
              <label className={labelStyle}><Globe size={14} className="text-emerald-500" /> Origin Country</label>
              <input
                type="text"
                value={vehicles[0].countryOfOrigin}
                onChange={(e) => handleInputChange('vehicles.countryOfOrigin', e.target.value)}
                className={inputStyle('')}
                placeholder="Japan"
              />
            </div>

            <div>
              <label className={labelStyle}><Package size={14} className="text-amber-500" /> Engine Capacity</label>
              <input
                type="text"
                value={vehicles[0].engineCapacity}
                onChange={(e) => handleInputChange('vehicles.engineCapacity', e.target.value)}
                className={inputStyle('')}
                placeholder="e.g. 1496cc"
              />
            </div>

            <div>
              <label className={labelStyle}><Calendar size={14} className="text-indigo-400" /> MFG Year (YOM)</label>
              <input
                type="number"
                value={vehicles[0].yom}
                onChange={(e) => handleInputChange('vehicles.yom', parseInt(e.target.value) || 0)}
                className={inputStyle('')}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}><DollarSign size={14} className="text-emerald-600" /> FOB Amount (USD)</label>
              <input
                type="number"
                value={vehicles[0].fobAmount || ''}
                onChange={(e) => handleInputChange('vehicles.fobAmount', parseFloat(e.target.value) || 0)}
                className={inputStyle('')}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelStyle}><DollarSign size={14} className="text-blue-600" /> Freight Charges (USD)</label>
              <input
                type="number"
                value={vehicles[0].freight || ''}
                onChange={(e) => handleInputChange('vehicles.freight', parseFloat(e.target.value) || 0)}
                className={inputStyle('')}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => navigate(`/dealers/orders/${orderId}`)}
            className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <X size={16} /> Discard
          </button>

          <button
            type="submit"
            disabled={submitLoading}
            className="cursor-pointer flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-[#5243EF] hover:bg-[#4335d6] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            ) : (
              <><CheckCircle2 size={18} /> Complete Unit Booking</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DealerVehicleBooking;