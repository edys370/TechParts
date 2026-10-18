# 📖 Manual de Usuario y Justificación Comercial - TechParts

**Autor:** Dev 2 (Fullstack Engineer & Business Logic)  
**Proyecto:** TechParts - Tienda de Componentes de PC & Accesorios  
**Versión:** 1.0.0 (Alineado con Proyecto.md)

---

## 🎯 1. Guía Paso a Paso para el Cliente

### 🛒 1.1. Exploración del Catálogo y Selección de Variantes
1. Ingrese a la plataforma TechParts desde su navegador web (`http://localhost:5173`).
2. En la pestaña **Tienda / Catálogo**, explore los componentes organizados por categorías (Procesadores, Tarjetas Gráficas, Memorias RAM, Almacenamiento SSD, etc.).
3. En productos con múltiples especificaciones (ej. SSDs con capacidades de 1TB / 2TB o GPUs con 12GB / 16GB), seleccione la **variante deseada** haciendo clic sobre su botón correspondiente. Notará que el precio y las existencias se actualizan dinámicamente de forma independiente.
4. Si el producto o variante se encuentra agotado, haga clic en **"🔔 Avisarme al Reponer"** e ingrese su correo electrónico para recibir un aviso automático apenas ingrese nuevo stock.

### 🧩 1.2. Consulta de Compatibilidad Técnica y Soporte WhatsApp
1. **Asistente en Línea:** En cualquier tarjeta de producto, haga clic en el ícono del procesador para abrir el **Asistente de Compatibilidad PC** y verificar sockets (AM5 / LGA1700), tipo de RAM (DDR4 / DDR5) y potencia estimada en Watts.
2. **Soporte Oficial por WhatsApp:**
   - En cada ficha de producto encontrará el botón **"Consultar"** con WhatsApp. Al pulsarlo, se abrirá la aplicación oficial con un mensaje precargado que incluye el nombre exacto de la pieza y su SKU:  
     `"Hola TechParts, deseo consultar la compatibilidad técnica del producto: [Nombre del componente] (SKU: [SKU])"`.
   - También dispone del botón flotante permanente en la esquina inferior derecha.
   - **Horario de Atención Técnica:** Lunes a Sábado de 08:30 a 18:30 (GMT-5).

### 💳 1.3. Proceso de Checkout y Formas de Pago
1. Agregue los productos deseados al carrito pulsando **"Añadir al Carrito"**.
2. Abra el carrito de compras desde el ícono superior derecho de la barra de navegación.
3. Pulse **"Continuar con el Pedido"** para desplegar el formulario de Checkout.
4. Ingrese sus datos personales:
   - Nombre y Apellidos.
   - Cédula de Identidad o RUC.
   - Correo electrónico (donde recibirá la factura comercial).
   - Teléfono / WhatsApp.
   - Dirección completa y Ciudad.
5. Seleccione su **Zona Geográfica de Envío**:
   - *Zona Local (Pichincha / Quito):* Tarifa $3.50 (Gratis en compras superiores a $150). Entrega en 24h.
   - *Zona Nacional (Resto del Ecuador):* Tarifa $6.00 (Gratis en compras superiores a $300). Entrega en 48-72h.
6. Seleccione su **Método de Pago**:
   - **Transferencia Bancaria Directa:** Se presentarán los datos institucionales de la cuenta Banco Pichincha (Cta. Corriente 2100845920 a nombre de TechParts Ecuador S.A.S., RUC 1793204918001).
   - **Pago Contra Entrega:** Cancele en efectivo o tarjeta con datáfono inalámbrico al recibir su paquete.
   - **Pasarela Sandbox:** Simulación de pago electrónico seguro con tarjeta de crédito/débito.
7. Revise el desglose: Subtotal + Tarifa de Envío + IVA (15%) = Total en USD.
8. Haga clic en **"Confirmar y Pagar Pedido"**. Recibirá su confirmación inmediata en pantalla y un correo electrónico transaccional con la **Factura Digital Comercial** detallada.

---

## 🛡️ 2. Guía para el Administrador de la Tienda

