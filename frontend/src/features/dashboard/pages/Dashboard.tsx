import React from "react";
import {
  Folder,
  FileText,
  Car,
  MoreHorizontal,
  Plus,
  CheckCircle,
  Truck,
  Pencil,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const quickAccess = [
    {
      title: "Total Vehicles",
      value: "124 Vehicles",
      size: "In Stock",
      icon: <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Pending PI",
      value: "18 Documents",
      size: "Requires Action",
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "In Transit",
      value: "32 Vehicles",
      size: "Shipping",
      icon: <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Delivered",
      value: "74 Vehicles",
      size: "Completed",
      icon: (
        <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      ),
    },
  ];

  const activeShipments = [
    {
      id: 1,
      name: "Maruti Swift - CH123456",
      client: "Public",
      size: "4.5 MB",
      date: "Apr 10, 2024",
      type: "Docs",
    },
    {
      id: 2,
      name: "Toyota Innova - CH789012",
      client: "Public",
      size: "2.5 MB",
      date: "Apr 2, 2024",
      type: "Fonts",
    },
    {
      id: 3,
      name: "Proforma Invoice #1234",
      client: "Private (+4)",
      size: "1.2 MB",
      date: "Yesterday",
      type: "Source",
      isActive: true,
    },
    {
      id: 4,
      name: "Letter of Credit #5678",
      client: "Private",
      size: "12.2 MB",
      date: "Yesterday",
      type: "Example",
    },
  ];

  const timelineActivity = [
    {
      date: "Yesterday",
      activities: [
        { text: "You shared edit access to", target: "Client ABC", img: "C" },
        { text: "You uploaded document", target: "PI_1234.pdf", img: "P" },
      ],
    },
    {
      date: "Apr 1, 2024",
      activities: [
        { text: "You changed status to", target: "In Transit", img: "T" },
      ],
    },
  ];

  return (
    <div className="font-sans animate-fade-in text-gray-800 dark:text-gray-200 transition-colors duration-200 min-h-screen p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Section 1: Sidebar & Header */}
      <section className="py-6 px-4 lg:px-0 mb-10 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </span>
              Vehicle Export
            </h1>
            <div className="hidden md:flex gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <span className="text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 cursor-pointer">
                Dashboard
              </span>
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                Activity
              </span>
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer">
                Calendar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sections 2,3,4: Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 space-y-10 lg:space-y-12">
        {/* Left: Quick Access Cards & Main Table */}
        <div className="xl:col-span-9 space-y-10 lg:space-y-12">
          
          {/* Section 2: Quick Access Cards */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Quick Access
              </h2>
              <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {quickAccess.map((item, idx) => (
                <div
                  key={idx}
                  className="group bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-900"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-0.5 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.size}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Main Table (Active Shipments) */}
          <section className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-gray-200">Home</span>
                  <span>›</span>
                  <span>Active Shipments</span>
                </div>
                <button className="mt-2 sm:mt-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.05] active:scale-[0.95] transition-all duration-200">
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                      <th className="font-medium p-4 pl-6">Name</th>
                      <th className="font-medium p-4">Sharing</th>
                      <th className="font-medium p-4">Size</th>
                      <th className="font-medium p-4">Modified</th>
                      <th className="font-medium p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {activeShipments.map((item) => (
                      <tr
                        key={item.id}
                        className={`group/row border-b border-gray-50/50 dark:border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/30 dark:hover:from-gray-800/60 dark:hover:to-gray-800/30 hover:shadow-sm transition-all duration-200 cursor-pointer rounded-xl mx-2 my-1 ${item.isActive ? "bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-md ring-1 ring-blue-100/50 dark:ring-blue-900/50" : ""}`}
                      >
                        <td className="p-6 pl-8 group-hover/row:text-gray-900 dark:group-hover/row:text-gray-100 flex items-center gap-4 font-medium">
                          <Folder
                            className={`w-6 h-6 shrink-0 transition-transform group-hover/row:scale-110 ${item.isActive ? "text-blue-600 dark:text-blue-400" : "text-blue-500 dark:text-blue-300"}`}
                            fill="currentColor"
                          />
                          <span
                            className={`font-semibold transition-colors group-hover/row:text-gray-900 dark:group-hover/row:text-gray-100 ${item.isActive ? "text-blue-900 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"}`}
                          >
                            {item.name}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">
                          {item.client}
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">
                          {item.size}
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400">
                          {item.date}
                        </td>
                        <td className="p-4 text-right">
                          <MoreHorizontal className="w-5 h-5 text-gray-400 inline-block hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Section 4: Right Side Panel (Source Details) */}
        <div className="xl:col-span-3">
          <section className="group bg-gradient-to-br from-white via-white/90 to-gray-50/50 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-800/70 rounded-3xl border border-gray-100/50 dark:border-slate-800/50 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 flex flex-col h-fit sticky top-8 self-start backdrop-blur-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Folder
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                />
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                ×
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Source Details
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              1.2 MB • Yesterday • 1 Item
            </p>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  Tags
                </span>
                <span className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-full text-blue-700 dark:text-blue-400 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.05]">
                  <Pencil className="w-3 h-3" /> Edit
                </span>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                  Work
                </span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                  Source
                </span>
              </div>
            </div>

            <div className="flex border-b border-gray-200/50 dark:border-slate-700/50 mb-8 gap-8 text-sm">
              <span className="group/tab flex-1 py-3 px-4 rounded-t-xl bg-gradient-to-r from-blue-500/10 to-blue-600/20 border-b-2 border-blue-500 text-blue-700 dark:text-blue-400 dark:from-blue-950/40 dark:to-blue-900/50 dark:border-blue-400 font-semibold cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 text-center">
                Activity
              </span>
              <span className="group/tab flex-1 py-3 px-4 rounded-t-xl bg-gray-100/50 dark:bg-slate-800/50 hover:bg-gray-200/70 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 text-center">
                Comments
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {timelineActivity.map((group, idx) => (
                <div key={idx} className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {group.date}
                    </span>
                  </div>
                  <div className="space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800 ml-1">
                    {group.activities.map((activity, actIdx) => (
                      <div key={actIdx} className="relative pl-4">
                        <div className="absolute -left-[21px] top-1 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                          {activity.img}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.text}{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {activity.target}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

