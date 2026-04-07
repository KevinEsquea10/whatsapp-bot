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
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📲 Escanea este QR:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ Conectado a WhatsApp");
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("❌ Conexión cerrada. Reconectando:", shouldReconnect);

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
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

    const number = "573044151031"; // TU NÚMERO
    const message = "Mensaje de prueba 🚀";

    try {
        await sock.sendMessage(number + "@s.whatsapp.net", {
            text: message
        });

        res.send("✅ Mensaje enviado");

    } catch (error) {
        console.error(error);
        res.send("❌ Error al enviar");
    }});

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});

