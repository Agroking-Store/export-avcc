import { apiConfig } from "@/config/apiConfig";
import axios from "axios";
import { useEffect, useState } from "react";

export interface BookingVehicleRow {
    dealerName: string;
    date: string;
    status: "Draft" | "Booked";

    hsnCode: string;
    name: string;
    color: string;
    chassisNo: string;
    engineNo: string;
    quantity: number;
    srNo?: string;
    fobAmount?: number;
}

const BookingVehiclesTable = () => {

    const [data, setData] = useState<BookingVehicleRow[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${apiConfig.baseURL}/bookings/latestVehicles`
            );

            if (res.data.success) {
                setData(res.data.data); // already flattened from backend
            }

        } catch (error) {
            console.error("Error fetching bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <p>Loading bookings...</p>;
    if (!data.length) return <p>No bookings found</p>;

    return (
        <div className="bg-white rounded-xl shadow border">

            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Dealer Bookings</h2>
                <span className="text-sm text-gray-500">
                    Latest 5 Vehicles
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">

                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Dealer</th>
                            <th className="px-4 py-3">Vehicle</th>
                            <th className="px-4 py-3">Color</th>
                            <th className="px-4 py-3">Engine No</th>
                            <th className="px-4 py-3">Chassis No</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">FOB</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {data.map((v, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition">

                                <td className="px-4 py-3">
                                    {v.dealerName}
                                </td>

                                <td className="px-4 py-3 font-medium">
                                    {v.name}
                                </td>

                                <td className="px-4 py-3">
                                    {v.color}
                                </td>

                                <td className="px-4 py-3 text-blue-600">
                                    {v.engineNo}
                                </td>

                                <td className="px-4 py-3">
                                    {v.chassisNo}
                                </td>

                                <td className="px-4 py-3">
                                    {v.quantity}
                                </td>

                                <td className="px-4 py-3">
                                    {v.fobAmount}
                                </td>

                                <td className={`px-4 py-3 ${
                                    v.status === "Booked"
                                        ? "text-green-700"
                                        : "text-yellow-600"
                                }`}>
                                    {v.status}
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default BookingVehiclesTable;