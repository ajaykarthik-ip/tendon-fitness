export const WHATSAPP_NUMBER = "919600309140";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  photo: string;
  membershipId: string;
  lastVisit: string;
  attendance: number;
  streak: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
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

const MALE_PHOTOS = [75, 45, 52, 68, 83, 33, 14, 7, 88, 1, 32, 13];
const FEMALE_PHOTOS = [44, 33, 62, 72, 5, 9, 25, 50, 83, 2, 75, 1];

let photoIndex = 0;
export function getRandomPhoto(gender: "men" | "women" = "men"): string {
  const pool = gender === "men" ? MALE_PHOTOS : FEMALE_PHOTOS;
  const num = pool[photoIndex % pool.length];
  photoIndex++;
  return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
}

export function generateMembershipId(): string {
  return "TF-" + Math.floor(10000 + Math.random() * 90000);
}

// Indian face photos from thispersondoesnotexist-style open sources
// Using randomuser.me Indian nationality portraits (nat=in query not available for static URLs,
// so we use hand-picked portrait numbers that show South-Asian faces)
export const DEFAULT_MEMBERS: Member[] = [
  { id: "1", name: "Dhanush", email: "dhanush@gmail.com", phone: "9876543210", createdAt: "2026-01-10", photo: "https://randomuser.me/api/portraits/men/76.jpg", membershipId: "TF-10021", lastVisit: "2026-04-28T06:30:00", attendance: 88, streak: 22 },
  { id: "2", name: "Yuvan", email: "yuvan@gmail.com", phone: "9876543211", createdAt: "2026-01-15", photo: "https://randomuser.me/api/portraits/men/10.jpg", membershipId: "TF-10022", lastVisit: "2026-04-27T18:45:00", attendance: 65, streak: 5 },
  { id: "3", name: "Trisha", email: "trisha@gmail.com", phone: "9876543212", createdAt: "2026-02-01", photo: "https://randomuser.me/api/portraits/women/26.jpg", membershipId: "TF-10023", lastVisit: "2026-04-28T08:15:00", attendance: 96, streak: 42 },
  { id: "4", name: "Kavin", email: "kavin@gmail.com", phone: "9876543213", createdAt: "2026-02-10", photo: "https://randomuser.me/api/portraits/men/36.jpg", membershipId: "TF-10024", lastVisit: "2026-04-14T07:00:00", attendance: 55, streak: 0 },
  { id: "5", name: "Nila", email: "nila@gmail.com", phone: "9876543214", createdAt: "2026-03-05", photo: "https://randomuser.me/api/portraits/women/56.jpg", membershipId: "TF-10025", lastVisit: "2026-04-28T07:45:00", attendance: 82, streak: 18 },
  { id: "6", name: "Ashwin", email: "ashwin@gmail.com", phone: "9876543215", createdAt: "2026-03-12", photo: "https://randomuser.me/api/portraits/men/56.jpg", membershipId: "TF-10026", lastVisit: "2026-04-26T10:30:00", attendance: 74, streak: 8 },
  { id: "7", name: "Dharshini", email: "dharshini@gmail.com", phone: "9876543216", createdAt: "2026-04-01", photo: "https://randomuser.me/api/portraits/women/76.jpg", membershipId: "TF-10027", lastVisit: "2026-04-28T09:00:00", attendance: 91, streak: 31 },
];

export const DEFAULT_PLANS: Plan[] = [
  { id: "1", name: "Monthly", price: 800, description: "1 month full access" },
  { id: "2", name: "Quarterly", price: 2100, description: "3 months full access" },
  { id: "3", name: "Half Yearly", price: 3800, description: "6 months full access" },
  { id: "4", name: "Annual", price: 6500, description: "12 months full access" },
];

export const DEFAULT_MEMBERSHIPS: Membership[] = [
  { id: "1", memberId: "1", planId: "2", startDate: "2026-03-01", endDate: "2026-05-31" },
  { id: "2", memberId: "2", planId: "1", startDate: "2026-04-01", endDate: "2026-04-30" },
  { id: "3", memberId: "3", planId: "3", startDate: "2026-02-01", endDate: "2026-07-31" },
  { id: "4", memberId: "4", planId: "1", startDate: "2026-03-15", endDate: "2026-04-14" },
  { id: "5", memberId: "5", planId: "4", startDate: "2026-01-01", endDate: "2026-12-31" },
  { id: "6", memberId: "6", planId: "2", startDate: "2026-04-10", endDate: "2026-07-09" },
];

