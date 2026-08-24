// ==== Verificación de edad (+18) ====
const gate = document.getElementById('ageGate');

if (!gate) {
  // Páginas sin aviso de edad (gracias, 404): continuamos normal.
} else if (localStorage.getItem('Agreste_edad') === 'ok') {
  gate.remove();
} else {
  document.getElementById('btnMayor').addEventListener('click', () => {
    localStorage.setItem('Agreste_edad', 'ok');
    gate.remove();
  });

  document.getElementById('btnMenor').addEventListener('click', () => {
    document.getElementById('gateCaja').innerHTML =
      '<h2>Gracias por tu honestidad</h2><p>Este sitio es exclusivo para mayores de 18 años. Volvé cuando cumplas la mayoría de edad.</p>';
  });
}

// ==== Carrito ====
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem('Agreste_carrito') || '[]');
}

function guardarCarrito(c) {
  localStorage.setItem('Agreste_carrito', JSON.stringify(c));
  actualizarContadorCarrito();
}

function agregarAlCarrito(id, cant = 1) {
  const c = obtenerCarrito();
  const item = c.find(i => i.id === id);
  if (item) item.cant += cant;
  else c.push({ id, cant });
  guardarCarrito(c);
}

function cambiarCantidad(id, delta) {
  const c = obtenerCarrito();
  const item = c.find(i => i.id === id);
  if (!item) return;
  item.cant += delta;
  guardarCarrito(c.filter(i => i.cant > 0));
  pintarCarrito();
}

function quitarDelCarrito(id) {
  guardarCarrito(obtenerCarrito().filter(i => i.id !== id));
  pintarCarrito();
}

function actualizarContadorCarrito() {
  const link = document.getElementById('linkCarrito');
  if (!link) return;
  const total = obtenerCarrito().reduce((s, i) => s + i.cant, 0);
  link.textContent = `Carrito (${total})`;
}

const nav = document.querySelector('.nav');
if (nav) {
  nav.insertAdjacentHTML('beforeend', '<a href="carrito.html" id="linkCarrito">Carrito (0)</a>');
  actualizarContadorCarrito();
}

// ==== Formato de precio (pesos argentinos) ====
function fmtPrecio(n) {
  return '$ ' + Number(n).toLocaleString('es-AR');
}

// ==== Motor de catálogo ====
function tarjetaProducto(p) {
  const precio = p.precio ? fmtPrecio(p.precio) : "Precio a confirmar";
    const foto = p.foto ? `<img src="${p.foto}" alt="${p.nombre}" loading="lazy" decoding="async" style="object-position:${p.fotoPos || 'center'};transform:scale(${p.fotoZoom || 1})"><span class="card-badge">Foto de referencia</span>` : "Foto de la pieza";

  return `
    <article class="card">
      <div class="card-foto">${foto}</div>
      <div class="card-cuerpo">
        <h3>${p.nombre}</h3>
        <p class="card-detalle">${p.detalle}</p>
        <p class="card-precio">${precio} · ${p.modalidad}</p>
        <a class="btn btn-fantasma btn-chico" href="producto.html?id=${p.id}">Ver pieza</a>
      </div>
    </article>`;
}

function pintarCatalogo() {
  const grilla = document.getElementById('grillaProductos');
  if (!grilla) return;
  const lista = grilla.dataset.modo === 'destacados'
    ? PRODUCTOS.filter(p => p.destacado)
    : PRODUCTOS;
  grilla.innerHTML = lista.map(tarjetaProducto).join('');
}

