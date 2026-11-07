// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyAR9hIaIyrkgLpBgIhaIdUl4moS1VApXXE",
authDomain: "pizarra-post-its.firebaseapp.com",
projectId: "pizarra-post-its",
storageBucket: "pizarra-post-its.firebasestorage.app",
messagingSenderId: "918508956198",
appId: "1:918508956198:web:e3569055f5904a9b5754e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);  
const db = getFirestore(app);

var nota = document.getElementById("nota");
var editor = document.getElementById("editor");
var colorNota = document.getElementById("colorNota");
nota.dataset.color = "#fff59d";
var textoNota = document.getElementById("textoNota");
var cancelarEdicion = document.getElementById("cancelarEdicion");
var guardarNota = document.getElementById("guardarNota");
var crearNota = document.getElementById("crearNota");
var creador = document.getElementById("creador");
var nuevoTexto = document.getElementById("nuevoTexto");
var nuevoColor = document.getElementById("nuevoColor");
var notaSeleccionada = null;

function activarGestos(nota) {
    var offsetX, offsetY;
    var ultimoToque = 0;
    var inicioX, inicioY;
    var tiempoInicio;
    var posicionOriginalX, posicionOriginalY;
    
    nota.addEventListener("touchstart", (e) => {
        nota.style.transition = "none";
        posicionOriginalX = nota.offsetLeft;
        posicionOriginalY = nota.offsetTop;

        tiempoInicio = Date.now();

        console.log(e.touches[0].clientX);
        console.log(e.touches[0].clientY);

        offsetX = e.touches[0].clientX - nota.offsetLeft;
        offsetY = e.touches[0].clientY - nota.offsetTop;
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;
    });

    nota.addEventListener("touchmove", (e) => {
        var toque = e.touches[0];

        nota.style.left = (toque.clientX - offsetX) + "px";
        nota.style.top = (toque.clientY - offsetY) + "px";

        console.log(toque.clientX);
    });

    nota.addEventListener("touchend", (e) => {
        var fin = e.changedTouches[0];
        var distanciaX = fin.clientX - inicioX;
        var distanciaY = fin.clientY - inicioY;
        var duracion = Date.now() - tiempoInicio;
        
        console.log("El gesto ha durado " + duracion + " ms");

        if (Math.abs(distanciaX) < 10 && Math.abs(distanciaY) < 10) {
            var ahora = Date.now();

            if (ultimoToque !== 0 && ahora - ultimoToque < 300) {
                notaSeleccionada = nota;
                textoNota.value = nota.textContent;
                colorNota.value = nota.dataset.color;
                editor.showModal();
                ultimoToque = 0;
            } else {
                ultimoToque = ahora;
            }
        } else {
            ultimoToque = 0;

            if (Math.abs(distanciaX) > 80 &&
                Math.abs(distanciaX) > Math.abs(distanciaY) * 2 &&
                duracion < 300) {
                var borrar = confirm("¿Quieres eliminar esta nota?");

                if (borrar) {
                    nota.remove();
                } else {
                    nota.style.transition = "left 0.25s ease, top 0.25s ease";
                    nota.style.left = posicionOriginalX + "px";
                    nota.style.top = posicionOriginalY + "px";
                }
            } else {
                console.log("Ha sido un arrastre");
            }
        }
    });
}

activarGestos(nota);
cancelarEdicion.addEventListener("click", () => {
    editor.close();
});

guardarNota.addEventListener("click", () => {
    notaSeleccionada.textContent = textoNota.value;
    notaSeleccionada.dataset.color = colorNota.value;
    notaSeleccionada.style.backgroundColor = colorNota.value;
    editor.close();
});

document.getElementById("confirmarCreacion").addEventListener("click", async () => {
    var nuevaNota = document.createElement("div");
    nuevaNota.classList.add("nota");
    nuevaNota.textContent = nuevoTexto.value;
    nuevaNota.style.backgroundColor = nuevoColor.value;
    nuevaNota.dataset.color = nuevoColor.value;
    document.body.appendChild(nuevaNota);

    nuevaNota.style.left = (window.innerWidth - nuevaNota.offsetWidth) / 2 + "px";
    nuevaNota.style.top = (window.innerHeight - nuevaNota.offsetHeight) / 2 + "px";
    const referencia = doc(collection(db, "notas"));

    try {
        await setDoc(referencia, {
            id: referencia.id,
            texto: nuevaNota.textContent,
            color: nuevaNota.dataset.color,
            coordenadaX: parseFloat(nuevaNota.style.left),
            coordenadaY: parseFloat(nuevaNota.style.top),
            fechaCreacion: serverTimestamp()
        });
    } catch (error) {
        nuevaNota.remove();
        console.error("No se pudo guardar la nota:", error);
        return;
    }

    nuevaNota.dataset.id = referencia.id;
    activarGestos(nuevaNota);
    creador.close();
});

crearNota.addEventListener("click", () => {
    nuevoTexto.value = "";
    nuevoColor.value = "#fff59d";
    creador.showModal();
});

document.getElementById("cancelarCreacion").addEventListener("click", () => {
    creador.close();
});