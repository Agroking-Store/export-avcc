import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../app/hooks";
import { register } from "../authSlice";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import { RegisterData } from "../../../types/auth.types";
import { User, Mail, Lock, Phone } from "lucide-react";

const RegisterForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<RegisterData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof RegisterData]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await dispatch(register(formData)).unwrap();
      const role = result?.user?.role?.toLowerCase() || "";
      const redirectPath = role === "sourcing_team" ? "/vehicles/dashboard" : "/dashboard";
      navigate(redirectPath);
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto space-y-3 mt-8 text-left"
    >
      <Input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Name"
        leftIcon={<User size={18} />}
        required
      />
      <Input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="Email"
        leftIcon={<Mail size={18} />}
        required
      />
      <Input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Password"
        leftIcon={<Lock size={18} />}
        required
      />
      <Input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        placeholder="Phone Number"
        leftIcon={<Phone size={18} />}
        required
      />

      <div className="pt-4 text-center">
        <Button type="submit" variant="teal" size="md" isLoading={loading}>
          SIGN UP
        </Button>
      </div>
    </form>
  );
};

export default RegisterForm;
