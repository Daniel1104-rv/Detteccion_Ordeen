const ordenPrefijo = "DANIEL"; // Define la palabra clave que activará los comandos de voz

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const outputText = document.getElementById("outputText");
  const msgText = document.getElementById("msgText");
  const respuestaElemento = document.getElementById("respuesta");

  outputText.innerHTML = `Di ${ordenPrefijo} para ver el mensaje`;

  let recognition;
  let stoppedManually = false;

  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "es-ES";
  } else {
    alert("Tu navegador no soporta reconocimiento de voz.");
    return;
  }

  startBtn.addEventListener("click", () => {
    stoppedManually = false;
    recognition.start();
    startBtn.disabled = true;
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
    msgText.innerHTML = "";
  });

  recognition.onresult = async (event) => {
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
    console.log("Texto reconocido:", transcript);

    if (transcript.includes(ordenPrefijo + " SALIR")) {
      stoppedManually = true;
      recognition.stop();
      startBtn.disabled = false;
      outputText.textContent = "Detenido. Presiona el botón para comenzar nuevamente.";
      msgText.innerHTML = "";
    } else if (transcript.includes(ordenPrefijo)) {
      await enviarMensaje(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error("Error en el reconocimiento:", event.error);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Error: El micrófono no tiene permisos o fue bloqueado.");
    } else if (event.error === "network") {
      alert("Error: Problema de conexión con el servicio de reconocimiento de voz.");
    }
    recognition.stop();
    startBtn.disabled = false;
  };

  recognition.onend = () => {
    if (!stoppedManually) {
      msgText.innerHTML = "El reconocimiento de voz se detuvo inesperadamente<br>Habla nuevamente para continuar...";
      recognition.start();
    }
  };
});

async function enviarMensaje(mensaje) {
  const urlGPT = "http://3.237.65.87/api-gpt-php/endpoints/chat.php";
  const urlIOT = "http://3.237.65.87/iot-api-php/controllers/AddIotDevice.php";

  const datos = { message: mensaje };
  const outputText = document.getElementById("outputText");

  try {
    const respuestaGPT = await fetch(urlGPT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const resultadoGPT = await respuestaGPT.json();

    if (resultadoGPT.status === 200) {
      const respuestaTexto = resultadoGPT.data.reply;
      outputText.innerHTML = `Respuesta: <strong><em>${respuestaTexto}</em></strong>`;

      // Enviar respuesta como 'status' al endpoint de la base de datos
      const datosIOT = { status: respuestaTexto };

      const respuestaIOT = await fetch(urlIOT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosIOT)
      });

      const resultadoIOT = await respuestaIOT.json();
      console.log("Resultado al guardar en BD:", resultadoIOT);

      if (resultadoIOT.success) {
        outputText.innerHTML += "<br><span style='color: green;'>✅ Guardado en la base de datos.</span>";
      } else {
        outputText.innerHTML += "<br><span style='color: red;'>❌ No se pudo guardar en la base de datos.</span>";
      }
    } else {
      outputText.textContent = "Error en la respuesta de la API.";
    }
  } catch (error) {
    outputText.textContent = "Error en la conexión con la API.";
    console.error("Error:", error);
  }
}
