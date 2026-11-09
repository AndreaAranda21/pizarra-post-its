// importo las herramientas de firebase que uso en la pizarra
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    serverTimestamp,
    onSnapshot,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// estos datos identifican mi proyecto de firebase
const firebaseConfig = {
    apiKey: "AIzaSyAR9hIaIyrkgLpBgIhaIdUl4moS1VApXXE",
    authDomain: "pizarra-post-its.firebaseapp.com",
    projectId: "pizarra-post-its",
    storageBucket: "pizarra-post-its.firebasestorage.app",
    messagingSenderId: "918508956198",
    appId: "1:918508956198:web:e3569055f5904a9b5754e7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
const acceso = document.getElementById("acceso");
const entrarGoogle = document.getElementById("entrarGoogle");
const pizarra = document.getElementById("pizarra");
const mensajeAcceso = document.getElementById("mensajeAcceso");

const proveedorGoogle = new GoogleAuthProvider();
proveedorGoogle.setCustomParameters({ prompt: "select_account" });

// abro la ventana de google al pulsar el botón
entrarGoogle.addEventListener("click", async () => {
    mensajeAcceso.textContent = "";

    try {
        await signInWithPopup(auth, proveedorGoogle);
    } catch (error) {
        mensajeAcceso.textContent = "No se pudo entrar con Google. Inténtalo otra vez.";
        console.error("Error al iniciar sesión:", error.code);
    }
});

// cojo los botones y los campos de los dos formularios
var editor = document.getElementById("editor");
var colorNota = document.getElementById("colorNota");
var textoNota = document.getElementById("textoNota");
var cancelarEdicion = document.getElementById("cancelarEdicion");
var guardarNota = document.getElementById("guardarNota");
var crearNota = document.getElementById("crearNota");
var creador = document.getElementById("creador");
var nuevoTexto = document.getElementById("nuevoTexto");
var nuevoColor = document.getElementById("nuevoColor");
var notaSeleccionada = null;

// coloco la nota dentro de la parte visible de la pizarra
function colocarNota(nota, x, y) {
    const maxX = Math.max(8, pizarra.clientWidth - nota.offsetWidth - 8);
    const maxY = Math.max(56, pizarra.clientHeight - nota.offsetHeight - crearNota.offsetHeight - 20);
    nota.style.left = Math.max(8, Math.min(x, maxX)) + "px";
    nota.style.top = Math.max(56, Math.min(y, maxY)) + "px";
}

// ajusto las notas al cambiar el tamaño de la pantalla sin guardar el cambio en firestore
window.addEventListener("resize", () => {
    pizarra.querySelectorAll(".nota").forEach((nota) => {
        colocarNota(nota, Number(nota.dataset.x), Number(nota.dataset.y));
    });
});

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

        // guardo la distancia del dedo al borde para que la nota no salte
        offsetX = e.touches[0].clientX - nota.offsetLeft;
        offsetY = e.touches[0].clientY - nota.offsetTop;
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;
    });

    // muevo la nota según la posición del dedo
    nota.addEventListener("touchmove", (e) => {
        var toque = e.touches[0];

        colocarNota(nota, toque.clientX - offsetX, toque.clientY - offsetY);

        console.log(toque.clientX);
    });

    // async me permite usar await para esperar a firestore
    nota.addEventListener("touchend", async (e) => {
        // changed touches me da los datos del dedo que acabo de levantar
        var fin = e.changedTouches[0];
        var distanciaX = fin.clientX - inicioX;
        var distanciaY = fin.clientY - inicioY;
        var duracion = Date.now() - tiempoInicio;

        console.log("El gesto ha durado " + duracion + " ms");

        // uso el valor absoluto para medir lo que se mueve en cualquier dirección
        if (Math.abs(distanciaX) < 10 && Math.abs(distanciaY) < 10) {
            var ahora = Date.now();

            // si pasan menos de 300 milisegundos entre los dos toques abro el editor
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

            // si deslizo rápido y más hacia un lado que hacia arriba o abajo pregunto si quiero borrar
            if (Math.abs(distanciaX) > 80 &&
                Math.abs(distanciaX) > Math.abs(distanciaY) * 2 &&
                duracion < 300) {
                var borrar = confirm("¿Quieres eliminar esta nota?");

                if (borrar) {
                    const id = nota.dataset.id;

                    try {
                        if (id) {
                            // await espera a que firestore confirme el borrado
                            await deleteDoc(doc(db, "notas", id));
                        }

                        nota.remove();
                        return;
                    } catch (error) {
                        console.error("No se pudo borrar la nota:", error);
                    }
                }

                // si cancelo o hay un error devuelvo la nota a su sitio
                nota.style.transition = "left 0.25s ease, top 0.25s ease";
                nota.style.left = posicionOriginalX + "px";
                nota.style.top = posicionOriginalY + "px";
            } else {
                const id = nota.dataset.id;

                if (id) {
                    try {
                        // guardo las coordenadas como números al soltar la nota
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

cancelarEdicion.addEventListener("click", () => {
    editor.close();
});

// guardo el texto y el color de la nota que estoy editando
guardarNota.addEventListener("click", async () => {
    const texto = textoNota.value;
    const color = colorNota.value;
    const id = notaSeleccionada.dataset.id;

    if (id) {
        try {
            // actualizo solo estos dos campos del documento
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

// creo la nota con el texto y el color que he elegido
document.getElementById("confirmarCreacion").addEventListener("click", async () => {
    var nuevaNota = document.createElement("div");
    nuevaNota.classList.add("nota");
    nuevaNota.textContent = nuevoTexto.value;
    nuevaNota.style.backgroundColor = nuevoColor.value;
    nuevaNota.dataset.color = nuevoColor.value;
    pizarra.appendChild(nuevaNota);

    // resto el tamaño de la nota al de la pantalla para centrarla
    colocarNota(nuevaNota, (pizarra.clientWidth - nuevaNota.offsetWidth) / 2,
        (pizarra.clientHeight - nuevaNota.offsetHeight) / 2);
    nuevaNota.dataset.x = parseFloat(nuevaNota.style.left);
    nuevaNota.dataset.y = parseFloat(nuevaNota.style.top);

    // preparo un documento con un id nuevo en la colección de notas
    const referencia = doc(collection(db, "notas"));

    // guardo el id en la nota para encontrar su documento al editarla o borrarla
    nuevaNota.dataset.id = referencia.id;

    try {
        // espero a que firestore guarde la nota antes de cerrar el formulario
        await setDoc(referencia, {
            id: referencia.id,
            texto: nuevaNota.textContent,
            color: nuevaNota.dataset.color,
            coordenadaX: Number(nuevaNota.dataset.x),
            coordenadaY: Number(nuevaNota.dataset.y),
            // uso la fecha del servidor para guardar cuándo se ha creado
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

// abro el formulario con el texto vacío y el color amarillo
crearNota.addEventListener("click", () => {
    nuevoTexto.value = "";
    nuevoColor.value = "#fff59d";
    creador.showModal();
});

document.getElementById("cancelarCreacion").addEventListener("click", () => {
    creador.close();
});

// recibo las notas al abrir la pizarra y después los cambios sin recargar
function escucharNotas() {
    return onSnapshot(collection(db, "notas"), (resultado) => {
        // doc changes me dice qué documentos se han añadido cambiado o borrado
        resultado.docChanges().forEach((cambio) => {
            const id = cambio.doc.id;
            const notaExistente = pizarra.querySelector(`.nota[data-id="${id}"]`);
            const datos = cambio.doc.data();
    
            // removed indica que la nota se ha borrado en firestore
            if (cambio.type === "removed") {
                // solo la quito si existe en la pantalla
                notaExistente?.remove();
                return;
            }
    
            // modified indica que han cambiado los datos de una nota que ya existe
            if (cambio.type === "modified" && notaExistente) {
                notaExistente.textContent = datos.texto;
                notaExistente.dataset.color = datos.color;
                notaExistente.style.backgroundColor = datos.color;
                notaExistente.dataset.x = datos.coordenadaX;
                notaExistente.dataset.y = datos.coordenadaY;
                colocarNota(notaExistente, datos.coordenadaX, datos.coordenadaY);
                return;
            }
    
            // added indica que firestore me está mostrando esa nota por primera vez
            // compruebo el id para evitar que salga dos veces
            if (cambio.type !== "added" || notaExistente) {
                return;
            }
    
            // pongo la nota en pantalla con los datos y la posición guardados
            const notaGuardada = document.createElement("div");
            notaGuardada.classList.add("nota");
            notaGuardada.dataset.id = id;
            notaGuardada.dataset.color = datos.color;
            notaGuardada.textContent = datos.texto;
            notaGuardada.style.backgroundColor = datos.color;
            notaGuardada.dataset.x = datos.coordenadaX;
            notaGuardada.dataset.y = datos.coordenadaY;
    
            pizarra.appendChild(notaGuardada);
            colocarNota(notaGuardada, datos.coordenadaX, datos.coordenadaY);
            activarGestos(notaGuardada);
        });
    }, (error) => {
        console.error("No se pudieron cargar las notas:", error);
    });
}

let dejarDeEscuchar;

// enseño la pizarra solo si el usuario ha iniciado sesión
onAuthStateChanged(auth, (usuario) => {
    if (dejarDeEscuchar) {
        dejarDeEscuchar();
        dejarDeEscuchar = null;
    }

    pizarra.querySelectorAll(".nota").forEach((nota) => nota.remove());
    acceso.hidden = Boolean(usuario);
    pizarra.hidden = !usuario;

    if (usuario) {
        dejarDeEscuchar = escucharNotas();
    } else {
        editor.close();
        creador.close();
    }
});