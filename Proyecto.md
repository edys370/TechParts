1. Definición y alcance de la temática: TechParts
Concepto de negocio: Tienda de componentes de PC y accesorios de informática con gran cantidad de variantes (como modelo, capacidad, color) y control estricto de stock.
Catálogo de productos: Tarjetas gráficas, unidades de almacenamiento SSD, periféricos y artículos con variaciones.
Integración de correo electrónico:
Enviar correo transaccional que incluya la factura.
Configurar una alerta de stock bajo destinada al administrador.
Implementar el aviso de "vuelve a estar disponible" (notificación de reposición de producto).
Integración de WhatsApp:
Canal de atención técnica previa a la compra para asesorar a los clientes sobre la compatibilidad de piezas.
Colocar un enlace de WhatsApp directamente en la ficha de cada producto.
Reto adicional específico:
Implementar productos variables con control de inventario independiente por cada variación.
Añadir un aviso de compatibilidad en la tienda.
2. Herramientas y tecnologías a utilizar
CMS y Comercio Electrónico: WordPress junto con el plugin WooCommerce (para catálogo, carrito, checkout y pedidos).
Entornos de desarrollo:
Opciones locales: XAMPP, Laragon, Local by Flywheel o Docker (con WordPress y MySQL/MariaDB).
Opción remota: Hosting web con WordPress preinstalado.
Envío de correos (SMTP):
Plugins: WP Mail SMTP, FluentSMTP o Post SMTP.
Proveedores/servidores SMTP: Brevo, Gmail (utilizando contraseña de aplicación) o Mailtrap para entornos de pruebas locales.
Personalización de plantillas: Editor nativo de WooCommerce, Kadence WooCommerce Email Designer o YayMail.
WhatsApp:
Plugins recomendados: Click to Chat, Joinchat o WP Social Chat.
Alternativa sin plugin: Enlaces directos estructurados con la API de enlaces wa.me.
Rendimiento y seguridad recomendados (opcionales): LiteSpeed Cache y Wordfence.
Herramienta para entrega del sitio (si es local): All-in-One WP Migration.
3. Cómo debe realizarse cada componente (Requisitos generales y técnicos)
Configuración del catálogo y páginas
Crear un catálogo de al menos 10 productos reales o realistas distribuidos en un mínimo de 3 categorías distintas.
Configurar productos con variaciones coherentes con los componentes de PC (ej. capacidades de SSD, modelos de tarjetas gráficas, colores de periféricos).
Configurar adecuadamente las páginas obligatorias: Tienda, Carrito, Finalizar compra (Checkout) y Mi cuenta.
Incorporar información clara de contacto y redactar las políticas de envío y devolución de la tienda.
Gestionar el inventario de manera específica para cada una de las variaciones.
Métodos de pago, envíos e impuestos
Habilitar como mínimo dos formas de pago (contra entrega, transferencia bancaria o pasarela de pagos configurada en modo prueba/sandbox).
Establecer al menos una zona de envío geográfica con su respectivo método de transporte y tarifa asignada.
Definir la moneda y los impuestos básicos acordes a la operativa del negocio.
Configuración e integración de correo electrónico
No utilizar la función nativa mail() de PHP.
Instalar y configurar un plugin de SMTP indicando host, puerto, tipo de cifrado (TLS o SSL), usuario y contraseña segura (nunca usar credenciales directas en público ni subirlas a repositorios).
Definir el remitente (nombre y correo electrónico) en sintonía con la identidad de TechParts.
Personalizar la apariencia de los correos transaccionales (incorporar logotipo, paleta de colores de la marca y pie de página).
Verificar que se reciban de forma efectiva los correos del flujo regular:
Correo de "pedido recibido" y de "pedido completado" para el cliente.
Correo de notificación de "nuevo pedido" para el administrador de la tienda.
Implementar los correos obligatorios de la temática: envío de factura, aviso de stock bajo al administrador y notificación de reposición de producto agotado al cliente.
Configuración e integración de WhatsApp
Incluir un botón de chat visible en el sitio (botón flotante en pantalla o ubicado en cabecera/pie).
Emplear números con formato internacional (código de país sin espacios ni signos) y URLs con el formato wa.me/?text=.
Configurar un mensaje precargado útil (por ejemplo, que incluya automáticamente el nombre de la pieza consultada).
Habilitar el botón de consulta técnica de compatibilidad de forma obligatoria en la ficha de cada producto.
Mostrar de forma clara y visible el horario de atención al cliente.
4. Fases de trabajo sugeridas (Plan de sesiones)
Fase 1: Instalación del entorno, configuración base de WordPress y WooCommerce, creación de categorías y carga del catálogo de productos con sus variantes.
Fase 2: Configuración de métodos de pago, cálculo de zonas de envío y diseño visual general de la tienda.
Fase 3: Configuración del servicio SMTP, personalización de plantillas y habilitación de las alertas de stock bajo y avisos de stock.
Fase 4: Integración del canal de WhatsApp, pruebas completas del ciclo de compra (desde la perspectiva del cliente y del administrador) y verificación de notificaciones.
5. Entregables obligatorios
Tienda funcional: URL pública accesible en línea o archivo de exportación del entorno local acompañado de un instructivo para su despliegue.
Informe técnico (formato PDF):
Presentación y justificación técnica de la temática TechParts.
Decisiones de arquitectura tomadas y lista justificada de plugins utilizados.
Capturas del catálogo organizado y del proceso de checkout.
Evidencias de correos: capturas de correos recibidos (tanto de cliente como de administrador) y de la pantalla de configuración SMTP (con las claves y credenciales ocultas).
Evidencias de WhatsApp: capturas del botón activo y del chat desplegando el mensaje precargado.
Manual breve de usuario: Guía explicativa con los pasos que debe seguir un usuario para comprar un producto y para contactar por soporte técnico.
Presentación y demostración en vivo: Demostración del funcionamiento en tiempo real cubriendo el flujo de compra y la llegada de notificaciones (duración entre 5 y 10 minutos).