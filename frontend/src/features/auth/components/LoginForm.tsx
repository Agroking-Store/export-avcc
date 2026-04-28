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
      
      if (role === "accountant") {
        navigate("/proforma-invoice/dashboard");
      } else if (role === "sourcing_team") {
        navigate("/vehicles/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto space-y-3 mt-8 text-center"
    >
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <Input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        leftIcon={<Mail size={18} />}
        required
      />

      <Input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
        leftIcon={<Lock size={18} />}
        required
      />

      <div className="flex justify-center text-sm mb-4 mt-2">
        <a href="#" className="text-gray-500 hover:text-[#38b2ac]">
          Forgot your password?
        </a>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="teal" size="md" isLoading={loading}>
          SIGN IN
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
