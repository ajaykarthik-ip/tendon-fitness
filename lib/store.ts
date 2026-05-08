export interface Member {
  id: string;
  name: string;
  email?: string;
  phone: string;
  photo?: string;
  createdAt: string;
  membershipId: string;
  lastVisit: string;
  attendance: number;
  streak: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
}

export interface AutomationLog {
  id: string;
  type: "whatsapp" | "email" | "batch" | "system";
  title: string;
  subtitle: string;
  tag?: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: "expiring" | "expired" | "payment";
  memberId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  createdAt: string;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${url} failed: ${res.status}`);
  return res.json();
}

export const store = {
  getMembers: () => api<Member[]>("/api/members"),
  createMember: (data: Omit<Member, "id">) =>
    api<Member>("/api/members", { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: string, data: Partial<Member>) =>
    api<Member>(`/api/members/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMember: (id: string) => api(`/api/members/${id}`, { method: "DELETE" }),

  getPlans: () => api<Plan[]>("/api/plans"),
  createPlan: (data: Omit<Plan, "id">) =>
    api<Plan>("/api/plans", { method: "POST", body: JSON.stringify(data) }),
  updatePlan: (id: string, data: Partial<Plan>) =>
    api<Plan>(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePlan: (id: string) => api(`/api/plans/${id}`, { method: "DELETE" }),

  getMemberships: () => api<Membership[]>("/api/memberships"),
  createMembership: (data: Omit<Membership, "id">) =>
    api<Membership>("/api/memberships", { method: "POST", body: JSON.stringify(data) }),
  updateMembership: (id: string, data: Partial<Membership>) =>
    api<Membership>(`/api/memberships/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMembership: (id: string) => api(`/api/memberships/${id}`, { method: "DELETE" }),

  getAlerts: () => api<Alert[]>("/api/alerts"),
  updateAlert: (id: string, data: Partial<Alert>) =>
    api<Alert>(`/api/alerts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getAutomationLogs: () => api<AutomationLog[]>("/api/automation-logs"),
  createAutomationLog: (data: Omit<AutomationLog, "id">) =>
    api<AutomationLog>("/api/automation-logs", { method: "POST", body: JSON.stringify(data) }),

  getLeads: () => api<Lead[]>("/api/leads"),
  deleteLead: (id: string) => api(`/api/leads/${id}`, { method: "DELETE" }),
};

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function waUrl(phone: string, msg: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(msg)}`;
}

export function renewalWaUrl(phone: string, memberName: string, planName: string, endDate: string) {
  return waUrl(phone, `Hi ${memberName}! 👋 Your *${planName}* membership at Tendon Fitness expires on *${new Date(endDate).toLocaleDateString("en-IN")}*. Are you interested in renewing? Reply YES and we'll get it sorted for you. 💪`);
}

export function reactivationWaUrl(phone: string, memberName: string, planName: string) {
  return waUrl(phone, `Hi ${memberName}! We've missed you at Tendon Fitness. Your *${planName}* membership has expired — let's get you back on track. Reply here for a special reactivation offer. 💪`);
}

export function inviteWaUrl(phone: string, memberName: string) {
  return waUrl(phone, `Hi ${memberName}! 👋 Welcome to Tendon Fitness. We'd love to help you get started — reply here and we'll set you up. 💪`);
}

export function generateMembershipId(): string {
  return "TF-" + Math.floor(10000 + Math.random() * 90000);
}

export function formatLastVisit(lastVisit: string): string {
  if (!lastVisit) return "—";
  const d = new Date(lastVisit);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return `${diffDays} days ago`;
}

export function getMemberStatus(memberships: Membership[], memberId: string): "active" | "expiring" | "expired" | "none" {
  const ms = memberships.filter((m) => m.memberId === memberId);
  if (ms.length === 0) return "none";
  const latest = ms.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
  const today = new Date();
  const end = new Date(latest.endDate);
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 7) return "expiring";
  return "active";
}

export function getDaysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export function getMemberTier(member: Member): "platinum" | "elite" | "standard" {
  if (member.attendance >= 90 && member.streak >= 30) return "platinum";
  if (member.attendance >= 75 && member.streak >= 15) return "elite";
  return "standard";
}
