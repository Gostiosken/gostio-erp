-- Timbrado: datos fiscales del emisor y punto de expedición DNIT
ALTER TABLE "Timbrado" ADD COLUMN IF NOT EXISTS "razon_social" VARCHAR(150) NOT NULL DEFAULT '';
ALTER TABLE "Timbrado" ADD COLUMN IF NOT EXISTS "ruc_emisor" VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE "Timbrado" ADD COLUMN IF NOT EXISTS "direccion" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE "Timbrado" ADD COLUMN IF NOT EXISTS "establecimiento" VARCHAR(3) NOT NULL DEFAULT '001';
ALTER TABLE "Timbrado" ADD COLUMN IF NOT EXISTS "punto_expedicion" VARCHAR(3) NOT NULL DEFAULT '001';

-- Artículo: tipo de IVA por producto
ALTER TABLE "Articulo" ADD COLUMN IF NOT EXISTS "tipo_iva" VARCHAR(10) NOT NULL DEFAULT '10';

-- Detalle pedido: snapshot del tipo IVA al vender
ALTER TABLE "DetallePedido" ADD COLUMN IF NOT EXISTS "tipo_iva" VARCHAR(10) NOT NULL DEFAULT '10';

-- Venta: número de factura DNIT y referencia al timbrado
ALTER TABLE "Venta" ADD COLUMN IF NOT EXISTS "idtimbrado" INTEGER;
ALTER TABLE "Venta" ADD COLUMN IF NOT EXISTS "num_factura" VARCHAR(20);

ALTER TABLE "Venta" DROP CONSTRAINT IF EXISTS "Venta_idtimbrado_fkey";
ALTER TABLE "Venta"
  ADD CONSTRAINT "Venta_idtimbrado_fkey"
  FOREIGN KEY ("idtimbrado") REFERENCES "Timbrado"("idtimbrado")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
