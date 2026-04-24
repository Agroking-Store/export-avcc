import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Hash,
  Palette,
  Package,
  Shapes,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  VehicleListItem,
  vehicleManagementApi,
} from "../vehicleManagementApi";

const VehicleItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleListItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setLoading(true);
        const data = await vehicleManagementApi.getVehicleById(id as string);
        setVehicle(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadVehicle();
  }, [id]);

  const InfoBox = ({ label, value, icon: Icon }: any) => (
    <div className="group bg-[#F8F9FB] border border-[#F1F3F6] rounded-xl p-4 transition-all duration-300 hover:bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-1">
      <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-wider mb-1 flex items-center gap-2 transition-colors group-hover:text-indigo-500">
        {Icon && <Icon size={12} />} {label}
      </p>
      <p className="text-sm font-semibold text-[#2D3748]">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
          Loading Vehicle...
        </span>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-[#1e293b] px-5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center group cursor-default">
          <span className="text-white text-base font-black tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
            VEH-{vehicle._id.slice(-4).toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => navigate("/vehicles/list")}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md active:scale-95"
        >
          <ArrowLeft size={18} />
          Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-50 pb-4">
              <ClipboardList size={18} className="text-gray-400" />
              <h2 className="text-lg font-bold text-[#1B2559]">Vehicle Information</h2>
            </div>

            <div className="space-y-6">
              <div className="group bg-[#F8F9FB] rounded-2xl p-6 flex items-center gap-6 border border-[#F1F3F6] transition-all duration-300 hover:shadow-inner">
                <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-2xl font-black border border-indigo-100 transition-transform group-hover:scale-105">
                  {vehicle.brandName.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8E99AF] uppercase tracking-widest mb-0.5">Vehicle</p>
                  <h3 className="text-2xl font-bold text-[#2D3748] group-hover:text-indigo-600 transition-colors">
                    {vehicle.brandName} {vehicle.modelName}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBox label="Brand Name" value={vehicle.brandName} icon={Shapes} />
                <InfoBox label="Model Name" value={vehicle.modelName} icon={Package} />
                <InfoBox label="Variant" value={vehicle.variant} icon={Hash} />
                <InfoBox label="Color" value={vehicle.color} icon={Palette} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">

        </div>
      </div>
    </div>
  );
};

export default VehicleItemDetails;
