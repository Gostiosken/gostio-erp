import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

function createSeedClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada. No se puede ejecutar el seed.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createSeedClient();

  try {

  console.log("🌱 Iniciando seed del ERP...");

  const sucursal = await prisma.sucursal.upsert({
    where: { idsucursal: 1 },
    update: {
      razon_social: "Incanato Central S.A.C.",
      tipo_documento: "RUC",
      num_documento: "20100070970",
      direccion: "Av. Javier Prado Este 4200, Surco",
      telefono: "01-555-1000",
      email: "contacto@incanato.pe",
      representante: "Gerencia General",
      estado: "1",
    },
    create: {
      idsucursal: 1,
      razon_social: "Incanato Central S.A.C.",
      tipo_documento: "RUC",
      num_documento: "20100070970",
      direccion: "Av. Javier Prado Este 4200, Surco",
      telefono: "01-555-1000",
      email: "contacto@incanato.pe",
      representante: "Gerencia General",
      logo: null,
      estado: "1",
    },
  });

  const empleado = await prisma.empleado.upsert({
    where: { idempleado: 1 },
    update: {
      nombre: "Administrador",
      apellidos: "Sistema",
      tipo_documento: "DNI",
      num_documento: "00000000",
      direccion: "Oficina Central",
      telefono: "01-555-0000",
      email: "admin@incanato.pe",
      foto: null,
      estado: "1",
    },
    create: {
      idempleado: 1,
      nombre: "Administrador",
      apellidos: "Sistema",
      tipo_documento: "DNI",
      num_documento: "00000000",
      direccion: "Oficina Central",
      telefono: "01-555-0000",
      email: "admin@incanato.pe",
      foto: null,
      estado: "1",
    },
  });

  await prisma.configuracionGlobal.upsert({
    where: { empresa: "FabriColor Casa Matriz" },
    update: {
      nombre_impuesto: "IVA",
      porcentaje_impuesto: 10.0,
      simbolo_moneda: "Gs.",
      logo: null,
    },
    create: {
      empresa: "FabriColor Casa Matriz",
      nombre_impuesto: "IVA",
      porcentaje_impuesto: 10.0,
      simbolo_moneda: "Gs.",
      logo: null,
    },
  });

  await prisma.usuario.upsert({
    where: { login: "admin" },
    update: {
      clave: "admin",
      tipo: "Administrador",
      estado: "1",
      mnu_almacen: 1,
      mnu_compras: 1,
      mnu_ventas: 1,
      mnu_mantenimiento: 1,
      mnu_seguridad: 1,
      mnu_admin: 1,
      idempleado: empleado.idempleado,
      idsucursal: sucursal.idsucursal,
    },
    create: {
      idempleado: empleado.idempleado,
      idsucursal: sucursal.idsucursal,
      login: "admin",
      clave: "admin",
      tipo: "Administrador",
      estado: "1",
      mnu_almacen: 1,
      mnu_compras: 1,
      mnu_ventas: 1,
      mnu_mantenimiento: 1,
      mnu_seguridad: 1,
      mnu_admin: 1,
    },
  });

  const categorias = [
    { nombre: "Impresoras", estado: "1" },
    { nombre: "Proyectores", estado: "1" },
  ];

  for (const categoria of categorias) {
    const existente = await prisma.categoria.findFirst({
      where: { nombre: categoria.nombre },
    });

    if (existente) {
      await prisma.categoria.update({
        where: { idcategoria: existente.idcategoria },
        data: { estado: categoria.estado },
      });
    } else {
      await prisma.categoria.create({ data: categoria });
    }
  }

  const unidades = [
    { nombre: "Unidad", prefijo: "Und", estado: "1" },
    { nombre: "Caja", prefijo: "Cja", estado: "1" },
  ];

  for (const unidad of unidades) {
    const existente = await prisma.unidadMedida.findFirst({
      where: { nombre: unidad.nombre },
    });

    if (existente) {
      await prisma.unidadMedida.update({
        where: { idunidad_medida: existente.idunidad_medida },
        data: { prefijo: unidad.prefijo, estado: unidad.estado },
      });
    } else {
      await prisma.unidadMedida.create({ data: unidad });
    }
  }

  const tiposDocumentoSeed = [
    { documento: "RUC", operacion: "Persona", estado: "1" },
    { documento: "DNI", operacion: "Persona", estado: "1" },
    { documento: "NIC", operacion: "Persona", estado: "1" },
    { documento: "CEDULA", operacion: "Persona", estado: "1" },
    { documento: "FACTURA", operacion: "Comprobante", estado: "1" },
    { documento: "BOLETA", operacion: "Comprobante", estado: "1" },
    { documento: "TICKET", operacion: "Comprobante", estado: "1" },
    { documento: "GUIA-REMISION", operacion: "Comprobante", estado: "1" },
  ];

  for (const tipo of tiposDocumentoSeed) {
    const existente = await prisma.tipoDocumento.findFirst({
      where: {
        documento: tipo.documento,
        operacion: tipo.operacion,
      },
    });

    if (existente) {
      await prisma.tipoDocumento.update({
        where: { idtipo_documento: existente.idtipo_documento },
        data: { estado: tipo.estado },
      });
    } else {
      await prisma.tipoDocumento.create({ data: tipo });
    }
  }

  const boleta = await prisma.tipoDocumento.findFirst({
    where: { documento: "BOLETA", operacion: "Comprobante" },
  });
  const factura = await prisma.tipoDocumento.findFirst({
    where: { documento: "FACTURA", operacion: "Comprobante" },
  });

  const correlativos = [
    { tipo: boleta, ultima_serie: "B001", ultimo_numero: "00000000" },
    { tipo: factura, ultima_serie: "F001", ultimo_numero: "00000000" },
  ];

  for (const doc of correlativos) {
    if (!doc.tipo) continue;

    const existente = await prisma.detalleDocumentoSucursal.findFirst({
      where: {
        idsucursal: sucursal.idsucursal,
        idtipo_documento: doc.tipo.idtipo_documento,
      },
    });

    if (existente) {
      await prisma.detalleDocumentoSucursal.update({
        where: {
          iddetalle_documento_sucursal: existente.iddetalle_documento_sucursal,
        },
        data: {
          ultima_serie: doc.ultima_serie,
          ultimo_numero: doc.ultimo_numero,
        },
      });
    } else {
      await prisma.detalleDocumentoSucursal.create({
        data: {
          idsucursal: sucursal.idsucursal,
          idtipo_documento: doc.tipo.idtipo_documento,
          ultima_serie: doc.ultima_serie,
          ultimo_numero: doc.ultimo_numero,
        },
      });
    }
  }

  console.log("✅ Seed completado:");
  console.log(`   Sucursal: ${sucursal.razon_social}`);
  console.log("   Usuario: admin / admin (todos los permisos mnu_*)");
  console.log("   Categorías: Impresoras, Proyectores");
  console.log("   Unidades: Unidad, Caja");
  console.log("   Tipos documento Persona: RUC, DNI, NIC, CEDULA");
  console.log("   Tipos documento Comprobante: FACTURA, BOLETA, TICKET, GUIA-REMISION");
  console.log("   Configuración: FabriColor Casa Matriz · IVA 10% · Gs.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Error en seed:", error);
  process.exit(1);
});
