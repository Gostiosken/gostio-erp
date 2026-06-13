-- CreateTable
CREATE TABLE "Categoria" (
    "idcategoria" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("idcategoria")
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "idunidad_medida" SERIAL NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "prefijo" VARCHAR(5) NOT NULL,
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "UnidadMedida_pkey" PRIMARY KEY ("idunidad_medida")
);

-- CreateTable
CREATE TABLE "Articulo" (
    "idarticulo" SERIAL NOT NULL,
    "idcategoria" INTEGER NOT NULL,
    "idunidad_medida" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "imagen" VARCHAR(150),
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Articulo_pkey" PRIMARY KEY ("idarticulo")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "idsucursal" SERIAL NOT NULL,
    "razon_social" VARCHAR(150) NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL,
    "num_documento" VARCHAR(20) NOT NULL,
    "direccion" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20) NOT NULL,
    "email" VARCHAR(70),
    "representante" VARCHAR(150),
    "logo" VARCHAR(50),
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("idsucursal")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "idempleado" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "apellidos" VARCHAR(50) NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL,
    "num_documento" VARCHAR(20) NOT NULL,
    "direccion" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(70),
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("idempleado")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "idusuario" SERIAL NOT NULL,
    "idempleado" INTEGER NOT NULL,
    "idsucursal" INTEGER NOT NULL,
    "login" VARCHAR(20) NOT NULL,
    "clave" VARCHAR(64) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "mnu_almacen" INTEGER NOT NULL DEFAULT 0,
    "mnu_compras" INTEGER NOT NULL DEFAULT 0,
    "mnu_ventas" INTEGER NOT NULL DEFAULT 0,
    "mnu_mantenimiento" INTEGER NOT NULL DEFAULT 0,
    "mnu_seguridad" INTEGER NOT NULL DEFAULT 0,
    "mnu_admin" INTEGER NOT NULL DEFAULT 0,
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("idusuario")
);

-- CreateTable
CREATE TABLE "DetalleIngreso" (
    "iddetalle_ingreso" SERIAL NOT NULL,
    "idingreso" INTEGER NOT NULL,
    "idarticulo" INTEGER NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "serie" VARCHAR(50),
    "descripcion" VARCHAR(1024),
    "stock_ingreso" INTEGER NOT NULL,
    "stock_actual" INTEGER NOT NULL,
    "precio_compra" DECIMAL(8,2) NOT NULL,
    "precio_ventadistribuidor" DECIMAL(8,2) NOT NULL,
    "precio_ventapublico" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "DetalleIngreso_pkey" PRIMARY KEY ("iddetalle_ingreso")
);

