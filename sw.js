const CACHE = 'vanguard-pwa-v4';
// Destino del menú Compartir de Android (share_target del manifest)
const RUTA_COMPARTIR = /\/compartir$/;
const PAGINA = 'index.html';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'compartido').map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // APIs y CDN: los gestiona el navegador
  if (e.request.method === 'POST' && RUTA_COMPARTIR.test(url.pathname)) {
    e.respondWith(recibirCaptura(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Guarda la imagen compartida y abre la app para leerla
async function recibirCaptura(request) {
  try {
    const datos = await request.formData();
    const archivo = datos.get('captura');
    if (archivo) {
      const c = await caches.open('compartido');
      await c.put('captura-compartida', new Response(archivo, { headers: { 'Content-Type': archivo.type || 'image/jpeg' } }));
    }
  } catch (err) {}
  return Response.redirect(new URL(PAGINA + '?compartido=1', self.registration.scope).href, 303);
}
