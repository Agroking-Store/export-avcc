export type UserRole =
  | "admin"
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
