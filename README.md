# Cris Angela Importaciones

Tienda con 47 fichas, carrito persistente en el navegador y pedidos por WhatsApp.

El inicio muestra cuatro destacados, las colecciones y un banner de peluches. El catálogo completo vive en `#catalogo`, separado de la portada, con 12 productos por página. Laravel aplica búsqueda, categoría, precio y orden antes de paginar; Angular descarga únicamente la página solicitada. Los filtros y la página se conservan en la URL, incluso al volver atrás o recargar. No se presentan descuentos ficticios.

Las vistas están separadas en `frontend/src/app/home/` y `frontend/src/app/catalog/`; el encabezado, el pie y los diálogos compartidos permanecen en el componente principal.

| Carpeta | Función |
| --- | --- |
| `frontend/` | Angular 21. Componentes de catálogo, ficha y carrito. Consume la API bajo `/api`. |
| `backend/` | Laravel 13. API, validación de pedidos, modelos, migraciones y carga inicial para PostgreSQL. |

## Iniciar en Windows

Requisitos. PHP 8.3 o superior con `pdo_pgsql`, Composer, PostgreSQL y Node.js 22.12 o superior dentro de la rama 22.

Si esta copia ya tiene la instancia local del catálogo en `backend/.postgres/`, desde la raíz ejecuta `.\backend\iniciar-postgres.ps1` antes de levantar Laravel. Esta instancia usa el puerto 55438 y sus datos se conservan al cerrar el servidor. Con el archivo `backend/.env` ya configurado y el catálogo cargado, inicia Laravel y Angular sin repetir la carga inicial.

1. En PostgreSQL, crea una base vacía llamada `cris_angela` y un usuario con permisos sobre ella. También puedes usar otros nombres y registrarlos en `backend/.env`.
2. Desde la raíz del proyecto, prepara Laravel. Antes de migrar, abre `backend/.env` y completa `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` y `DB_PASSWORD` con los datos de esa base.

   ```powershell
   cd backend
   composer install
   Copy-Item .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --host=127.0.0.1 --port=8000
   ```

   Si ya existe `.env`, conserva el archivo y omite el paso de copia. Una vez generada la clave de la aplicación, puedes conservarla para futuras ejecuciones.

3. Desde otra terminal, inicia Angular.

   ```powershell
   cd frontend
   npm ci
   npm start
   ```

4. Abre [la tienda local](http://127.0.0.1:4200/). Angular reenvía las peticiones `/api` a Laravel en el puerto 8000.

## Datos y pedidos

- `GET /api/catalogo` devuelve categorías, contacto y una selección acotada para la portada: cuatro destacados y las fichas utilizadas por el hero (hasta seis productos en total).
- `GET /api/productos?page=2&categoria=peluches&q=capybara&min=0&max=1800&orden=asc` consulta una página de hasta 12 productos. Los filtros son opcionales; la respuesta incluye `total`, `pagina`, `paginas`, `porPagina`, `desde` y `hasta`. La búsqueda ignora mayúsculas y acentos españoles.
- `GET /api/productos/seleccion?ids[]=p07&ids[]=a09` recupera exclusivamente las fichas guardadas en el carrito, con un máximo de 100 identificadores. Cambiar de página no elimina la selección.
- `POST /api/pedidos/cotizar` recibe los datos del cliente y las líneas del carrito. Laravel verifica las variantes, calcula el total usando los precios vigentes en PostgreSQL y devuelve el enlace de WhatsApp. El envío del mensaje se realiza desde WhatsApp y los datos del cliente se usan para armar la cotización.
- Los productos iniciales están en `backend/database/data/catalogo.json`. La carga inicial actualiza los registros por identificador, de modo que volver a ejecutarla no duplica fichas. Los importes se almacenan en céntimos de sol. Por ejemplo, `990` representa S/ 9.90.
- Conserva los identificadores de las fichas existentes para que el carrito pueda recuperarlas. Las fotos WebP se sirven desde `frontend/public/assets/`.
- Cambia el destino de WhatsApp en `backend/.env` mediante `STORE_WHATSAPP` con el código de país y solo dígitos. El formato visible se configura con `STORE_PHONE_LABEL`.

## Verificación y compilación

- Desde `backend/`, `php artisan test` comprueba la carga del catálogo y la validación de pedidos. La configuración de pruebas usa una base SQLite en memoria por defecto. Para probar en PostgreSQL, indica una base exclusiva de pruebas mediante las variables `DB_*`. Las pruebas reconstruyen su esquema.
- Desde `frontend/`, `npm run build` compila Angular en `frontend/dist/tienda/browser/`. En un servidor, publica esa carpeta y dirige `/api/` a Laravel en el mismo dominio. El directorio público de Laravel es `backend/public/`.
- Desde `frontend/`, `npm test` verifica recuperación y variantes del carrito, productos de distintas páginas, datos inválidos y reintentos de conexión. Las pruebas de Laravel incluyen un catálogo de 1047 registros en la base de pruebas y comprueban que las respuestas permanezcan acotadas.

## Despliegue en Vercel

Para el frontend, importa el repositorio con `frontend` como directorio raíz, Angular como preset, `npm run build` como comando de compilación y `dist/tienda/browser` como directorio de salida.

El frontend consulta `/api` en su propio dominio. Publica Laravel en un entorno compatible con PHP, con su directorio `backend/public` como raíz pública, y configura una regla de Vercel que reenvíe `/api/:path*` a `https://<dominio-de-laravel>/api/:path*`. En Laravel, configura `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` y la conexión a PostgreSQL mediante variables del entorno de producción. En una base nueva, aplica las migraciones y carga el catálogo inicial con `php artisan migrate --seed --force`.

[Configuración de compilación](https://vercel.com/docs/builds/configure-a-build) · [Reenvío de solicitudes a Laravel](https://vercel.com/docs/routing/rewrites)

## Datos del PDF

- Las fichas siguen la lectura visual de arriba abajo y de izquierda a derecha en cada fila. Se incluyeron diez fichas por categoría y las siete de Peluches.
- Los nombres de color describen muestras gráficas que aparecen sin etiqueta en el PDF. La ficha de Tomatodo Diario muestra capacidades y colores por separado y pide coordinar la combinación con la tienda. Tomatodo Dibujo muestra distintos estampados sin identificar variantes, por lo que el cliente puede indicar su preferencia en las notas.
- La ficha de Audífonos P47 indica Bluetooth 4.1 y una de las cajas de su foto muestra 5.0+EDR. Se conservó el dato de la ficha.
- El pedido abre un mensaje para revisar y enviar desde WhatsApp. El total corresponde a los productos elegidos.