// ==== Ficha de producto ====
function pintarFicha() {
  const cont = document.getElementById('fichaProducto');
  if (!cont) return;

  const id = Number(new URLSearchParams(location.search).get('id'));
  const p = PRODUCTOS.find(x => x.id === id);

  if (!p) {
    cont.innerHTML = '<p class="aviso">Pieza no encontrada. <a href="catalogo.html">Volver al catálogo</a>.</p>';
    return;
  }

  const precio = p.precio ? fmtPrecio(p.precio) : 'Precio a confirmar';
    const foto = p.foto ? `<img src="${p.foto}" alt="${p.nombre}" loading="lazy" decoding="async" style="object-position:${p.fotoPos || 'center'};transform:scale(${p.fotoZoom || 1})">` : 'Foto de la pieza';

  cont.innerHTML = `
    <div class="ficha">
      <div class="ficha-foto">${foto}</div>
      <div class="ficha-datos">
        <p class="overline">${p.linea}</p>
        <h1>${p.nombre}</h1>
        <p class="ficha-detalle">${p.detalle}</p>
        <p class="ficha-precio">${precio} · ${p.modalidad}</p>
        <p class="ficha-desc">${p.descripcion}</p>
        <ul class="ficha-lista">
          <li>Hoja de acero inoxidable con acabado pulido.</li>
          <li>Mango de madera dura con virola de alpaca y pomo de asta.</li>
          <li>Incluye vaina de cuero curtido vegetal cosida a mano.</li>
          <li>Pieza artesanal única: puede presentar variaciones naturales.</li>
        </ul>
        <div class="ficha-acciones">
          <button class="btn btn-primario" id="btnAgregar">Agregar al carrito</button>
          <a class="btn btn-fantasma" href="catalogo.html">Volver al catálogo</a>
        </div>
        <p class="ficha-aviso">Venta exclusiva a mayores de 18 años</p>
      </div>
    </div>`;

  document.getElementById('btnAgregar').addEventListener('click', () => {
    agregarAlCarrito(p.id);
    const btn = document.getElementById('btnAgregar');
    btn.textContent = 'Agregado ✓';
    setTimeout(() => { btn.textContent = 'Agregar al carrito'; }, 1500);
  });

  // Datos estructurados de la pieza visible
  document.querySelectorAll('script[data-ficha]').forEach(s => s.remove());
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.setAttribute('data-ficha', '1');
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': p.nombre,
    'description': p.descripcion,
    'offers': { '@type': 'Offer', 'priceCurrency': 'ARS', 'price': p.precio || 0,
      'availability': (p.modalidad || '').includes('Stock') ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder' }
  });
  document.head.appendChild(ld);
}

