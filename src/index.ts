import htmlPuntajes from '../public/puntajes.html';
import htmlFixture from '../public/fixture.html';
import htmlRegistrar from '../public/registrar.html';
import cssContent from './estilos.css';

// URL Oficial de tu Web App de Google Apps Script conectada a tu Sheets
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVCfzMa_iJEEHn8Hs1KBUBtkk6DfhT58UK77a2QdscxIiH8EbnU8_4NcaYG5Dz4ttjsA/exec?page=api_puntos";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.includes(".png")) {
      try {
        // En Cloudflare Workers moderno, env.ASSETS.fetch extrae el archivo de tus carpetas locales
        const assetResponse = await env.ASSETS.fetch(request);
        
        // Retornamos la respuesta forzando las cabeceras de imagen seguras
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400", // Guarda la foto en caché por 1 día
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (assetError) {
        return new Response("Asset no mapeado en Wrangler", { status: 404 });
      }
    }
    // =========================================================================
    // --- 📊 MOTOR DE API ASÍNCRONO INTERMEDIO (GET / POST) ---
    // =========================================================================
    if (url.pathname === "/api/puntajes") {
      
      // CONFIGURACIÓN CORS: Permite que el navegador no bloquee las peticiones nativas
      const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      };

      // Manejo de peticiones de pre-vuelo (Preflight OPTIONS)
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // ACCIÓN POST: El Worker recibe los puntos del formulario y los inyecta al Sheets
      if (request.method === "POST") {
        try {
          const bodyData = await request.text();
          
          // Reenviamos la data en caliente hacia el servidor de Google con una petición nativa
          const googleResponse = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: bodyData
          });
          
          const resultadoGoogle = await googleResponse.text();
          return new Response(resultadoGoogle, { headers: corsHeaders });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
        }
      }

      // ACCIÓN GET: Jala los puntajes en vivo de la celda I36
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const puntos = await response.json();
      return new Response(JSON.stringify(puntos), { headers: corsHeaders });
    } catch (e: any) {
      // DIAGNÓSTICO EN VIVO: Si la conexión a Google falla, te pintará el error en la web en lugar de números falsos
      const errorResponse = { 
        white: 0, blue: 0, orange: 0, green: 0, 
        error_detectado: e.message,
        url_revisada: APPS_SCRIPT_URL 
      };
      return new Response(JSON.stringify(errorResponse), { headers: corsHeaders });
    }
  }

    // =========================================================================
    // --- 📂 ENRUTADOR DE VISTAS (HTML NATIVO SEPARADO) ---
    // =========================================================================
    if (url.pathname === "/registrar") {
      try {
        // El Worker jala en vivo tu HTML perfecto y masivo de Pages con tus 4 escudos
        const responsePages = await fetch("https://pages.dev");
        const htmlLimpio = await responsePages.text();
        
        return new Response(htmlLimpio, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      } catch (err: any) {
        return new Response(`❌ Error en el puente perimetral: ${err.message}`, { status: 500 });
      }
    }

    if (url.pathname === "/fixture") {
      const paginaFixture = htmlFixture.replace('<!-- STYLES_PLACEHOLDER -->', `<style>${cssContent}</style>`);
      return new Response(paginaFixture, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Home por defecto
    const paginaPuntajes = htmlPuntajes.replace('<!-- STYLES_PLACEHOLDER -->', `<style>${cssContent}</style>`);
    return new Response(paginaPuntajes, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};
