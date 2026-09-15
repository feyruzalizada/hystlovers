"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";

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

/**
 * The cart lives in localStorage so it survives reloads without a backend.
 * It is exposed as an external store: the server renders an empty cart, and
 * React swaps in the stored one after hydration without a mismatch.
 */
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function readStore(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedLines = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
    } catch {
      cachedLines = EMPTY;
    }
  }
  return cachedLines;
}

function writeStore(lines: CartLine[]) {
  cachedLines = lines;
  cachedRaw = JSON.stringify(lines);
  try {
    window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // storage unavailable — the cart still works for this page view
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function CartProvider({
  shipping,
  children,
}: {
  shipping: { freeShippingThreshold: number; shippingFee: number };
  children: React.ReactNode;
}) {
  const lines = useSyncExternalStore(subscribe, readStore, () => EMPTY);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback<CartValue["add"]>((line, qty = 1) => {
    const current = readStore();
    const key = lineKey(line.slug, line.size);
    const existing = current.find((l) => lineKey(l.slug, l.size) === key);

    writeStore(
      existing
        ? current.map((l) => (lineKey(l.slug, l.size) === key ? { ...l, qty: l.qty + qty } : l))
        : [...current, { ...line, qty }],
    );
    setIsOpen(true);
  }, []);

  const setQty = useCallback<CartValue["setQty"]>((slug, size, qty) => {
    const current = readStore();
    const key = lineKey(slug, size);

    writeStore(
      qty <= 0
        ? current.filter((l) => lineKey(l.slug, l.size) !== key)
        : current.map((l) => (lineKey(l.slug, l.size) === key ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback<CartValue["remove"]>((slug, size) => {
    writeStore(readStore().filter((l) => lineKey(l.slug, l.size) !== lineKey(slug, size)));
  }, []);

  const value = useMemo<CartValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const qualifies = subtotal >= shipping.freeShippingThreshold;
    const shippingFee = lines.length === 0 || qualifies ? 0 : shipping.shippingFee;

    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      freeShippingRemaining: Math.max(0, shipping.freeShippingThreshold - subtotal),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQty,
      remove,
      clear: () => writeStore(EMPTY),
    };
  }, [lines, isOpen, add, setQty, remove, shipping]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
