const admin = require('firebase-admin');

// Leemos las credenciales ocultas desde GitHub Actions
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializamos Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const remoteConfig = admin.remoteConfig();

async function updateTimestamp() {
  try {
    // 1. Obtenemos la configuración actual de Firebase
    const template = await remoteConfig.getTemplate();

    // 2. Obtenemos la fecha actual en formato ISO (ej: 2024-03-25T14:30:00Z)
    const now = new Date().toISOString();

    // 3. Modificamos o creamos el parámetro de la fecha
    if (!template.parameters) {
      template.parameters = {};
    }

    template.parameters['ultima_actualizacion_app'] = {
      defaultValue: { value: now },
      valueType: 'STRING'
    };

    // 4. Publicamos los cambios en Firebase
    await remoteConfig.publishTemplate(template);
    console.log(`¡Éxito! Fecha actualizada en Firebase Remote Config a: ${now}`);

  } catch (error) {
    console.error('Error actualizando Firebase:', error);
    process.exit(1); // Detiene la acción si hay error
  }
}

updateTimestamp();
