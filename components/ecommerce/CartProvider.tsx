"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatMoneda } from "@/lib/format-moneda";
import {
  CART_STORAGE_KEY,
  type CartItem,
} from "@/lib/ecommerce/cart-types";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  subtotalFormateado: string;
  isHydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (iddetalle_ingreso: number) => void;
  updateQuantity: (iddetalle_ingreso: number, cantidad: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readCartFromStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeCartToStorage(items);
  }, [items, isHydrated]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "cantidad">, cantidad = 1) => {
      if (cantidad < 1 || item.stock_max < 1) return;

      setItems((prev) => {
        const existente = prev.find(
          (i) => i.iddetalle_ingreso === item.iddetalle_ingreso
        );

        if (existente) {
          const nuevaCantidad = Math.min(
            existente.cantidad + cantidad,
            item.stock_max
          );
          return prev.map((i) =>
            i.iddetalle_ingreso === item.iddetalle_ingreso
              ? { ...i, cantidad: nuevaCantidad, stock_max: item.stock_max }
              : i
          );
        }

        return [
          ...prev,
          {
            ...item,
            cantidad: Math.min(cantidad, item.stock_max),
          },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((iddetalle_ingreso: number) => {
    setItems((prev) =>
      prev.filter((item) => item.iddetalle_ingreso !== iddetalle_ingreso)
    );
  }, []);

  const updateQuantity = useCallback(
    (iddetalle_ingreso: number, cantidad: number) => {
      if (cantidad < 1) {
        removeItem(iddetalle_ingreso);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.iddetalle_ingreso === iddetalle_ingreso
            ? {
                ...item,
                cantidad: Math.min(cantidad, item.stock_max),
              }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      subtotalFormateado: formatMoneda(subtotal),
      isHydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((open) => !open),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isHydrated,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return context;
}
