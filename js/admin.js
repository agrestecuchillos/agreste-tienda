// ==== Panel de edición ====
// ==== Acceso al panel (usuario y contraseña) ====
const loginGate = document.getElementById('loginGate');
const panelContenido = document.getElementById('panelContenido');

if (sessionStorage.getItem('agreste_admin') === 'ok') {
  loginGate.remove();
} else {
  panelContenido.classList.add('oculto');
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    const usuarioOk = (typeof USUARIO_ADMIN !== 'undefined') ? USUARIO_ADMIN : 'admin';
    const claveOk = (typeof CLAVE_ADMIN !== 'undefined') ? CLAVE_ADMIN : 'agreste2024';
    if (u === usuarioOk && p === claveOk) {
      sessionStorage.setItem('agreste_admin', 'ok');
      loginGate.remove();
      panelContenido.classList.remove('oculto');
    } else {
      document.getElementById('loginError').textContent = 'Usuario o contraseña incorrectos.';
    }
  });
}

const btnSalir = document.getElementById('btnSalir');
if (btnSalir) btnSalir.addEventListener('click', e => {
  e.preventDefault();
  sessionStorage.removeItem('agreste_admin');
  location.reload();
});
let lista = PRODUCTOS.map(p => ({ ...p }));
let editandoId = null;
let fotoNueva = '';

const listaProductos = document.getElementById('listaProductos');
const form = document.getElementById('formProducto');

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ---- Lista de productos ----
function pintarLista() {
  listaProductos.innerHTML = lista.map(p => `
    <div class="admin-item">
      <div>
        <strong>${escapeHtml(p.nombre)}</strong>
        <span class="admin-detalle">${p.precio ? fmtPrecio(p.precio) : 'Precio a confirmar'} · ${escapeHtml(p.modalidad)}</span>
      </div>
      <div class="admin-acciones">
        <button class="btn btn-fantasma btn-chico" data-edit="${p.id}">Editar</button>
        <button class="btn btn-peligro btn-chico" data-del="${p.id}">Eliminar</button>
      </div>
    </div>`).join('') || '<p>No hay productos. Agregá el primero.</p>';

  listaProductos.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => cargarForm(Number(b.dataset.edit))));
  listaProductos.querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => {
      if (confirm('¿Eliminar este producto del catálogo?')) {
        lista = lista.filter(p => p.id !== Number(b.dataset.del));
        pintarLista();
      }
    }));
}

// ---- Formulario de producto ----
function cargarForm(id) {
  const p = id ? lista.find(x => x.id === id) : null;
  editandoId = id || null;
  document.getElementById('pNombre').value = p ? p.nombre : '';
  document.getElementById('pLinea').value = p ? p.linea : 'Línea Criolla';
  document.getElementById('pDetalle').value = p ? p.detalle : '';
  document.getElementById('pDesc').value = p ? p.descripcion : '';
  document.getElementById('pPrecio').value = p && p.precio ? p.precio : '';
  document.getElementById('pModalidad').value = p ? p.modalidad : 'Stock inmediato';
  document.getElementById('pDestacado').checked = p ? !!p.destacado : true;
  fotoNueva = p && p.foto ? p.foto : '';
  document.getElementById('fotoInfo').textContent = fotoNueva ? 'Foto actual: sí (podés subir otra)' : 'Sin foto: se mostrará el recuadro de referencia';
  document.getElementById('pFoto').value = '';
  form.classList.remove('oculto');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('btnAgregarProd').addEventListener('click', () => cargarForm(null));
document.getElementById('btnCancelar').addEventListener('click', () => {
  form.classList.add('oculto');
  editandoId = null;
  fotoNueva = '';
});

document.getElementById('pFoto').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 800 * 1024) {
    alert('Aviso: la imagen pesa más de 800 KB. Conviene usar fotos livianas (JPG) para que el archivo de contenido no quede pesado.');
  }
  const reader = new FileReader();
  reader.onload = () => {
    fotoNueva = reader.result;
    document.getElementById('fotoInfo').textContent = 'Foto nueva cargada ✓';
  };
  reader.readAsDataURL(file);
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const nombre = document.getElementById('pNombre').value.trim();
  if (!nombre) { alert('Poné al menos el nombre del producto.'); return; }

  const p = {
    id: editandoId || (lista.length ? Math.max(...lista.map(x => x.id)) + 1 : 1),
    nombre: nombre,
    linea: document.getElementById('pLinea').value.trim() || 'Línea Criolla',
    detalle: document.getElementById('pDetalle').value.trim(),
    descripcion: document.getElementById('pDesc').value.trim(),
    precio: document.getElementById('pPrecio').value.trim() ? Number(document.getElementById('pPrecio').value) : null,
    foto: fotoNueva,
    modalidad: document.getElementById('fModalidad') ? '' : (document.getElementById('pModalidad').value.trim() || 'Stock inmediato'),
    destacado: document.getElementById('pDestacado').checked
  };

  if (editandoId) lista = lista.map(x => x.id === editandoId ? p : x);
  else lista.push(p);

  pintarLista();
  form.classList.add('oculto');
  editandoId = null;
  fotoNueva = '';
});

// ---- Textos editables ----
const listaTextos = document.getElementById('listaTextos');
listaTextos.innerHTML = Object.keys(TEXTOS_BASE).map(k => `
  <label class="admin-campo">${TEXTOS_BASE[k].etiqueta}
    <input type="text" data-txt="${k}" value="${escapeHtml((typeof TEXTOS_CLIENTE !== 'undefined' && TEXTOS_CLIENTE[k]) ? TEXTOS_CLIENTE[k] : TEXTOS_BASE[k].def)}">
  </label>`).join('');

// ---- WhatsApp ----
document.getElementById('fWhats').value = WHATSAPP_VENDEDOR;

// ---- Guardar todo: descarga contenido.js ----
document.getElementById('btnGuardar').addEventListener('click', () => {
  const textos = {};
  document.querySelectorAll('[data-txt]').forEach(inp => {
    if (inp.value.trim()) textos[inp.dataset.txt] = inp.value.trim();
  });

  const partes = [];
  partes.push('// =====================================================');
  partes.push('// CONTENIDO DEL CLIENTE — generado por el Panel de edición');
  partes.push('// Reemplazá el archivo js/contenido.js de la web por este.');
  partes.push('// =====================================================');
  partes.push('');
  partes.push('var WHATSAPP_VENDEDOR = "' + document.getElementById('fWhats').value.trim() + '";');
  partes.push('');
  partes.push('var PRODUCTOS = ' + JSON.stringify(lista, null, 2) + ';');
  partes.push('');
  partes.push('var TEXTOS_CLIENTE = ' + JSON.stringify(textos, null, 2) + ';');
  partes.push('');

  const blob = new Blob([partes.join('\n')], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contenido.js';
  a.click();
  URL.revokeObjectURL(a.href);

  document.getElementById('guardadoOk').textContent =
    'Listo: se descargó contenido.js. Copialo a la carpeta js/ de la web (reemplazando el existente) y recargá el sitio con Ctrl + F5.';
});

pintarLista();