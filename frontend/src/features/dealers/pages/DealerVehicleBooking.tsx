import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, Car, AlertCircle } from 'lucide-react';
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
  const [vehicles, setVehicles] = useState<any[]>([
    {
      hsnCode: '',
      vehicleName: searchParams.get('name') || '',
      exteriorColour: searchParams.get('color') || '',
      chassisNo: '',
      engineNo: '',
      srNo: srNoParam,
      engineCapacity: '',
      fuelType: '',
      countryOfOrigin: '',
      yom: 2024,  // Default current year for easier testing
      fobAmount: 0,
      freight: 0,
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleName = searchParams.get('name') || '';
  const vehicleColor = searchParams.get('color') || '';
  const srNo = searchParams.get('srNo') || '';

  useEffect(() => {
    dealerApi.getAll().then((res) => {
      setDealers(res.data || []);
      // Auto-select first dealer for testing if none selected
      if (res.data?.length > 0 && !selectedDealer) {
        setSelectedDealer(res.data[0]._id);
      }
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
    // Clear error immediately
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, [vehicles]);

  // Validate single field on blur
  const validateField = (field: string) => {
    const vehicle = vehicles[0];
    switch (field) {
      case 'dealerId':
        if (!selectedDealer) setErrors(prev => ({...prev, dealerId: 'Dealer is required'}));
        break;
      case 'date':
        if (!bookingDate) setErrors(prev => ({...prev, date: 'Booking date is required'}));
        break;
      case 'vehicles.hsnCode':
        if (!vehicle.hsnCode?.trim()) setErrors(prev => ({...prev, [field]: 'HSN Code is required'}));
        break;
      case 'vehicles.vehicleName':
        if (!vehicle.vehicleName?.trim()) setErrors(prev => ({...prev, [field]: 'Vehicle name is required'}));
        break;
      case 'vehicles.exteriorColour':
        if (!vehicle.exteriorColour?.trim()) setErrors(prev => ({...prev, [field]: 'Color is required'}));
        break;
      case 'vehicles.chassisNo':
        if (!vehicle.chassisNo?.trim()) setErrors(prev => ({...prev, [field]: 'Chassis No is required (17 chars)'}));
        break;
      case 'vehicles.engineNo':
        if (!vehicle.engineNo?.trim()) setErrors(prev => ({...prev, [field]: 'Engine No is required'}));
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
    if (!vehicle.chassisNo?.trim()) newErrors['vehicles.chassisNo'] = 'Chassis No is required (17 chars)';
    if (!vehicle.engineNo?.trim()) newErrors['vehicles.engineNo'] = 'Engine No is required';
    if (vehicles.length !== 1) newErrors.vehicles = 'Only 1 vehicle per booking';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix errors and try again');
      return;
    }

    setSubmitLoading(true);
    try {
      await bookingApi.create({
        dealerId: selectedDealer,
        date: bookingDate,
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
      toast.success('✅ Single vehicle booking created!');
      navigate(`/dealers/orders/${orderId}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create booking';
      const code = error.response?.data?.code;
      if (code === 'VEHICLE_ALREADY_BOOKED') {
        toast.error(`⚠️ ${msg}`, { autoClose: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getColorGradient = (colorValue: string) => {
    const colorLower = colorValue.toLowerCase();
    const gradients: Record<string, string> = {
      black: 'from-gray-700 to-gray-900', 
      white: 'from-gray-300 to-gray-400',
      silver: 'from-gray-400 to-gray-500', 
      gray: 'from-gray-500 to-gray-600',
      red: 'from-red-500 to-red-600', 
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600', 
      yellow: 'from-yellow-500 to-yellow-600',
    };
    return gradients[colorLower] || 'from-slate-500 to-slate-600';
  };

  const ErrorMessage = ({ field }: { field: string }) => {
    const message = errors[field];
    if (!message) return null;
    return (
      <div className="mt-1 flex items-start gap-1 text-red-600 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  };

  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitLoading;  // Only disable on loading now

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 md:p-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            New Single Vehicle Booking
            <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-bold border">
              1 VEHICLE ONLY
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ek ek vehicle ki alag booking | Testing: Fill required fields marked <span className="text-red-500">*</span>
          </p>
        </div>
        <button onClick={() => navigate(`/dealers/orders/${orderId}`)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Test Data Note */}
      {true && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            🧪 Quick Test Data:
          </h3>
          <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
            <li>• Dealer: Any from dropdown</li>
            <li>• Date: Today</li>
            <li>• HSN: 8703239090</li>
            <li>• Chassis: KA1ABC123DEF45678</li>
            <li>• Engine: ABC12345678</li>
          </ul>
        </div>
      )}

      {/* Gradient Header */}
      <div className={'bg-gradient-to-r ' + getColorGradient(vehicleColor) + ' rounded-xl p-6 mb-8 h-24 flex items-center justify-between'}>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium text-white">Sr: {srNo}</span>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-white/50" style={{backgroundColor: vehicleColor.toLowerCase()}} />
          <div>
            <h2 className="text-xl font-bold text-white">{vehicleName}</h2>
            <p className="text-white/90 text-sm">{vehicleColor}</p>
          </div>
        </div>
        <Car className="w-12 h-12 text-white/80" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Details */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            Booking Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Dealer <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedDealer}
                onChange={(e) => handleInputChange('dealerId', e.target.value)}
                onBlur={() => validateField('dealerId')}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose dealer...</option>
                {dealers.map(dealer => (
                  <option key={dealer._id} value={dealer._id}>{dealer.name} ({dealer.contact})</option>
                ))}
              </Select>
              <ErrorMessage field="dealerId" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Booking Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => handleInputChange('date', e.target.value)}
                onBlur={() => validateField('date')}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
              />
              <ErrorMessage field="date" />
            </div>
          </div>
        </div>

        {/* Single Vehicle */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 md:p-8 border-2 border-emerald-200 dark:border-emerald-800">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
            <Car className="w-5 h-5 text-emerald-600" />
            Single Vehicle Details <span className="text-red-500 text-lg">*</span>
          </h2>
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4 font-medium">
            Only ONE vehicle per booking. Ek vehicle = ek booking.
          </p>
          
          <div className="max-h-[550px] overflow-y-auto pr-2 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input type="text" value={vehicles[0].hsnCode} onChange={(e)=>handleInputChange('vehicles.hsnCode',e.target.value)} onBlur={()=>validateField('vehicles.hsnCode')} placeholder="8703239090" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
                <ErrorMessage field="vehicles.hsnCode" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Vehicle Name <span className="text-red-500">*</span>
                </label>
                <input type="text" value={vehicles[0].vehicleName} onChange={(e)=>handleInputChange('vehicles.vehicleName',e.target.value)} onBlur={()=>validateField('vehicles.vehicleName')} placeholder="Toyota Corolla" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
                <ErrorMessage field="vehicles.vehicleName" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Exterior Colour <span className="text-red-500">*</span>
                </label>
                <input type="text" value={vehicles[0].exteriorColour} onChange={(e)=>handleInputChange('vehicles.exteriorColour',e.target.value)} onBlur={()=>validateField('vehicles.exteriorColour')} placeholder="White Pearl" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
                <ErrorMessage field="vehicles.exteriorColour" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Chassis No <span className="text-red-500">*</span>
                </label>
                <input type="text" value={vehicles[0].chassisNo} onChange={(e)=>handleInputChange('vehicles.chassisNo',e.target.value)} onBlur={()=>validateField('vehicles.chassisNo')} placeholder="KA1ABC123DEF45678" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
                <ErrorMessage field="vehicles.chassisNo" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Engine No <span className="text-red-500">*</span>
                </label>
                <input type="text" value={vehicles[0].engineNo} onChange={(e)=>handleInputChange('vehicles.engineNo',e.target.value)} onBlur={()=>validateField('vehicles.engineNo')} placeholder="ABC12345678" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
                <ErrorMessage field="vehicles.engineNo" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Sr No <span className="text-orange-500">*</span>
                </label>
                <input type="text" value={vehicles[0].srNo} onChange={(e)=>handleInputChange('vehicles.srNo',e.target.value)} placeholder="SR001" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-orange-400 transition-all" />
                <ErrorMessage field="vehicles.srNo" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Engine Capacity</label>
                <input type="text" value={vehicles[0].engineCapacity} onChange={(e)=>handleInputChange('vehicles.engineCapacity',e.target.value)} placeholder="1496cc" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Fuel Type</label>
                <input type="text" value={vehicles[0].fuelType} onChange={(e)=>handleInputChange('vehicles.fuelType',e.target.value)} placeholder="Petrol" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Country of Origin</label>
                <input type="text" value={vehicles[0].countryOfOrigin} onChange={(e)=>handleInputChange('vehicles.countryOfOrigin',e.target.value)} placeholder="Japan" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">YOM</label>
                <input type="number" value={vehicles[0].yom} onChange={(e)=>handleInputChange('vehicles.yom',parseInt(e.target.value)||0)} placeholder="2024" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">FOB Amount USD</label>
                <input type="number" value={vehicles[0].fobAmount} onChange={(e)=>handleInputChange('vehicles.fobAmount',parseFloat(e.target.value)||0)} placeholder="15000" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Freight USD</label>
                <input type="number" value={vehicles[0].freight} onChange={(e)=>handleInputChange('vehicles.freight',parseFloat(e.target.value)||0)} placeholder="1200" className="w-full p-2.5 text-sm border rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => navigate(`/dealers/orders/${orderId}`)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm shadow-sm transition-all">
            Cancel
          </button>
          <button
            type="submit"
            disabled={buttonDisabled}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 font-medium rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            {submitLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={18} />
                Create Booking
              </>
            )}
          </button>
        </div>
        {hasErrors && (
          <div className="text-center py-2 bg-yellow-50 dark:bg-yellow-900/20 border rounded text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Please fix {Object.keys(errors).length} error(s) above
          </div>
        )}
      </form>
    </div>
  );
};

export default DealerVehicleBooking;
