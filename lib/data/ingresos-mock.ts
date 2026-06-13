import type { Ingreso } from "@/lib/types/ingreso";

export const INGRESOS_MOCK: Ingreso[] = [
  {
    idingreso: 1,
    idusuario: 1,
    idsucursal: 1,
    idproveedor: 1,
    tipo_comprobante: "Factura",
    serie_comprobante: "F001",
    num_comprobante: "00001234",
    fecha: "2026-06-01",
    impuesto: 54.0,
    total: 354.0,
    estado: "Aceptado",
    proveedor: {
      idpersona: 1,
      nombre: "Distribuidora Nacional S.A.C.",
      num_documento: "20111222333",
    },
    detalles: [
      {
        iddetalle_ingreso: 1,
        idingreso: 1,
        idarticulo: 1,
        codigo: "7501234567890",
        serie: null,
        descripcion: "Agua Mineral 625ml",
        stock_ingreso: 100,
        stock_actual: 100,
        precio_compra: 1.5,
        precio_ventadistribuidor: 2.0,
        precio_ventapublico: 2.5,
        articulo: { idarticulo: 1, nombre: "Agua Mineral 625ml" },
      },
      {
        iddetalle_ingreso: 2,
        idingreso: 1,
        idarticulo: 2,
        codigo: "0002",
        serie: null,
        descripcion: "Arroz Extra 1kg",
        stock_ingreso: 50,
        stock_actual: 50,
        precio_compra: 3.2,
        precio_ventadistribuidor: 4.0,
        precio_ventapublico: 4.8,
        articulo: { idarticulo: 2, nombre: "Arroz Extra 1kg" },
      },
      {
        iddetalle_ingreso: 3,
        idingreso: 1,
        idarticulo: 3,
        codigo: "0003",
        serie: "L-2026",
        descripcion: "Detergente Líquido",
        stock_ingreso: 30,
        stock_actual: 30,
        precio_compra: 8.5,
        precio_ventadistribuidor: 10.0,
        precio_ventapublico: 12.0,
        articulo: { idarticulo: 3, nombre: "Detergente Líquido" },
      },
    ],
  },
  {
    idingreso: 2,
    idusuario: 1,
    idsucursal: 2,
    idproveedor: 2,
    tipo_comprobante: "Boleta",
    serie_comprobante: "B001",
    num_comprobante: "00000089",
    fecha: "2026-06-05",
    impuesto: 18.0,
    total: 118.0,
    estado: "Aceptado",
    proveedor: {
      idpersona: 2,
      nombre: "Comercial Pérez E.I.R.L.",
      num_documento: "20444555666",
    },
    detalles: [],
  },
];

export function getIngresosMockBySucursal(idsucursal: number): Ingreso[] {
  return INGRESOS_MOCK.filter((ingreso) => ingreso.idsucursal === idsucursal);
}

let mockIngresoCounter = INGRESOS_MOCK.length;

export function getNextMockIngresoId(): number {
  mockIngresoCounter += 1;
  return mockIngresoCounter;
}
