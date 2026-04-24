export type UserRole =
  | "admin"
  | "manager"
  | "employee"
  | "sourcing_team"
  | "accountant"
  | "client"
  | "dealer";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}