// ==== Página del carrito ====
function pintarCarrito() {
  const cont = document.getElementById('contCarrito');
  if (!cont) return;

  const c = obtenerCarrito();

  if (c.length === 0) {
    cont.innerHTML = '<p class="aviso">Tu carrito está vacío. <a href="catalogo.html">Ver catálogo</a>.</p>';
    return;
  }

  const filas = c.map(item => {
    const p = PRODUCTOS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="carrito-item" data-id="${p.id}">
        <div class="carrito-datos">
          <h3>${p.nombre}</h3>
          <p class="card-detalle">${p.detalle}</p>
          <p class="card-precio">${p.precio ? fmtPrecio(p.precio) : 'Precio a confirmar'}</p>
        </div>
        <div class="carrito-cant">
          <button class="btn-cant" data-accion="menos" aria-label="Disminuir cantidad de ${p.nombre}">−</button>
          <span aria-live="polite">${item.cant}</span>
          <button class="btn-cant" data-accion="mas" aria-label="Aumentar cantidad de ${p.nombre}">+</button>
        </div>
        <div class="carrito-sub">${p.precio ? fmtPrecio(p.precio * item.cant) : '—'}</div>
        <button class="carrito-quitar" data-accion="quitar" aria-label="Quitar ${p.nombre} del carrito">Quitar</button>
      </div>`;
  }).join('');

  const total = c.reduce((s, i) => {
    const p = PRODUCTOS.find(x => x.id === i.id);
    return s + (p && p.precio ? p.precio * i.cant : 0);
  }, 0);

  cont.innerHTML = `
    <h1 class="carrito-titulo">Tu carrito</h1>
    <div class="carrito-lista">${filas}</div>
    <div class="carrito-resumen">
      <p class="carrito-total">Total estimado: <strong>${fmtPrecio(total)}</strong></p>
      <p class="carrito-nota">El costo de envío se confirma al momento del pedido.</p>
      <div class="carrito-acciones">
        <a class="btn btn-primario" href="checkout.html">Continuar pedido</a>
        <button class="btn btn-fantasma" id="btnVaciar">Vaciar carrito</button>
      </div>
    </div>`;

  cont.querySelectorAll('.carrito-item').forEach(el => {
    const id = Number(el.dataset.id);
    el.querySelector('[data-accion="mas"]').addEventListener('click', () => cambiarCantidad(id, 1));
    el.querySelector('[data-accion="menos"]').addEventListener('click', () => cambiarCantidad(id, -1));
    el.querySelector('[data-accion="quitar"]').addEventListener('click', () => quitarDelCarrito(id));
  });

  document.getElementById('btnVaciar').addEventListener('click', () => {
    localStorage.removeItem('Agreste_carrito');
    actualizarContadorCarrito();
    pintarCarrito();
  });
}

// ==== Checkout con pedido por WhatsApp ====
function pintarCheckout() {
  const cont = document.getElementById('contCheckout');
  if (!cont) return;

  const c = obtenerCarrito();

  if (c.length === 0) {
    cont.innerHTML = '<p class="aviso">Tu carrito está vacío. <a href="catalogo.html">Ver catálogo</a>.</p>';
    return;
  }

  const resumen = c.map(i => {
    const p = PRODUCTOS.find(x => x.id === i.id);
    if (!p) return '';
    return `<li>${p.nombre} × ${i.cant} — ${p.precio ? fmtPrecio(p.precio * i.cant) : 'Precio a confirmar'}</li>`;
  }).join('');

  const total = c.reduce((s, i) => {
    const p = PRODUCTOS.find(x => x.id === i.id);
    return s + (p && p.precio ? p.precio * i.cant : 0);
  }, 0);

  cont.innerHTML = `
    <h1 class="carrito-titulo">Finalizar pedido</h1>
    <div class="checkout-grid">
      <form id="formCheckout" class="form" novalidate>
        <input type="text" id="fEmpresa" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label>Nombre y apellido *
          <input type="text" id="fNombre">
        </label>
        <label>WhatsApp / teléfono *
          <input type="tel" id="fTelefono">
        </label>
        <label>Email (opcional)
          <input type="email" id="fEmail">
        </label>
        <label>Provincia y localidad *
          <input type="text" id="fLocalidad">
        </label>
        <label>Modalidad de entrega *
          <select id="fEnvio">
            <option value="Envío a domicilio (costo a confirmar)">Envío a domicilio (costo a confirmar)</option>
            <option value="Retiro en Villa Gesell">Retiro en Villa Gesell</option>
          </select>
        </label>
        <label>Notas del pedido (personalización, grabado, consultas)
          <textarea id="fNotas" rows="3"></textarea>
        </label>
        <label class="form-check">
          <input type="checkbox" id="fEdad">
          <span>Declaro que soy mayor de 18 años y acepto la política de venta responsable.</span>
        </label>
        <p class="form-error" id="formError" aria-live="assertive"></p>
        <button class="btn btn-primario" type="submit">Enviar pedido por WhatsApp</button>
      </form>
      <aside class="carrito-resumen">
        <h3>Tu pedido</h3>
        <ul class="checkout-resumen">${resumen}</ul>
        <p class="carrito-total">Total estimado: <strong>${fmtPrecio(total)}</strong></p>
        <p class="carrito-nota">El envío se coordina por WhatsApp.</p>
      </aside>
    </div>`;

  document.getElementById('formCheckout').addEventListener('submit', e => {
    e.preventDefault();

    // Anti-spam desactivado: el autocompletado del navegador llenaba el campo trampa
    // y bloqueaba pedidos reales. La confirmación humana por WhatsApp es el filtro.

    const nombre = document.getElementById('fNombre').value.trim();
    const tel = document.getElementById('fTelefono').value.trim();
    const loc = document.getElementById('fLocalidad').value.trim();
    const envio = document.getElementById('fEnvio').value;
    const notas = document.getElementById('fNotas').value.trim();
    const edad = document.getElementById('fEdad').checked;
    const err = document.getElementById('formError');

    if (!nombre || !tel || !loc) {
      err.textContent = 'Completá los campos obligatorios (*).';
      return;
    }
    if (!edad) {
      err.textContent = 'Debés confirmar que sos mayor de 18 años.';
      return;
    }
    err.textContent = '';

    const lineas = c.map(i => {
      const p = PRODUCTOS.find(x => x.id === i.id);
      return `• ${p.nombre} x${i.cant} (${p.precio ? fmtPrecio(p.precio * i.cant) : 'precio a confirmar'})`;
    });

    const msg =
`Hola Agreste, quiero hacer este pedido:
${lineas.join('\n')}
Total estimado: ${fmtPrecio(total)}

Mis datos:
Nombre: ${nombre}
Teléfono: ${tel}
Localidad: ${loc}
Entrega: ${envio}
${notas ? 'Notas: ' + notas : ''}

Declaro que soy mayor de 18 años.`;

    const btnEnviar = document.querySelector('#formCheckout button[type="submit"]');
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<span class="spinner" aria-hidden="true"></span>Enviando…';

    localStorage.setItem('agreste_pedido', msg);
    localStorage.removeItem('Agreste_carrito');
    actualizarContadorCarrito();
    setTimeout(function () { location.href = 'gracias.html'; }, 900);
  });
}

// ==== Contenido en la nube (Decap CMS) ====
// Si el sitio está publicado, lee data/contenido.json (lo que edita el cliente).
// Si estás en tu PC (archivo local), usa los datos de fábrica de data.js.
function cargarContenido() {
  return fetch('data/contenido.json')
    .then(function (r) { if (!r.ok) throw new Error('sin contenido'); return r.json(); })
    .then(function (json) {
      if (json.whatsapp) WHATSAPP_VENDEDOR = json.whatsapp;
      if (Array.isArray(json.productos) && json.productos.length) {
        json.productos.forEach(function (p, i) { if (!p.id) p.id = i + 1; });
        PRODUCTOS = json.productos;
      }
      if (json.textos) TEXTOS_CLIENTE = json.textos;
    })
    .catch(function () {});
}

cargarContenido().then(function () {
  aplicarTextos();
  pintarCatalogo();
  pintarFicha();
  pintarCarrito();
  pintarCheckout();
});

// ==== Año automático en el footer ====
const elAnio = document.getElementById('anio');
if (elAnio) elAnio.textContent = new Date().getFullYear();
// ==== Botón de WhatsApp en la página El taller ====
const btnTaller = document.getElementById('btnWhatsAppTaller');
if (btnTaller) {
  btnTaller.href = 'https://wa.me/' + WHATSAPP_VENDEDOR + '?text=' + encodeURIComponent('Hola Agreste, quiero hacer una consulta.');
}
// ==== Sistema de edición: textos editables ====
const TEXTOS_BASE = {
  marca_sub:        { sel: '.marca-sub', etiqueta: 'Encabezado · Subtítulo de la marca', def: 'Cuchillería artesanal' },
  gate_texto:       { sel: '.age-gate-caja p:not(.age-gate-marca)', etiqueta: 'Aviso de edad · Texto', def: 'Este sitio exhibe cuchillos artesanales destinados a personas adultas. Confirmá que sos mayor de edad para continuar.' },
  footer_tagline:   { sel: '.footer-grid > div:first-child > p:last-of-type', etiqueta: 'Footer · Descripción del taller', def: 'Cuchillería artesanal · Villa Gesell, Argentina.' },
  inicio_overline:  { sel: '[data-pagina="inicio"] .hero .overline', etiqueta: 'Inicio · Línea superior', def: 'Hecho a mano en Villa Gesell, Argentina' },
  inicio_titulo:    { sel: '[data-pagina="inicio"] .hero h1', etiqueta: 'Inicio · Título principal', def: 'Cuchillos criollos con alma de acero y madera' },
  inicio_bajada:    { sel: '[data-pagina="inicio"] .hero-bajada', etiqueta: 'Inicio · Texto bajo el título', def: 'Piezas únicas de acero inoxidable, mango de madera dura y vaina de cuero cosida a mano. Tradición gaucha para el asado, el campo y la colección.' },
  inicio_val1_t:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(1) h3', etiqueta: 'Inicio · Valor 1 título', def: 'Hecho a mano' },
  inicio_val1_p:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(1) p', etiqueta: 'Inicio · Valor 1 texto', def: 'Cada pieza se trabaja y termina de forma artesanal. No hay dos cuchillos iguales.' },
  inicio_val2_t:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(2) h3', etiqueta: 'Inicio · Valor 2 título', def: 'Materiales nobles' },
  inicio_val2_p:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(2) p', etiqueta: 'Inicio · Valor 2 texto', def: 'Acero inoxidable, maderas duras, alpaca y asta seleccionados para durar generaciones.' },
  inicio_val3_t:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(3) h3', etiqueta: 'Inicio · Valor 3 título', def: 'Vaina de cuero' },
  inicio_val3_p:    { sel: '[data-pagina="inicio"] .valores-grid .valor:nth-child(3) p', etiqueta: 'Inicio · Valor 3 texto', def: 'Incluye vaina de cuero curtido vegetal, cosida a mano, lista para el cinturón.' },
  inicio_dest_t:    { sel: '[data-pagina="inicio"] .destacados h2', etiqueta: 'Inicio · Título destacados', def: 'Piezas destacadas' },
  inicio_taller_t:  { sel: '[data-pagina="inicio"] .taller h2', etiqueta: 'Inicio · Título sección taller', def: 'Tradición y oficio en cada detalle' },
  inicio_taller_p:  { sel: '[data-pagina="inicio"] .taller p:not(.overline)', etiqueta: 'Inicio · Texto sección taller', def: 'Detrás de cada cuchillo hay horas de trabajo: selección del acero, temple de la hoja, tallado del mango, pulido y costura de la vaina. Un oficio que se transmite y se perfecciona pieza tras pieza.' },
  cat_titulo:       { sel: '[data-pagina="catalogo"] .hero-chico h1', etiqueta: 'Catálogo · Título', def: 'Piezas disponibles' },
  cat_bajada:       { sel: '[data-pagina="catalogo"] .hero-bajada', etiqueta: 'Catálogo · Texto', def: 'Cada cuchillo es una pieza única, hecha a mano. Si buscás algo personalizado, también se trabajan piezas bajo pedido.' },
  taller_titulo:    { sel: '[data-pagina="taller"] .hero-chico h1', etiqueta: 'El taller · Título', def: 'Oficio, acero y cuero en Villa Gesell' },
  taller_bajada:    { sel: '[data-pagina="taller"] .hero-bajada', etiqueta: 'El taller · Texto', def: 'Agreste es una cuchillería artesanal de Villa Gesell. Cada pieza se trabaja a mano, con materiales nobles y técnicas tradicionales: del temple de la hoja a la costura de la vaina.' },
  taller_serv_t:    { sel: '[data-pagina="taller"] .servicios h2', etiqueta: 'El taller · Título servicios', def: 'Servicios del taller' },
  taller_cont_t:    { sel: '[data-pagina="taller"] .contacto h2', etiqueta: 'El taller · Título contacto', def: 'Hablamos' },
  taller_cont_p:    { sel: '[data-pagina="taller"] .contacto p:not(.contacto-dato):not(.overline)', etiqueta: 'El taller · Texto contacto', def: 'Consultas por piezas, encargos personalizados, restauraciones o afilados: escribinos y te respondemos desde el taller.' }
};

function aplicarTextos() {
  const cambios = (typeof TEXTOS_CLIENTE !== 'undefined') ? TEXTOS_CLIENTE : {};
  for (const clave in TEXTOS_BASE) {
    if (cambios[clave]) {
      const el = document.querySelector(TEXTOS_BASE[clave].sel);
      if (el) el.textContent = cambios[clave];
    }
  }
}
// aplicarTextos() ahora se ejecuta después de cargar el contenido (ver abajo).
// ==== Auditoría: UX, SEO técnico y accesibilidad ====
(function () {
  const pagina = document.body.dataset.pagina;

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'contenido';
  if (!document.querySelector('.skip-link')) {
    document.body.insertAdjacentHTML('afterbegin', '<a class="skip-link" href="#contenido">Saltar al contenido</a>');
  }

  if (pagina !== 'admin' && !document.querySelector('.cta-sticky')) {
    document.body.insertAdjacentHTML('beforeend', '<a class="cta-sticky" href="catalogo.html">Ver catálogo de piezas</a>');
  }

  if (!localStorage.getItem('agreste_cookies')) {
    document.body.insertAdjacentHTML('beforeend',
      '<div class="cookie-bar" role="region" aria-label="Aviso de privacidad">' +
      '<span>Usamos almacenamiento local para el carrito y la verificación de edad. Más info en <a href="legal.html#privacidad">Política de privacidad</a>.</span>' +
      '<button class="btn btn-primario btn-chico" id="btnCookies">Entendido</button></div>');
    document.getElementById('btnCookies').addEventListener('click', function () {
      localStorage.setItem('agreste_cookies', 'ok');
      document.querySelector('.cookie-bar').remove();
    });
  }

  const nav = document.querySelector('.nav');
  if (nav && !nav.getAttribute('aria-label')) nav.setAttribute('aria-label', 'Navegación principal');
  const gateCaja = document.querySelector('.age-gate-caja');
  if (gateCaja) { gateCaja.setAttribute('role', 'dialog'); gateCaja.setAttribute('aria-modal', 'true'); }

  if (pagina === 'gracias') {
    const btn = document.getElementById('btnReabrirWhats');
    const msg = localStorage.getItem('agreste_pedido');
    if (btn && msg) btn.href = 'https://wa.me/' + WHATSAPP_VENDEDOR + '?text=' + encodeURIComponent(msg);
    else if (btn) btn.remove();
  }
})();