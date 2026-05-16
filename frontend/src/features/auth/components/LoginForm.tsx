import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../app/hooks";
import { login } from "../authSlice";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { LoginCredentials } from "../../../types/auth.types";
import { Mail, Lock } from "lucide-react";

const LoginForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await dispatch(login(formData)).unwrap();
      const role = result?.user?.role?.toLowerCase();
      if (role === "accountant") navigate("/proforma-invoice/dashboard");
      else if (role === "sourcing_team") navigate("/vehicles/dashboard");
      else if (role === "client") navigate("/vehicles/orders");
      else navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 text-center font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">
            Email Address
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@gmail.com"
            leftIcon={<Mail size={18} className="text-gray-400" />}
            className="rounded-xl border-gray-200 focus:border-teal-500 transition-all"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">
            Password
          </label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            leftIcon={<Lock size={18} className="text-gray-400" />}
            className="rounded-xl border-gray-200 focus:border-teal-500 transition-all"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <a
          href="#"
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          {/* Forgot password? */}
        </a>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="teal"
          className="w-full py-3 rounded-xl shadow-lg shadow-teal-200 font-bold tracking-wide hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
          isLoading={loading}
        >
          SIGN IN
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
