"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TabsContextValue = {
  value: string;
  onChange: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Los componentes Tabs deben usarse dentro de <Tabs>.");
  }
  return context;
}

type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
};

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className = "",
  children,
}: TabsProps) {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const context = useMemo(
    () => ({
      value: currentValue,
      onChange: (next: string) => {
        if (value === undefined) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      baseId,
    }),
    [baseId, currentValue, onValueChange, value]
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { value: activeValue, onChange, baseId } = useTabsContext();
  const active = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={active}
      aria-controls={`${baseId}-content-${value}`}
      onClick={() => onChange(value)}
      className={`inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
        active
          ? "bg-white text-indigo-700 shadow-sm"
          : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { value: activeValue, baseId } = useTabsContext();

  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-content-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      className={`mt-6 focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
}
