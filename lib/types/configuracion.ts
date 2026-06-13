export interface ConfiguracionGlobal {
  idglobal: number;
  empresa: string;
  nombre_impuesto: string;
  porcentaje_impuesto: number;
  simbolo_moneda: string;
  logo: string | null;
}

export interface ConfiguracionGlobalInput {
  empresa: string;
  nombre_impuesto: string;
  porcentaje_impuesto: number;
  simbolo_moneda: string;
  logo?: string | null;
}

export const CONFIGURACION_DEFAULT: ConfiguracionGlobal = {
  idglobal: 1,
  empresa: "Gostio-ERP Casa Matriz",
  nombre_impuesto: "IVA",
  porcentaje_impuesto: 10,
  simbolo_moneda: "Gs.",
  logo: null,
};
