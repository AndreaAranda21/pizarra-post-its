// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, serverTimestamp, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
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

    nota.addEventListener("touchmove",(e) => {
        var toque = e.touches[0];

        nota.style.left = (toque.clientX - offsetX) + "px";
        nota.style.top = (toque.clientY - offsetY) + "px";

        console.log(toque.clientX);
    });

    nota.addEventListener("touchend", async (e) => {
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
                    const id = nota.dataset.id;

                    try {
                        if (id) {
                            await deleteDoc(doc(db, "notas", id));
                        }

                        nota.remove();
                        return;
                    } catch (error) {
                        console.error("No se pudo borrar la nota:", error);
                    }
                }

nota.style.transition = "left 0.25s ease, top 0.25s ease";
nota.style.left = posicionOriginalX + "px";
nota.style.top = posicionOriginalY + "px";
            } else {
                const id = nota.dataset.id;

                if (id) {
                    try {
                        await updateDoc(doc(db, "notas", id), {
                            coordenadaX: parseFloat(nota.style.left),
                            coordenadaY: parseFloat(nota.style.top)
                        });
                    } catch (error) {
                        nota.style.left = posicionOriginalX + "px";
                        nota.style.top = posicionOriginalY + "px";
                        console.error("No se pudo guardar la posición:", error);
                    }
                }
            }
        }
    });
}

activarGestos(nota);
cancelarEdicion.addEventListener("click", () => {
    editor.close();
});

guardarNota.addEventListener("click", async () => {
    const texto = textoNota.value;
    const color = colorNota.value;
    const id = notaSeleccionada.dataset.id;

    if (id) {
        try {
            await updateDoc(doc(db, "notas", id), {
                texto: texto,
                color: color
            });
        } catch (error) {
            console.error("No se pudo editar la nota:", error);
            return;
        }
    }

    notaSeleccionada.textContent = texto;
    notaSeleccionada.dataset.color = color;
    notaSeleccionada.style.backgroundColor = color;
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
    nuevaNota.dataset.id = referencia.id;
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

onSnapshot(collection(db, "notas"), (resultado) => {
    resultado.docChanges().forEach((cambio) => {
        const id = cambio.doc.id;
        const notaExistente = document.querySelector(`.nota[data-id="${id}"]`);
        const datos = cambio.doc.data();

        if (cambio.type === "removed") {
            notaExistente?.remove();
            return;
        }
        if (cambio.type === "modified" && notaExistente) {
            notaExistente.textContent = datos.texto;
            notaExistente.dataset.color = datos.color;
            notaExistente.style.backgroundColor = datos.color;
            notaExistente.style.left = datos.coordenadaX + "px";
            notaExistente.style.top = datos.coordenadaY + "px";
            return;
        }

        if (cambio.type !== "added" || notaExistente) {
            return;
        }

        const notaGuardada = document.createElement("div");
        notaGuardada.classList.add("nota");
        notaGuardada.dataset.id = id;
        notaGuardada.dataset.color = datos.color;
        notaGuardada.textContent = datos.texto;
        notaGuardada.style.backgroundColor = datos.color;
        notaGuardada.style.left = datos.coordenadaX + "px";
        notaGuardada.style.top = datos.coordenadaY + "px";

        document.body.appendChild(notaGuardada);
        activarGestos(notaGuardada);
    });
}, (error) => {
    console.error("No se pudieron cargar las notas:", error);
});