import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserPlus,
  Eye,
  ArrowUpRight,
  Globe,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { companyApi } from "../components/companyApi";
import { Company } from "../components/company.types";
import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [piStats, setPiStats] = useState<any[]>([]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await companyApi.getCompanies(
  "",
  1,
  1000,
  "createdAt",
  "desc",
  "all"
);

setCompanies(res.data || []);

/* PI FETCH START */
const piRes = await axios.get(
  `${apiConfig.baseURL}/proforma-invoices`,
  {
    params: {
      page: 1,
      limit: 1000,
    },
  }
);

console.log("PI RESPONSE:", piRes.data);

const piRows = piRes.data?.data || [];

const companyMap: Record<string, number> = {};

piRows.forEach((item: any) => {
  const companyName =
    item.company_id?.name ||
    item.companySnapshot?.name ||
    "Unknown";

  if (!companyMap[companyName]) {
    companyMap[companyName] = 0;
  }

  companyMap[companyName]++;
});

const topCompanies = Object.entries(companyMap)
  .map(([name, count]) => ({
    name,
    count,
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

setPiStats(topCompanies);
/* PI FETCH END */
    } catch (error) {
      toast.error("Failed to load company dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalCompanies = companies.length;

    const activeCompanies = companies.filter(
      (c) => c.isActive
    ).length;

    const inactiveCompanies = companies.filter(
      (c) => !c.isActive
    ).length;

    const thisMonthCompanies = companies.filter(
      (c) => {
        if (!c.createdAt) return false;

        const d = new Date(c.createdAt);
        const now = new Date();

        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
    ).length;

    const countries = new Set(
      companies
        .map((c) => c.address?.country)
        .filter(Boolean)
    ).size;

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      thisMonthCompanies,
      countries,
    };
  }, [companies]);

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt || ""
          ).getTime() -
          new Date(
            a.createdAt || ""
          ).getTime()
      )
      .slice(0, 5);
  }, [companies]);

  const topCountries = useMemo(() => {
    const map: any = {};

    companies.forEach((company) => {
      const country =
        company.address?.country || "Unknown";

      if (!map[country]) map[country] = 0;

      map[country] += 1;
    });

    return Object.entries(map)
      .map(([country, count]) => ({
        country,
        count,
      }))
      .sort(
        (a: any, b: any) =>
          b.count - a.count
      )
      .slice(0, 5);
  }, [companies]);

  if (loading) {
    return (
      <div className="w-full p-8 space-y-8">
        <div className="rounded-3xl bg-white border p-6 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded mb-3"></div>
          <div className="h-4 w-80 bg-slate-100 rounded"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(
            (item) => (
              <div
                key={item}
                className="rounded-2xl bg-white border p-6 animate-pulse"
              >
                <div className="h-10 w-10 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-3 w-24 bg-slate-100 rounded mb-3"></div>
                <div className="h-8 w-16 bg-slate-200 rounded"></div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Companies Dashboard
        </h1>

        <p className="text-[15px] text-slate-500 font-medium mt-1">
          Manage company profiles and business records efficiently.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          icon={<Building2 size={20} />}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active"
          value={stats.activeCompanies}
          icon={<CheckCircle2 size={20} />}
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive"
          value={stats.inactiveCompanies}
          icon={<XCircle size={20} />}
          color="bg-rose-50 text-rose-600"
        />

        <StatCard
          title="This Month"
          value={stats.thisMonthCompanies}
          icon={<TrendingUp size={20} />}
          color="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Countries"
          value={stats.countries}
          icon={<Globe size={20} />}
          color="bg-cyan-50 text-cyan-600"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Add Company"
          subtitle="Create new company profile"
          icon={<UserPlus size={20} />}
          onClick={() =>
            navigate("/companies/add")
          }
        />
      </div>

      {/* DATA SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* TOP COUNTRIES */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Building2
                size={18}
                className="text-slate-500"
              />
            </div>
        
            <h2 className="font-bold text-slate-800 text-lg">
              Top Companies
            </h2>
          </div>
        
          <div className="space-y-4">
            {piStats.length === 0 ? (
              <Empty text="No PI created yet" />
            ) : (
              piStats.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 px-5 py-4 hover:border-blue-100 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {item.name}
                    </p>
        
                    <p className="text-xs text-slate-400 mt-0.5">
                      Export Company
                    </p>
                  </div>
        
                  <span className="px-4 py-1.5 rounded-xl bg-white text-sm font-bold text-blue-600 shadow-sm">
                    {item.count} PI
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT COMPANIES */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Clock3
                size={18}
                className="text-slate-500"
              />
            </div>

            <h2 className="font-bold text-slate-800 text-lg">
              Recent Companies
            </h2>
          </div>

          {recentCompanies.length === 0 ? (
            <Empty text="No recent companies found" />
          ) : (
            <div className="space-y-4">
              {recentCompanies.map(
                (company, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/30 px-5 py-4 hover:border-blue-100 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {
                          company.name
                        }
                      </p>

                      <p className="text-xs text-slate-400 mt-0.5">
                        {
                          company.companyId
                        }
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <StatusBadge
                        active={
                          company.isActive
                        }
                      />

                      <p className="text-xs text-slate-400">
                        {company.createdAt
                          ? new Date(
                              company.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: any) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}
    >
      {icon}
    </div>

    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
      {title}
    </p>

    <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">
      {value}
    </h3>
  </div>
);

const ActionCard = ({
  title,
  subtitle,
  icon,
  onClick,
}: any) => (
  <button
    onClick={onClick}
    className="cursor-pointer group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all text-left"
  >
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>

      <ArrowUpRight
        size={20}
        className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
      />
    </div>

    <div className="mt-4 relative z-10">
      <h3 className="font-bold text-slate-800 text-lg">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>
  </button>
);

const StatusBadge = ({
  active,
}: {
  active: boolean;
}) => (
  <span
    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
      active
        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
        : "bg-rose-50 text-rose-600 border border-rose-100"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const Empty = ({
  text,
}: {
  text: string;
}) => (
  <div className="rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-400">
    {text}
  </div>
);

export default CompanyDashboard;