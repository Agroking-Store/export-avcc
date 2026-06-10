import { CreateCompanyForm, UpdateCompanyForm } from "./company.types";

export const validateCreateCompanyForm = (
  form: CreateCompanyForm
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Please add company name.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Company name must be at least 2 characters.";
  } else if (form.name.trim().length > 100) {
    errors.name = "Company name cannot exceed 100 characters.";
  }

  if (!form.phone?.trim()) {
    errors.phone = "Please add contact no.";
  } else if (!/^[0-9]{10,15}$/.test(form.phone.trim())) {
    errors.phone = "Contact no must be 10-15 digits.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateUpdateCompanyForm = (
  form: UpdateCompanyForm
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (form.name !== undefined) {
    if (!form.name.trim()) {
      errors.name = "Please add company name.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Company name must be at least 2 characters.";
    } else if (form.name.trim().length > 100) {
      errors.name = "Company name cannot exceed 100 characters.";
    }
  }

  if (form.phone !== undefined) {
    if (!form.phone.trim()) {
      errors.phone = "Please add contact no.";
    } else if (!/^[0-9]{10,15}$/.test(form.phone.trim())) {
      errors.phone = "Contact no must be 10-15 digits.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
