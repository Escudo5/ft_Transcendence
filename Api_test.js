const axios = require('axios');
const fs = require('fs');

// 🔑 TUS LLAVES
const CLIENT_ID = 'u-s4t2ud-85745739c040c37d065eeef72dafbd19dea1e46b50172daac4f20c1907d34b47';
const CLIENT_SECRET = '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';

async function obtenerToken() {
    try {
        console.log("🔑 Intentando pedir la pulsera VIP a 42...");
        
        const respuesta = await axios.post('https://api.intra.42.fr/oauth/token', {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });

        const token = respuesta.data.access_token;
        console.log("✅ ¡Pulsera conseguida con éxito! Tu Token es válido.");
        
        await obtenerDatosMiPerfil(token);

    } catch (error) {
        console.error("❌ Error en la autenticación:", error.response ? error.response.data : error.message);
    }
} // 👈 Aquí se cierra correctamente obtenerToken

// 1. LA FUNCIÓN DE LA COALICIÓN
async function obtenerCoalicion(token, login) {
    try {
        const respuesta = await axios.get(`https://api.intra.42.fr/v2/users/${login}/coalitions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (respuesta.data && respuesta.data.length > 0) {
            console.log(`🛡️ Coalición: ${respuesta.data[0].name}`);
            console.log(`🎨 Color Hex: ${respuesta.data[0].color}`);
            console.log(`🖼️ Logo URL: ${respuesta.data[0].image_url}`);
        } else {
            console.log(`🛡️ Coalición: Ninguna (Sin facción)`);
        }
    } catch (error) {
        console.error("❌ Error al pedir la coalición:", error.message);
    }
}

// 2. TU FUNCIÓN PRINCIPAL
async function obtenerDatosMiPerfil(token) {
    try {
        console.log("📡 Conectando al búnker para extraer estadísticas del cromo...");
        
        const respuesta = await axios.get('https://api.intra.42.fr/v2/users/osmunoz-', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("\n🃏 --- FICHA TÉCNICA PARA EL CROMO TCG --- 🃏");
        const login = respuesta.data.login;
        console.log(`👤 Login: ${login}`);

        let tituloFinal = "Sin título";
        if (respuesta.data.titles && respuesta.data.titles.length > 0) {
            const ultimoTitulo = respuesta.data.titles[respuesta.data.titles.length - 1].name;
            tituloFinal = ultimoTitulo.replace('%login', login);
        }
        console.log(`👑 Título: ${tituloFinal}`);
        console.log(`📸 URL Foto: ${respuesta.data.image?.link || "https://via.placeholder.com/200"}`);

        const infoCursus = respuesta.data.cursus_users.find(c => c.cursus.slug === '42cursus');
        console.log(`📊 Cursus Level: ${infoCursus ? infoCursus.level : "0.00"}`);
        console.log(`📝 Eval Points: ${respuesta.data.correction_point}`);
        console.log(`💰 Altarians: ${respuesta.data.wallet}`);

        // 🔥 Llamamos aquí a la coalición
        await obtenerCoalicion(token, login);
        
        console.log("------------------------------------------\n");

    } catch (error) {
        console.error("❌ Error al procesar el perfil:", error.message);
    }
}

// Arrancamos el script
obtenerToken();