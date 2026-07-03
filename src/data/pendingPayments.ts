// In-memory pending payment store (shared between server & bot)
export interface PendingPayment {
  id: string;
  email: string;
  displayName: string;
  tier: "Berbayar";
  billingCycle: "Bulanan" | "Tahunan";
  amount: number;
  method: string;
  createdAt: string;
  confirmed: boolean;
  confirmedAt?: string;
}

// Shared memory store — survives within server process
export const pendingPayments: PendingPayment[] = [];

export function addPendingPayment(p: Omit<PendingPayment, "id" | "confirmed" | "createdAt">): PendingPayment {
  const payment: PendingPayment = {
    ...p,
    id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    confirmed: false,
    createdAt: new Date().toISOString()
  };
  pendingPayments.push(payment);
  return payment;
}

export function confirmPayment(id: string): PendingPayment | null {
  const p = pendingPayments.find(x => x.id === id);
  if (p && !p.confirmed) {
    p.confirmed = true;
    p.confirmedAt = new Date().toISOString();
    return p;
  }
  return null;
}

export function getPendingPayments(): PendingPayment[] {
  return pendingPayments.filter(p => !p.confirmed);
}
