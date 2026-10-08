// ─────────────────────────────────────────────────────────────────────────────
// DEMO CONFIGURATION
// Every value in this file is a PLACEHOLDER that still needs owner approval.
// Keeping them in one place means nothing is hardcoded deep inside components.
// ─────────────────────────────────────────────────────────────────────────────

import type { PaymentMethod } from "@/types/order";

export type SlotStatus = "available" | "limited" | "full";

export interface PickupSlot {
  label: string;
  range: string;
  status: SlotStatus;
  slotsLeft?: number;
}

export const DEMO_CONFIG = {
  /** Branch used for new orders in the prototype */
  defaultBranchId: "tip-qc",

  /** Online service fee. 0 = none. NOT CONFIRMED. */
  onlineServiceFee: 0,

  /** Delivery fee is arranged manually by the restaurant. NOT CONFIRMED. */
  deliveryFeeLabel: "To be confirmed by Bambam",

  /**
   * Simulated pickup slots. A real system would calculate availability
   * from capacity rules that the owners have not decided yet.
   */
  pickupSlots: [
    { label: "12:00 PM", range: "12:00–12:15", status: "full" },
    { label: "12:15 PM", range: "12:15–12:30", status: "limited", slotsLeft: 2 },
    { label: "12:30 PM", range: "12:30–12:45", status: "available" },
    { label: "12:45 PM", range: "12:45–1:00", status: "available" },
    { label: "1:00 PM", range: "1:00–1:15", status: "available" },
  ] satisfies PickupSlot[],

  /** Max pickup orders per 15 minutes. null = not set yet (owner decision). */
  maxPickupOrdersPer15Min: null as number | null,

  /** Payment methods shown to customers. Exact list needs owner confirmation. */
  paymentMethods: [
    { id: "cash", label: "Cash", hint: "Pay at the counter or on pickup" },
    { id: "gcash", label: "GCash", hint: "Pay now with proof, or pay later" },
    { id: "maya", label: "Maya", hint: "Pay now with proof, or pay later" },
    { id: "bank_transfer", label: "Bank Transfer", hint: "Pay now with proof, or pay later" },
    { id: "other_online", label: "Other Online Payment", hint: "Pay now with proof, or pay later" },
  ] satisfies { id: PaymentMethod; label: string; hint: string }[],

  /** When an order is completed, deduct recipe ingredients from inventory (demo quantities). */
  autoDeductInventoryOnComplete: true,

  /** Can Branch Managers see revenue/profit? NOT DECIDED — kept off in the demo. */
  managerCanViewFinancials: false,

  /** Any 6 digits work in the prototype; this one is pre-filled for speed. */
  demoOtpCode: "482913",

  /** Now Serving screen: completed orders stay under "Please claim" for this long */
  nowServingClaimMinutes: 20,

  /** Pre-filled mobile number for the demo customer (CUS-000428). */
  demoCustomerMobile: "09171234567",
};
