const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar Twilio
const accountSid = '<SID>'; // Tu Account SID de Twilio
const authToken = '<AuthKey>'; // Tu Auth Token de Twilio
const client = new twilio(accountSid, authToken);

// Configurar SQLite
let db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite en memoria.');

  // Crear tablas y añadir datos de ejemplo
  db.serialize(() => {
    db.run(`CREATE TABLE peluqueros (
      id INTEGER PRIMARY KEY,
      nombre TEXT,
      horario_inicio TEXT,
      horario_fin TEXT,
      tiempo_corte INTEGER
    )`);

    db.run(`CREATE TABLE citas (
      id INTEGER PRIMARY KEY,
      peluquero_id INTEGER,
      cliente TEXT,
      horario TEXT,
      UNIQUE(peluquero_id, horario),  -- Para asegurar que no se pisen los turnos en el mismo horario
      FOREIGN KEY (peluquero_id) REFERENCES peluqueros (id)
    )`);

    db.run(`INSERT INTO peluqueros (nombre, horario_inicio, horario_fin, tiempo_corte)
            VALUES ('Juan', '09:00', '18:00', 30)`);
    db.run(`INSERT INTO peluqueros (nombre, horario_inicio, horario_fin, tiempo_corte)
            VALUES ('Ana', '10:00', '19:00', 45)`);
  });
});

// Endpoint para recibir mensajes de WhatsApp
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body.toLowerCase();
  const from = req.body.From;
  let responseMsg = 'No entendí tu mensaje. Por favor, intenta de nuevo.';

  if (incomingMsg.includes('reservar')) {
    const parts = incomingMsg.split(' ');
    const nombrePeluquero = parts[1];
    const horario = parts[2];

    // Consultar el peluquero en la base de datos
    try {
      const row = await consultarPeluquero(nombrePeluquero);

      if (row) {
        // Verificar si el horario ya está reservado
        const turnoReservado = await verificarTurnoReservado(row.id, horario);
        
        if (turnoReservado) {
          responseMsg = `El turno para las ${horario} con ${nombrePeluquero} ya está reservado. Por favor, elige otro horario.`;
        } else {
          // Lógica para reservar el turno
          await reservarTurno(row.id, from, horario);
          responseMsg = `Tu turno con ${nombrePeluquero} ha sido reservado para las ${horario}.`;
        }
      } else {
        responseMsg = `No se encontró un peluquero con el nombre ${nombrePeluquero}.`;
      }
    } catch (err) {
      console.error('Error al consultar o reservar:', err.message);
      responseMsg = 'Hubo un error al reservar tu turno. Por favor, intenta de nuevo.';
    }
  }

  // Enviar respuesta al cliente de WhatsApp
  try {
    await enviarRespuesta(from, responseMsg);
    console.log('Respuesta enviada correctamente:', responseMsg);
  } catch (err) {
    console.error('Error al enviar la respuesta:', err.message);
  }

  res.sendStatus(200);
});

// Función para consultar peluquero en la base de datos
function consultarPeluquero(nombrePeluquero) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, horario_inicio, horario_fin, tiempo_corte FROM peluqueros WHERE LOWER(nombre) = LOWER(?)`, [nombrePeluquero], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Función para verificar si el turno está reservado
function verificarTurnoReservado(peluqueroId, horario) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id FROM citas WHERE peluquero_id = ? AND horario = ?`, [peluqueroId, horario], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? true : false); // Retorna true si el turno está reservado, false si no lo está
      }
    });
  });
}

// Función para reservar turno en la base de datos
function reservarTurno(peluqueroId, cliente, horario) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO citas (peluquero_id, cliente, horario) VALUES (?, ?, ?)`,
      [peluqueroId, cliente, horario], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
  });
}

// Función para enviar respuesta al cliente de WhatsApp
async function enviarRespuesta(to, message) {
  try {
    await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886', // Tu número de WhatsApp de Twilio
      to: to
    });
  } catch (err) {
    throw new Error(`Error al enviar mensaje de WhatsApp: ${err.message}`);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
