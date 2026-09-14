import htmlPuntajes from './puntajes.html';
import htmlFixture from './fixture.html';
import htmlRegistrar from './registrar.html';
import cssContent from './estilos.css';

// URL Oficial de tu Web App de Google Apps Script conectada a tu Sheets
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

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
      } catch (e) {
        // Fallback de contingencia por si Google se satura
        const fallback = { white: 150, blue: 180, orange: 80, green: 130 };
        return new Response(JSON.stringify(fallback), { headers: corsHeaders });
      }
    }

    // =========================================================================
    // --- 📂 ENRUTADOR DE VISTAS (HTML NATIVO SEPARADO) ---
    // =========================================================================
    if (url.pathname === "/registrar") {
      const paginaRegistrar = htmlRegistrar.replace('<!-- STYLES_PLACEHOLDER -->', `<style>${cssContent}</style>`);
      return new Response(paginaRegistrar, { headers: { "Content-Type": "text/html; charset=utf-8" } });
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
