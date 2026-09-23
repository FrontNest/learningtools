export type Role = "REQUESTER" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  department: string | null;
  jobTitle: string | null;
  role: Role;
  isMaster: boolean;
  teamId: string | null;
  mustChangePassword: boolean;
  active: boolean;
}
