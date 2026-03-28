import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, TrendingUp, CheckCircle, Clock, MoreHorizontal, Plus } from "lucide-react";
import DealerNav from "../components/DealerNav";

const DealersDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [totalDealers, setTotalDealers] = useState(0);
  const [recentDealers, setRecentDealers] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/v1/dealers?limit=5&page=1")
      .then(res => {
        setTotalDealers(res.data.total || res.data.data.length);
        setRecentDealers(res.data.data);
      })
      .catch(console.error);
  }, []);

  const stats = [
    { title: "Total Dealers", value: `${totalDealers}`, sub: "Registered", icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { title: "Active Dealers", value: `${totalDealers}`, sub: "Currently Active", icon: <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { title: "Verified", value: "With GST", sub: "GST Registered", icon: <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
    { title: "Recent", value: "This Month", sub: "Newly Added", icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
  ];

  return (
  
<div className="font-sans text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <DealerNav />

      {/* Header */}
      <section className="py-6 mb-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </span>
            Dealers Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dealers/orders/add")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
            <button
              onClick={() => navigate("/dealers/add")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Add Dealer
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-9 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Overview</h2>
              <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-0.5">{item.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Recent Dealers</span>
                <button
                  onClick={() => navigate("/dealers")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="font-medium p-4 pl-6">Name</th>
                      <th className="font-medium p-4">Contact</th>
                      <th className="font-medium p-4">Email</th>
                      <th className="font-medium p-4">GST Number</th>
                      <th className="font-medium p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentDealers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">No dealers found</td>
                      </tr>
                    ) : (
                      recentDealers.map((dealer) => (
                        <tr
                          key={dealer._id}
                          onClick={() => navigate(`/dealers/${dealer._id}`)}
                          className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/30 dark:hover:bg-gray-800/60 cursor-pointer transition-all duration-200"
                        >
                          <td className="p-4 pl-6 flex items-center gap-3 font-medium">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                              {dealer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{dealer.name}</span>
                          </td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">{dealer.contact}</td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">{dealer.email || "-"}</td>
                          <td className="p-4 text-gray-500 dark:text-gray-400">{dealer.gstNumber || "-"}</td>
                          <td className="p-4 text-right">
                            <MoreHorizontal className="w-5 h-5 text-gray-400 inline-block" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8 sticky top-8">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Dealer Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Quick overview</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Registered</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalDealers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                <span className="font-bold text-green-600 dark:text-green-400">{totalDealers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-400">Shown</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{recentDealers.length}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/dealers/add")}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Add New Dealer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealersDashboard;