import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, Car } from 'lucide-react';
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

  const [vehicles, setVehicles] = useState<any[]>([
    {
      hsnCode: '',
      vehicleName: searchParams.get('name') || '',
      exteriorColour: searchParams.get('color') || '',
      chassisNo: '',
      engineNo: '',
      engineCapacity: '',
      fuelType: '',
      countryOfOrigin: '',
      yom: 0,
      fobAmount: 0,
      freight: 0,
    }
  ]);

  const vehicleName = searchParams.get('name') || '';
  const vehicleColor = searchParams.get('color') || '';
  const srNo = searchParams.get('srNo') || '';

  useEffect(() => {
    dealerApi.getAll().then((res) => {
      setDealers(res.data || []);
    }).catch(() => toast.error('Failed to load dealers'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer || !bookingDate || vehicles.some(v => !v.vehicleName || !v.chassisNo || !v.engineNo)) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitLoading(true);
    try {
      await bookingApi.create({
        dealerId: selectedDealer,
        date: bookingDate,
        vehicles: vehicles.map(v => ({
          hsnCode: v.hsnCode,
          name: v.vehicleName,
          color: v.exteriorColour,
          chassisNo: v.chassisNo,
          engineNo: v.engineNo,
          engineCapacity: v.engineCapacity,
          fuelType: v.fuelType,
          countryOfOrigin: v.countryOfOrigin,
          yom: v.yom,
          fobAmount: v.fobAmount,
          freight: v.freight,
          quantity: 1
        })),
        status: 'Draft'
      });
      toast.success('Booking created successfully!');
      navigate('/dealers/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 md:p-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            New Vehicle Booking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create booking for {vehicleName} ({vehicleColor})
          </p>
        </div>

        <button
          onClick={() => navigate(`/dealers/orders/${orderId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Order
        </button>
      </div>

      {/* Header Gradient Bar */}
      <div className={'bg-gradient-to-r ' + getColorGradient(vehicleColor) + ' rounded-xl p-6 mb-8 h-24 flex items-center justify-between'}>
        <div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium text-white">
            Sr: {srNo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-white/50" style={{backgroundColor: vehicleColor.toLowerCase()}} />
          <div>
            <h2 className="text-xl font-bold text-white">{vehicleName}</h2>
            <p className="text-white/90 text-sm">{vehicleColor}</p>
          </div>
        </div>
        <Car className="w-12 h-12 text-white/80" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dealer + Date Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            Booking Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dealer <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose dealer...</option>
                {dealers.map((dealer) => (
                  <option key={dealer._id} value={dealer._id}>
                    {dealer.name} ({dealer.contact})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Booking Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

          </div>
        </div>

        {/* Vehicle Details Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 md:p-8 border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-3">
            <Car className="w-5 h-5 text-green-600" />
            Vehicle Details <span className="text-red-500">*</span>
          </h2>
          
          <div className="max-h-[450px] overflow-y-auto pr-2 -mr-2 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HSN Code
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].hsnCode} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].hsnCode = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].vehicleName} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].vehicleName = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exterior Colour <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].exteriorColour} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].exteriorColour = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chassis No <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].chassisNo} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].chassisNo = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Engine No <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].engineNo} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].engineNo = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Engine Capacity
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].engineCapacity} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].engineCapacity = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fuel Type
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].fuelType} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].fuelType = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country of Origin
                </label>
                <input 
                  type="text" 
                  value={vehicles[0].countryOfOrigin} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].countryOfOrigin = e.target.value;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YOM
                </label>
                <input 
                  type="number" 
                  value={vehicles[0].yom} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].yom = parseInt(e.target.value) || 0;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  FOB Amount (USD)
                </label>
                <input 
                  type="number" 
                  value={vehicles[0].fobAmount} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].fobAmount = parseFloat(e.target.value) || 0;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Freight (USD)
                </label>
                <input 
                  type="number" 
                  value={vehicles[0].freight} 
                  onChange={(e) => {
                    const newVehicles = [...vehicles];
                    newVehicles[0].freight = parseFloat(e.target.value) || 0;
                    setVehicles(newVehicles);
                  }} 
                  className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate(`/dealers/orders/${orderId}`)}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm shadow-sm transition-all duration-200"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      </form>
    </div>
  );
};

export default DealerVehicleBooking;
