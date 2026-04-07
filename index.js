const express = require("express");
const qrcode = require("qrcode-terminal");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const app = express();
app.use(express.json());
const QRCode = require("qrcode");

let latestQR = null;
const PORT = process.env.PORT || 3000;

let sock;

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion(); // 🔥 CLAVE

    sock = makeWASocket({
        auth: state,
        version,
    });

    // 🔥 MANEJO COMPLETO DE CONEXIÓN
    sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
        console.log("QR generado");

        // 🔥 Generar imagen base64
        latestQR = await QRCode.toDataURL(qr);
    }

    if (connection === "open") {
        console.log("✅ Conectado a WhatsApp");
        latestQR = null;
    }
});
}

startBot();


// 🚀 ENDPOINT PARA ENVIAR MENSAJES
app.post("/send", async (req, res) => {
    const { number, message } = req.body;

    try {
        await sock.sendMessage(number + "@s.whatsapp.net", {
            text: message
        });

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.json({ success: false });
    }
});

app.get("/test", async (req, res) => {

    const number = "573003674200"; // cambia por tu número
    const message = "Mensaje de prueba desde navegador 🚀";

    try {
        await sock.sendMessage(number + "@s.whatsapp.net", {
            text: message
        });

        res.send("✅ Mensaje enviado");

    } catch (error) {
        console.error(error);
        res.send("❌ Error al enviar");
    }
});

app.get("/qr", (req, res) => {

    if (!latestQR) {
        return res.send("No hay QR disponible o ya estás conectado");
    }

    res.send(`
        <h2>Escanea el QR</h2>
        <img src="${latestQR}" />
    `);
});

app.listen(PORT, () => {
    console.log("Servidor corriendo...");
});