const DEFAULT_AUTOMATION_LOGS: AutomationLog[] = [
  { id: "1", type: "whatsapp", title: "Reminder sent to Yuvan", subtitle: "Membership expiry nudge [Level: High]", tag: "VIEW MESSAGE", timestamp: "2026-04-28T08:00:00" },
  { id: "2", type: "email", title: "Email sent to Dhanush (Receipt)", subtitle: "Monthly subscription invoice - TXN.882910", tag: "PDF ATTACHED", timestamp: "2026-04-28T07:30:00" },
  { id: "3", type: "batch", title: "Batch Process: 12 reminders sent", subtitle: "Daily morning motivation broadcast to 'Early Bird' segment", tag: "100% DELIVERY RATE", timestamp: "2026-04-28T06:00:00" },
  { id: "4", type: "system", title: "System Health Check: OK", subtitle: "All automation nodes performing within 50ms latency parameters.", timestamp: "2026-04-28T05:45:00" },
];

const DEFAULT_ALERTS: Alert[] = [
  { id: "1", type: "expiring", memberId: "2", message: "Yuvan's Monthly plan expires in 2 days", read: false, createdAt: "2026-04-28T09:00:00" },
  { id: "2", type: "expired", memberId: "4", message: "Kavin's Monthly plan expired 14 days ago. Send a reactivation offer.", read: false, createdAt: "2026-04-28T09:00:00" },
  { id: "3", type: "expiring", memberId: "1", message: "Dhanush's Quarterly plan expires in 33 days", read: true, createdAt: "2026-04-27T09:00:00" },
];

const DEFAULT_LEADS: Lead[] = [
  { id: "1", name: "Ranjith Kumar", phone: "9876501234", source: "WhatsApp Outreach", createdAt: "2026-04-28T10:00:00" },
  { id: "2", name: "Meena Krishnan", phone: "9876502345", source: "Referral", createdAt: "2026-04-27T15:30:00" },
  { id: "3", name: "Surya Prakash", phone: "9876503456", source: "Walk-in", createdAt: "2026-04-27T11:00:00" },
  { id: "4", name: "Divya Nair", phone: "9876504567", source: "WhatsApp Outreach", createdAt: "2026-04-26T16:00:00" },
  { id: "5", name: "Vikram Anand", phone: "9876505678", source: "Instagram", createdAt: "2026-04-26T09:30:00" },
  { id: "6", name: "Preethi Raj", phone: "9876506789", source: "WhatsApp Outreach", createdAt: "2026-04-25T14:00:00" },
];

const DATA_VERSION = "v3";

function initStore() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("gym_version") !== DATA_VERSION) {
    localStorage.removeItem("gym_members");
    localStorage.removeItem("gym_plans");
    localStorage.removeItem("gym_memberships");
    localStorage.removeItem("gym_automation_logs");
    localStorage.removeItem("gym_alerts");
    localStorage.removeItem("gym_leads");
    localStorage.setItem("gym_version", DATA_VERSION);
  }
}

function getOrInit<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  initStore();
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  getMembers: () => getOrInit<Member>("gym_members", DEFAULT_MEMBERS),
  saveMembers: (data: Member[]) => save("gym_members", data),

  getPlans: () => getOrInit<Plan>("gym_plans", DEFAULT_PLANS),
  savePlans: (data: Plan[]) => save("gym_plans", data),

  getMemberships: () => getOrInit<Membership>("gym_memberships", DEFAULT_MEMBERSHIPS),
  saveMemberships: (data: Membership[]) => save("gym_memberships", data),

  getAutomationLogs: () => getOrInit<AutomationLog>("gym_automation_logs", DEFAULT_AUTOMATION_LOGS),
  saveAutomationLogs: (data: AutomationLog[]) => save("gym_automation_logs", data),

  getAlerts: () => getOrInit<Alert>("gym_alerts", DEFAULT_ALERTS),
  saveAlerts: (data: Alert[]) => save("gym_alerts", data),

  getLeads: () => getOrInit<Lead>("gym_leads", DEFAULT_LEADS),
  saveLeads: (data: Lead[]) => save("gym_leads", data),
};

function waUrl(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function renewalWaUrl(memberName: string, planName: string, endDate: string) {
  const msg = `Hi! Sending renewal reminder for *${memberName}* — their *${planName}* membership expires on *${new Date(endDate).toLocaleDateString("en-IN")}*. Please renew to keep their streak going! 💪`;
  return waUrl(msg);
}

export function reactivationWaUrl(memberName: string, planName: string) {
  const msg = `Hi! *${memberName}*'s *${planName}* membership has expired. Time to bring them back! Send a reactivation offer. 💪`;
  return waUrl(msg);
}

export function inviteWaUrl(memberName: string) {
  const msg = `Hi! *${memberName}* is interested in joining Tendon Fitness. Please reach out to get them started! 💪`;
  return waUrl(msg);
}

export function formatLastVisit(lastVisit: string): string {
  const d = new Date(lastVisit);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday`;
  } else {
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
  }
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
