const express = require("express");
const QRCode = require("qrcode");
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
let qrGlobal = ""; // 🔥 aquí guardamos el QR en imagen

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        auth: state,
        version,
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("📲 QR recibido, disponible en /qr");

            // 🔥 Convertimos QR a imagen base64
            qrGlobal = await QRCode.toDataURL(qr);
        }

        if (connection === "open") {
            console.log("✅ Conectado a WhatsApp");
            qrGlobal = ""; // limpiamos QR
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


// 🔥 ENDPOINT PARA VER EL QR
app.get("/qr", (req, res) => {
    if (!qrGlobal) {
        return res.send("⚠️ No hay QR disponible o ya estás conectado");
    }

    res.send(`
        <h2>Escanea el QR con WhatsApp</h2>
        <img src="${qrGlobal}" />
    `);
});


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


// 🧪 ENDPOINT DE PRUEBA
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
    }
});

app.listen(PORT, () => {
    console.log("🚀 Servidor corriendo en puerto " + PORT);
});