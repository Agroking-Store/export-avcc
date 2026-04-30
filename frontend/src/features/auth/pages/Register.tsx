// import React from "react";
// import { Link, Navigate } from "react-router-dom";
// import { useAuth } from "../../../hooks/useAuth";
// import RegisterForm from "../components/RegisterForm";
// import { Car } from "lucide-react";

// const Register: React.FC = () => {
//   const { isAuthenticated } = useAuth();

//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-200">
//       <div className="max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
//         {/* Left Side - Teal Panel */}
//         <div className="md:w-2/5 bg-[#38b2ac] text-white p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
//           <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-white opacity-10 rounded-full"></div>
//           <div className="absolute bottom-[-80px] right-[-20px] w-64 h-64 bg-white opacity-10 rounded-full"></div>

//           <div className="relative z-10 flex flex-col items-center">
//             <div className="flex items-center gap-2 mb-12 self-start">
//               <Car className="w-6 h-6" />
//               <span className="font-bold tracking-wider text-sm uppercase">
//                 Vehicle Export
//               </span>
//             </div>

//             <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
//             <p className="mb-10 text-teal-50">
//               To keep connected with us please login with your personal info
//             </p>

//             <Link to="/login">
//               <button className="px-12 py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-[#38b2ac] transition-colors">
//                 SIGN IN
//               </button>
//             </Link>
//           </div>
//         </div>

//         {/* Right Side - Form Panel */}
//         <div className="md:w-3/5 p-12 flex flex-col justify-center items-center relative">
//           <h2 className="text-3xl font-bold text-[#38b2ac] mb-6">
//             Create Account
//           </h2>

//           <RegisterForm />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;