### 📦 2.1. Gestión de Pedidos y Trazabilidad ACID
1. Ingrese a la pestaña **Pedidos Web**.
2. Podrá visualizar todas las órdenes generadas con su código único (`TP-2026-XXXX`), datos del cliente, método de pago, estado de despacho y total.
3. Al recibir un comprobante de transferencia bancaria, verifique el número de orden y cambie el estado del pedido a **"CONFIRMED"** o **"SHIPPED"**.
4. Cada venta deduce automáticamente y en tiempo real el stock exacto de la variante adquirida protegiendo la consistencia de inventario ante compras simultáneas.

### ⚠️ 2.2. Alertas Automáticas de Stock Bajo
- Cuando el stock de un producto o variante caiga por debajo de su umbral mínimo (`minStock`), el sistema dispara inmediatamente una alerta por correo electrónico al administrador (`admin@techparts.com`) indicando:
  - Nombre del componente y SKU afectado.
  - Stock restante actual y umbral mínimo.
  - Recomendación de reposición a proveedores.
- También se listan en el **Dashboard** principal en la sección de alertas visuales.

### 📥 2.3. Ingreso de Mercancía y Reposición Automática a Clientes
1. Diríjase a **Inventario** o **Movimientos de Stock**.
2. Haga clic en **"Registrar Movimiento"**.
3. Seleccione el producto y variante correspondiente, elija el tipo **"IN (Entrada de Mercancía)"**, digite la cantidad y el motivo/referencia.
4. Al confirmar, si el ítem se encontraba agotado (stock 0), el motor de **Notificaciones de Reposición** buscará a todos los clientes suscritos y les enviará automáticamente el correo **"¡El producto que esperabas ha vuelto a estar disponible!"** con el enlace directo para comprar.

### 📊 2.4. Auditoría y Configuración SMTP
- En la pestaña **Diagnóstico & Configuración**:
  - Podrá validar la salud de PostgreSQL y del Backend.
  - Visualizar los parámetros del servidor SMTP (Mailtrap / Brevo / Gmail) con credenciales enmascaradas por seguridad.
  - Probar la conectividad con el botón **"Enviar Alerta de Prueba SMTP"**.
  - Revisar la **Tabla de Auditoría de Correos Transaccionales** con el historial de facturas, avisos al admin y notificaciones de reposición.

---

## 💼 3. Justificación de Decisiones Comerciales y Operativas

### 💵 3.1. Métodos de Pago Seleccionados
- **Transferencia Bancaria Directa:** Método preferido en el mercado ecuatoriano para transacciones B2C de alto valor (como hardware y componentes de gama media/alta), evitando comisiones bancarias excesivas de pasarelas de pago y reduciendo el riesgo de fraude.
- **Pago Contra Entrega:** Fomenta la confianza para clientes primerizos dentro de la zona urbana de Quito y valles, permitiéndoles inspeccionar físicamente el sello de seguridad del producto antes de cancelar.
- **Pasarela Digital Sandbox:** Cumple con la normativa de comercio electrónico para clientes que prefieren pago inmediato con tarjeta de crédito o diferido a cuotas.

### 🚚 3.2. Zonas de Envío y Política de Tarifas
- **Zona Local (Pichincha / Quito):** Logística urbana ágil en 24 horas laborables con tarifa plana accesible ($3.50) e incentivo de envío gratuito a partir de $150 (valor promedio de un SSD NVMe o módulo de RAM).
- **Zona Nacional (Resto del Ecuador):** Cobertura interprovincial mediante alianzas con operadores logísticos (Servientrega / LaarCourier) con tarifa de $6.00 y umbral de envío gratuito a partir de $300 (computadoras armadas o tarjetas gráficas).

### 🏷️ 3.3. Moneda e Impuestos
- **Moneda:** Dólares de los Estados Unidos (USD), moneda oficial de curso legal en la República del Ecuador.
- **Impuesto al Valor Agregado (IVA):** Calculado estrictamente al **15%**, conforme a la legislación tributaria vigente (Ley Orgánica para Enfrentar el Conflicto Armado Interno).
