import { CreateCompanyForm, UpdateCompanyForm } from "./company.types";

export const validateCreateCompanyForm = (
  form: CreateCompanyForm
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = "Company name is required.";
  } else if (form.name.trim().length < 2) {
    errors.name = "Company name must be at least 2 characters long.";
  } else if (form.name.trim().length > 100) {
    errors.name = "Company name cannot exceed 100 characters.";
  }

  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = "Please provide a valid email address.";
  }

  if (form.phone && !/^[0-9]{10,15}$/.test(form.phone)) {
    errors.phone = "Phone number must be 10-15 digits.";
  }

  // Validate address fields if they exist
  if (form.address) {
    if (form.address.country && form.address.country.trim().length < 2) {
      errors.address_country =
        "Country name must be at least 2 characters long.";
    }
    if (form.address.state && form.address.state.trim().length < 2) {
      errors.address_state = "State name must be at least 2 characters long.";
    }
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

  let hasAtLeastOneField = false;

  if (form.name !== undefined) {
    hasAtLeastOneField = true;
    if (!form.name.trim()) {
      errors.name = "Company name cannot be empty.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Company name must be at least 2 characters long.";
    } else if (form.name.trim().length > 100) {
      errors.name = "Company name cannot exceed 100 characters.";
    }
  }

  if (form.email !== undefined) {
    hasAtLeastOneField = true;
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Please provide a valid email address.";
    }
  }

  if (form.phone !== undefined) {
    hasAtLeastOneField = true;
    if (form.phone && !/^[0-9]{10,15}$/.test(form.phone)) {
      errors.phone = "Phone number must be 10-15 digits.";
    }
  }

  // For update, at least one field should be provided, but we're not strictly enforcing that here
  // as the backend validation will catch an empty payload. Frontend focuses on format.

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
