// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Plus } from "lucide-react";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import PIDashboard from "./PIDashboard";
// import PITablePage from "./PITablePage";
// import OrderPITablePage from "./OrderPITablePage";

// const generatePagination = (currentPage: number, totalPages: number) => {
//   if (totalPages <= 7) {
//     return Array.from({ length: totalPages }, (_, i) => i + 1);
//   }
//   if (currentPage <= 3) {
//     return [1, 2, 3, 4, "...", totalPages];
//   }
//   if (currentPage >= totalPages - 2) {
//     return [
//       1,
//       "...",
//       totalPages - 3,
//       totalPages - 2,
//       totalPages - 1,
//       totalPages,
//     ];
//   }
//   return [
//     1,
//     "...",
//     currentPage - 1,
//     currentPage,
//     currentPage + 1,
//     "...",
//     totalPages,
//   ];
// };

// const PIList = () => {
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'pi', or 'order'

//   return (
//     <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
//       {/* HEADER */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
//           Proforma Invoices
//         </h1>
//         <Button
//           onClick={() => navigate("/proforma-invoice/add")}
//           className="h-12 px-6 py-3 shrink-0 rounded-lg shadow-md bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold tracking-wide hover:from-blue-700 hover:to-blue-800 transition-all duration-300 ease-in-out flex items-center justify-center"
//         >
//           <Plus className="h-5 w-5 mr-2" />
//           <span>Create PI</span>
//         </Button>
//       </div>

//       {/* PREMIUM KPI CARDS */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
//         <TabsList className="grid w-full lg:w-fit grid-cols-3 h-10 mb-4">
//           <TabsTrigger value="dashboard" className="text-base">
//             Dashboard
//           </TabsTrigger>
//           <TabsTrigger value="pi" className="text-base">
//             PI Perspective
//           </TabsTrigger>
//           <TabsTrigger value="order" className="text-base">
//             Order Perspective
//           </TabsTrigger>
//         </TabsList>
//         <TabsContent value="dashboard" className="mt-0">
//           <PIDashboard />
//         </TabsContent>
//         <TabsContent value="pi" className="mt-0">
//           <PITablePage generatePagination={generatePagination} />
//         </TabsContent>
//         <TabsContent value="order" className="mt-0">
//           <OrderPITablePage generatePagination={generatePagination} />
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };

// export default PIList;