-- CreateTable
CREATE TABLE "Ingreso" (
    "idingreso" SERIAL NOT NULL,
    "idusuario" INTEGER NOT NULL,
    "idsucursal" INTEGER NOT NULL,
    "idproveedor" INTEGER NOT NULL,
    "tipo_comprobante" VARCHAR(20) NOT NULL,
    "serie_comprobante" VARCHAR(7) NOT NULL,
    "num_comprobante" VARCHAR(10) NOT NULL,
    "fecha" DATE NOT NULL,
    "impuesto" DECIMAL(8,2) NOT NULL,
    "total" DECIMAL(8,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,

    CONSTRAINT "Ingreso_pkey" PRIMARY KEY ("idingreso")
);

-- CreateTable
CREATE TABLE "Persona" (
    "idpersona" SERIAL NOT NULL,
    "tipo_persona" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL,
    "num_documento" VARCHAR(20) NOT NULL,
    "direccion" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(70),
    "estado" CHAR(1) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("idpersona")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "idpedido" SERIAL NOT NULL,
    "idcliente" INTEGER NOT NULL,
    "idusuario" INTEGER NOT NULL,
    "idsucursal" INTEGER NOT NULL,
    "tipo_pedido" VARCHAR(20) NOT NULL,
    "fecha" DATE NOT NULL,
    "numero" INTEGER,
    "estado" VARCHAR(20) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("idpedido")
);

-- CreateTable
CREATE TABLE "DetallePedido" (
    "iddetalle_pedido" SERIAL NOT NULL,
    "idpedido" INTEGER NOT NULL,
    "iddetalle_ingreso" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_venta" DECIMAL(8,2) NOT NULL,
    "descuento" DECIMAL(8,2),

    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("iddetalle_pedido")
);

-- CreateTable
CREATE TABLE "Venta" (
    "idventa" SERIAL NOT NULL,
    "idpedido" INTEGER NOT NULL,
    "idusuario" INTEGER NOT NULL,
    "tipo_venta" VARCHAR(20) NOT NULL,
    "tipo_comprobante" VARCHAR(20) NOT NULL,
    "serie_comprobante" VARCHAR(7) NOT NULL,
    "num_comprobante" VARCHAR(10) NOT NULL,
    "fecha" DATE NOT NULL,
    "impuesto" DECIMAL(8,2) NOT NULL,
    "total" DECIMAL(8,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("idventa")
);

-- CreateTable
CREATE TABLE "Credito" (
    "idcredito" SERIAL NOT NULL,
    "idventa" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "total_pago" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "Credito_pkey" PRIMARY KEY ("idcredito")
);

-- CreateTable
CREATE TABLE "DetalleDocumentoSucursal" (
    "iddetalle_documento_sucursal" SERIAL NOT NULL,
    "idsucursal" INTEGER NOT NULL,
    "idtipo_documento" INTEGER NOT NULL,
    "ultima_serie" VARCHAR(7) NOT NULL,
    "ultimo_numero" VARCHAR(10) NOT NULL,

    CONSTRAINT "DetalleDocumentoSucursal_pkey" PRIMARY KEY ("iddetalle_documento_sucursal")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_login_key" ON "Usuario"("login");

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_idcategoria_fkey" FOREIGN KEY ("idcategoria") REFERENCES "Categoria"("idcategoria") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Articulo" ADD CONSTRAINT "Articulo_idunidad_medida_fkey" FOREIGN KEY ("idunidad_medida") REFERENCES "UnidadMedida"("idunidad_medida") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_idempleado_fkey" FOREIGN KEY ("idempleado") REFERENCES "Empleado"("idempleado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_idsucursal_fkey" FOREIGN KEY ("idsucursal") REFERENCES "Sucursal"("idsucursal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleIngreso" ADD CONSTRAINT "DetalleIngreso_idarticulo_fkey" FOREIGN KEY ("idarticulo") REFERENCES "Articulo"("idarticulo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleIngreso" ADD CONSTRAINT "DetalleIngreso_idingreso_fkey" FOREIGN KEY ("idingreso") REFERENCES "Ingreso"("idingreso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_idsucursal_fkey" FOREIGN KEY ("idsucursal") REFERENCES "Sucursal"("idsucursal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_idproveedor_fkey" FOREIGN KEY ("idproveedor") REFERENCES "Persona"("idpersona") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_idsucursal_fkey" FOREIGN KEY ("idsucursal") REFERENCES "Sucursal"("idsucursal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_idpedido_fkey" FOREIGN KEY ("idpedido") REFERENCES "Pedido"("idpedido") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_iddetalle_ingreso_fkey" FOREIGN KEY ("iddetalle_ingreso") REFERENCES "DetalleIngreso"("iddetalle_ingreso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_idpedido_fkey" FOREIGN KEY ("idpedido") REFERENCES "Pedido"("idpedido") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_idventa_fkey" FOREIGN KEY ("idventa") REFERENCES "Venta"("idventa") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DetalleDocumentoSucursal" ADD CONSTRAINT "DetalleDocumentoSucursal_idsucursal_fkey" FOREIGN KEY ("idsucursal") REFERENCES "Sucursal"("idsucursal") ON DELETE NO ACTION ON UPDATE NO ACTION;
