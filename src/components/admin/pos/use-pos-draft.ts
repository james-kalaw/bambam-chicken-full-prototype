"use client";

import { useState } from "react";
import type { OrderGroup, OrderItem, OrderType } from "@/types/order";

// The order the cashier is currently building at the POS.
// Group orders: every item belongs to a person ("Person 1", "Person 2"…).
// It is still ONE order with one Order ID — people are only for organizing.

export interface LinkedCustomer {
  id: string;
  name: string;
}

const FIRST_PERSON: OrderGroup = { id: "g1", label: "Person 1" };

export function usePosDraft() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [groups, setGroups] = useState<OrderGroup[]>([FIRST_PERSON]);
  const [activeGroupId, setActiveGroupId] = useState(FIRST_PERSON.id);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  /** null = Guest / Walk-in (the default) */
  const [customer, setCustomer] = useState<LinkedCustomer | null>(null);

  return {
    items,
    groups,
    activeGroupId,
    orderType,
    customer,
    isGroupOrder: groups.length > 1,

    setActiveGroupId,
    setOrderType,
    setCustomer,

    /** New items go to the selected person */
    addItem: (item: OrderItem) => setItems((prev) => [...prev, { ...item, groupId: item.groupId ?? activeGroupId }]),
    updateItem: (lineId: string, item: OrderItem) => setItems((prev) => prev.map((i) => (i.lineId === lineId ? item : i))),
    removeItem: (lineId: string) => setItems((prev) => prev.filter((i) => i.lineId !== lineId)),
    setQuantity: (lineId: string, quantity: number) =>
      setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.lineId !== lineId) : prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)))),

    addPerson: () => {
      const next = { id: `g${Date.now().toString(36)}`, label: `Person ${groups.length + 1}` };
      setGroups((prev) => [...prev, next]);
      setActiveGroupId(next.id);
    },
    /** Only empty people can be removed; labels are renumbered */
    removePerson: (groupId: string) => {
      if (groups.length <= 1 || items.some((i) => i.groupId === groupId)) return;
      const remaining = groups.filter((g) => g.id !== groupId).map((g, i) => ({ ...g, label: `Person ${i + 1}` }));
      setGroups(remaining);
      if (activeGroupId === groupId) setActiveGroupId(remaining[remaining.length - 1].id);
    },

    /** Replace the whole draft (used by AI Quick Order) */
    load: (draft: { items: OrderItem[]; groups: OrderGroup[]; orderType?: OrderType }) => {
      const gs = draft.groups.length > 0 ? draft.groups : [FIRST_PERSON];
      setItems(draft.items);
      setGroups(gs);
      setActiveGroupId(gs[0].id);
      if (draft.orderType) setOrderType(draft.orderType);
    },
    reset: () => {
      setItems([]);
      setGroups([FIRST_PERSON]);
      setActiveGroupId(FIRST_PERSON.id);
      setCustomer(null);
    },
  };
}

export type PosDraft = ReturnType<typeof usePosDraft>;
