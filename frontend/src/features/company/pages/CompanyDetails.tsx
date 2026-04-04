import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import { toast } from "react-toastify";
import { ArrowLeft, Edit, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Company } from "../components/company.types";

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Company ID is missing.");
      setLoading(false);
      return;
    }

    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get<Company>(
          `${apiConfig.baseURL}/companies/${id}`,
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("token") ||
                localStorage.getItem("accessToken")
              }`,
            },
          }
        );
        setCompany(res.data);
      } catch (err: any) {
        console.error("Failed to fetch company details:", err);
        setError(
          err.response?.data?.message || "Failed to load company details."
        );
        toast.error(
          err.response?.data?.message || "Failed to load company details."
        );
        navigate("/companies"); // Redirect to list if company not found or error
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [id, navigate]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
        <div className="flex justify-center items-center py-32">
          <div className="flex flex-col items-center gap-4 bg-white/50 dark:bg-zinc-900/50 p-8 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-500 animate-spin" />
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Loading Company
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fetching company details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-4 md:p-6 lg:p-8 mx-auto text-gray-600">
        No company details found.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => navigate("/companies")}
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-blue-600" />
              {company.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Company ID:{" "}
              <span className="font-mono text-gray-700">
                {company.companyId}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(`/companies/edit/${company._id}`)}
            variant="outline"
            className="h-10 px-4"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Company
          </Button>
        </div>
      </div>

      {/* Company Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">
              {company.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">
              {company.phone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">GST Number</p>
            <p className="font-medium text-gray-900">
              {company.gstNumber || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">House/Building</p>
            <p className="font-medium text-gray-900">
              {company.address?.houseBuilding || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Street/Area</p>
            <p className="font-medium text-gray-900">
              {company.address?.streetArea || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">City/Town</p>
            <p className="font-medium text-gray-900">
              {company.address?.cityTown || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">State</p>
            <p className="font-medium text-gray-900">
              {company.address?.state || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pincode</p>
            <p className="font-medium text-gray-900">
              {company.address?.pincode || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Country</p>
            <p className="font-medium text-gray-900">
              {company.address?.country || "N/A"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium text-gray-900">
              {typeof company.address === "string"
                ? company.address
                : company.address
                ? [
                    company.address.houseBuilding,
                    company.address.streetArea,
                    company.address.cityTown,
                  ]
                    .filter(Boolean)
                    .join(", ") || "N/A"
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                company.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {company.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium text-gray-900">
              {formatDate(company.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium text-gray-900">
              {formatDate(company.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
