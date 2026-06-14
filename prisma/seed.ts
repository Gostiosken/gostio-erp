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

type PersonalFabriColor = {
  nombre: string;
  apellidos: string;
  login: string;
  clave: string;
  tipo_documento: string;
  num_documento: string;
  telefono: string;
  email: string;
  direccion: string;
};

const PERSONAL_FABRICOLOR: PersonalFabriColor[] = [
  {
    nombre: "Julio",
    apellidos: "Benítez",
    login: "julio",
    clave: "julio",
    tipo_documento: "CI",
    num_documento: "1.234.567",
    telefono: "0981 100 101",
    email: "julio@fabricolor.com.py",
    direccion: "Barrio San Pablo, Asunción",
  },
  {
    nombre: "Andrea",
    apellidos: "Villalba",
    login: "andrea",
    clave: "andrea",
    tipo_documento: "CI",
    num_documento: "2.345.678",
    telefono: "0982 200 202",
    email: "andrea@fabricolor.com.py",
    direccion: "Fernando de la Mora, Central",
  },
  {
    nombre: "Yisel",
    apellidos: "Acosta",
    login: "yisel",
    clave: "yisel",
    tipo_documento: "CI",
    num_documento: "3.456.789",
    telefono: "0983 300 303",
    email: "yisel@fabricolor.com.py",
    direccion: "Lambaré, Central",
  },
];

async function main() {
  const prisma = createSeedClient();

  try {
    console.log("🌱 FabriColor ERP — seed de fábrica (Paraguay)...");

    const sucursal = await prisma.sucursal.create({
      data: {
        razon_social: "FabriColor Matriz",
        tipo_documento: "RUC",
        num_documento: "80012345-6",
        direccion: "Av. España 1234, Asunción",
        telefono: "021 123 456",
        email: "matriz@fabricolor.com.py",
        representante: "FabriColor S.R.L.",
        logo: null,
        estado: "1",
      },
    });

    const empleadoAdmin = await prisma.empleado.create({
      data: {
        nombre: "Administrador",
        apellidos: "Sistema",
        tipo_documento: "CI",
        num_documento: "0.000.000",
        direccion: "FabriColor Matriz, Asunción",
        telefono: "021 123 456",
        email: "admin@fabricolor.com.py",
        foto: null,
        estado: "1",
      },
    });

    await prisma.configuracionGlobal.create({
      data: {
        empresa: "FabriColor Casa Matriz",
        nombre_impuesto: "IVA",
        porcentaje_impuesto: 10.0,
        simbolo_moneda: "Gs.",
        logo: null,
      },
    });

    await prisma.usuario.create({
      data: {
        idempleado: empleadoAdmin.idempleado,
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

    for (const persona of PERSONAL_FABRICOLOR) {
      const empleado = await prisma.empleado.create({
        data: {
          nombre: persona.nombre,
          apellidos: persona.apellidos,
          tipo_documento: persona.tipo_documento,
          num_documento: persona.num_documento,
          direccion: persona.direccion,
          telefono: persona.telefono,
          email: persona.email,
          foto: null,
          estado: "1",
        },
      });

      await prisma.usuario.create({
        data: {
          idempleado: empleado.idempleado,
          idsucursal: sucursal.idsucursal,
          login: persona.login,
          clave: persona.clave,
          tipo: "Operador",
          estado: "1",
          mnu_almacen: 1,
          mnu_compras: 1,
          mnu_ventas: 1,
          mnu_mantenimiento: 0,
          mnu_seguridad: 0,
          mnu_admin: 0,
        },
      });

      await prisma.persona.create({
        data: {
          tipo_persona: "Cliente",
          nombre: `${persona.nombre} ${persona.apellidos}`,
          tipo_documento: persona.tipo_documento,
          num_documento: persona.num_documento,
          direccion: persona.direccion,
          telefono: persona.telefono,
          email: persona.email,
          estado: "1",
        },
      });
    }

    const categorias = [
      { nombre: "Tintas Serigrafía", estado: "1" },
      { nombre: "Vinilos Textiles", estado: "1" },
      { nombre: "Maquinaria Serigrafía", estado: "1" },
    ];

    for (const categoria of categorias) {
      await prisma.categoria.create({ data: categoria });
    }

    const unidades = [
      { nombre: "Unidad", prefijo: "Und", estado: "1" },
      { nombre: "Litro", prefijo: "Lt", estado: "1" },
      { nombre: "Metro", prefijo: "Mt", estado: "1" },
    ];

    for (const unidad of unidades) {
      await prisma.unidadMedida.create({ data: unidad });
    }

    const tiposDocumentoSeed = [
      { documento: "RUC", operacion: "Persona", estado: "1" },
      { documento: "CI", operacion: "Persona", estado: "1" },
      { documento: "CEDULA", operacion: "Persona", estado: "1" },
      { documento: "FACTURA", operacion: "Comprobante", estado: "1" },
      { documento: "BOLETA", operacion: "Comprobante", estado: "1" },
      { documento: "TICKET", operacion: "Comprobante", estado: "1" },
      { documento: "GUIA-REMISION", operacion: "Comprobante", estado: "1" },
    ];

    for (const tipo of tiposDocumentoSeed) {
      await prisma.tipoDocumento.create({ data: tipo });
    }

    const boleta = await prisma.tipoDocumento.findFirst({
      where: { documento: "BOLETA", operacion: "Comprobante" },
    });
    const factura = await prisma.tipoDocumento.findFirst({
      where: { documento: "FACTURA", operacion: "Comprobante" },
    });

    const correlativos = [
      { tipo: boleta, ultima_serie: "001-001", ultimo_numero: "00000000" },
      { tipo: factura, ultima_serie: "001-001", ultimo_numero: "00000000" },
    ];

    for (const doc of correlativos) {
      if (!doc.tipo) continue;

      await prisma.detalleDocumentoSucursal.create({
        data: {
          idsucursal: sucursal.idsucursal,
          idtipo_documento: doc.tipo.idtipo_documento,
          ultima_serie: doc.ultima_serie,
          ultimo_numero: doc.ultimo_numero,
        },
      });
    }

    const hoy = new Date();
    const vencimiento = new Date(hoy);
    vencimiento.setFullYear(vencimiento.getFullYear() + 1);

    await prisma.timbrado.create({
      data: {
        numero_timbrado: "12345678",
        idsucursal: sucursal.idsucursal,
        razon_social: "FabriColor Matriz",
        ruc_emisor: "80012345-6",
        direccion: "Av. España 1234, Asunción",
        establecimiento: "001",
        punto_expedicion: "001",
        serie: "001-001",
        numero_desde: 1,
        numero_hasta: 9999999,
        numero_actual: 0,
        fecha_inicio: hoy,
        fecha_vencimiento: vencimiento,
        estado: "1",
      },
    });

    console.log("✅ Seed FabriColor completado:");
    console.log(`   Sucursal única: ${sucursal.razon_social}`);
    console.log("   Usuario master: admin / admin (todos los permisos)");
    console.log("   Personal: Julio, Andrea, Yisel (Empleado + Usuario + Cliente)");
    console.log("   Categorías: Tintas, Vinilos, Maquinaria Serigrafía");
    console.log("   Moneda: Gs. · IVA 10% · Timbrado DNIT activo");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("❌ Error en seed:", error);
  process.exit(1);
});
