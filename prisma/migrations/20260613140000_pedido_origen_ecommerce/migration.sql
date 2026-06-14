-- Canal de origen del pedido: POS (punto de venta físico) o WEB (e-commerce)
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "origen" VARCHAR(10) NOT NULL DEFAULT 'POS';
