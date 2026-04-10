
import { vehicleApi } from "../../../services/vehicleApi";
import { useEffect, useState } from "react";
export interface Client {
    name: string;
    color: string;
    engineNo: string;
    chassisNo: string;
    status: 'Available' | 'Booked';
}
const VehiclesTable = () => {

    const [vehicle, setVehicle] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchVehicle = async () => {
        try {
            setLoading(true);

            const res = await vehicleApi.getLatestVehicles()

            if (res.success) {
                setVehicle(res.data!);
                console.log(vehicle)
            }
        } catch (error) {
            console.error("Error fetching vehicle", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVehicle();
    }, []);
    if (loading) return <p>Loading vehicle...</p>;
    if (vehicle.length === 0 || vehicle === undefined) return <p>No vehicle found</p>;

    return <>
        <div className="bg-white rounded-xl shadow border">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Clients</h2>
                <span className="text-sm text-gray-500">
                    Total: {vehicle.length}
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Engine No.</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Color</th>
                            <th className="px-4 py-3">Chassis No.</th>
                            <th className="px-4 py-3">status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {vehicle.map((Vehicle) => (
                            <tr
                                key={Vehicle.engineNo}
                                className="hover:bg-gray-50 transition"
                            >
                                <td className="px-4 py-3 text-blue-600">{Vehicle.engineNo}</td>
                                <td className="px-4 py-3">{Vehicle.name}</td>
                                <td className="px-4 py-3">{Vehicle.color}</td>
                                <td className="px-4 py-3 ">{Vehicle.chassisNo}</td>
                                <td className={`px-4 py-3 ${Vehicle.status === "Available" ? "text-green-800" : "text-blue-800"}`}>{Vehicle.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </>
};


export default VehiclesTable;