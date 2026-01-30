export type Stage =
  | "lead"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "lost"
  | "won";

export interface Client {
  id: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  deal_value: number;
  stage: Stage;
  userId?: string;
  creator_name?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
}

export interface StageConfig {
  id: Stage;
  label: string;
  color: string;
}

export const STAGES: StageConfig[] = [
  { id: "lead", label: "Lead", color: "bg-[#455A73]" },
  { id: "contacted", label: "Contacted", color: "bg-[#3B82F6]" },
  { id: "qualified", label: "Qualified", color: "bg-[#C15BFF]" },
  { id: "proposal", label: "Proposal Sent", color: "bg-[#F58C00]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[#E67C0A]" },
  { id: "won", label: "Won", color: "bg-[#16A142]" },
  { id: "lost", label: "Lost", color: "bg-[#F23346]" },
];
