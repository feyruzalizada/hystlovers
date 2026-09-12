"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import shop from "@/data/shop.json";

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  image: string | null;
  color: string;
  size: string;
  qty: number;
};

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingRemaining: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "hystlovers-cart";
const CartContext = createContext<CartValue | null>(null);
const lineKey = (slug: string, size: string) => `${slug}::${size}`;

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage unavailable — cart stays in memory for this session
    }
  }, [lines, hydrated]);

  const add = useCallback<CartValue["add"]>((line, qty = 1) => {
    setLines((current) => {
      const key = lineKey(line.slug, line.size);
      const existing = current.find((l) => lineKey(l.slug, l.size) === key);
      if (existing) {
        return current.map((l) =>
          lineKey(l.slug, l.size) === key ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...current, { ...line, qty }];
    });
    setIsOpen(true);
  }, []);

  const setQty = useCallback<CartValue["setQty"]>((slug, size, qty) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((l) => lineKey(l.slug, l.size) !== lineKey(slug, size))
        : current.map((l) => (lineKey(l.slug, l.size) === lineKey(slug, size) ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback<CartValue["remove"]>((slug, size) => {
    setLines((current) => current.filter((l) => lineKey(l.slug, l.size) !== lineKey(slug, size)));
  }, []);

  const value = useMemo<CartValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const qualifies = subtotal >= shop.freeShippingThreshold;
    const shippingFee = lines.length === 0 || qualifies ? 0 : shop.shippingFee;
    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      freeShippingRemaining: Math.max(0, shop.freeShippingThreshold - subtotal),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQty,
      remove,
      clear: () => setLines([]),
    };
  }, [lines, isOpen, add, setQty, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
