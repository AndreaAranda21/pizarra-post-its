// importo las herramientas de firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    serverTimestamp,
    onSnapshot,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

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

//inicio de sesion
var acceso = document.getElementById("acceso");
var entrarGoogle = document.getElementById("entrarGoogle");
var mensajeAcceso = document.getElementById("mensajeAcceso");
var pizarra = document.getElementById("pizarra");

//usuario
var nombreUsuario = document.getElementById("nombreUsuario");
var fotoUsuario = document.getElementById("fotoUsuario");
var cerrarSesion = document.getElementById("cerrarSesion");

// editar
var editor = document.getElementById("editor");
var colorNota = document.getElementById("colorNota");
var textoNota = document.getElementById("textoNota");
var cancelarEdicion = document.getElementById("cancelarEdicion");
var guardarNota = document.getElementById("guardarNota");

// crear 
var crearNota = document.getElementById("crearNota");
var creador = document.getElementById("creador");
var nuevoTexto = document.getElementById("nuevoTexto");
var nuevoColor = document.getElementById("nuevoColor");

// guardar
var notaSeleccionada = null;
// guardo la funcion que deja de escuchar las notas
var dejarDeEscuchar = null;
const proveedorGoogle = new GoogleAuthProvider();

//elegir la cuenta de google
proveedorGoogle.setCustomParameters({
    prompt: "select_account"
});

//ventana de google
entrarGoogle.addEventListener("click", async () => {

    mensajeAcceso.textContent = "";

    try {
        await signInWithPopup(auth, proveedorGoogle);
    } catch (error) {
        mensajeAcceso.textContent = "No se pudo iniciar sesion";
        console.error(error);
    }
});

// cierrar la sesion 
cerrarSesion.addEventListener("click", async () => {

    await signOut(auth);
});

// colocar nota y que no se me vaya fuera
function colocarNota(nota, x, y) {
    const maxX = Math.max(8, pizarra.clientWidth - nota.offsetWidth - 8);
    const maxY = Math.max(100, pizarra.clientHeight - nota.offsetHeight - crearNota.offsetHeight - 20);

    nota.style.left = Math.max(8, Math.min(x, maxX)) + "px";
    nota.style.top = Math.max(100, Math.min(y, maxY)) + "px";
}

// cambiar las notas con la pantalla
window.addEventListener("resize", () => {
    pizarra.querySelectorAll(".nota").forEach((nota) => {
        colocarNota(nota, Number(nota.dataset.x), Number(nota.dataset.y));
    });
});

//mover editar y borrar notas
function activarGestos(nota) {
    var offsetX, offsetY;
    var inicioX, inicioY;
    var tiempoInicio;
    var ultimoToque = 0;
    var posicionOriginalX, posicionOriginalY;

    //toca la nota
    nota.addEventListener("touchstart", (e) => {
        nota.style.transition = "none";
        // guardo la posicion original
        posicionOriginalX = nota.offsetLeft;
        posicionOriginalY = nota.offsetTop;
        // guardo el momento en el que empieza el deo tocando
        tiempoInicio = Date.now();
        // guardo la posicion del dedo
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;
        offsetX = inicioX - nota.offsetLeft;
        offsetY = inicioY - nota.offsetTop;
    });

    //la nota con el dedo
    nota.addEventListener("touchmove", (e) => {
        var toque = e.touches[0];
        colocarNota(
            nota,
            toque.clientX - offsetX,
            toque.clientY - offsetY
        );
    });

    //levantar el dedo
    nota.addEventListener("touchend", async (e) => {
        // posicion final del dedo
        var fin = e.changedTouches[0];
        var distanciaX = fin.clientX - inicioX;
        var distanciaY = fin.clientY - inicioY;
        var duracion = Date.now() - tiempoInicio;
        const id = nota.dataset.id;
        const uid = auth.currentUser.uid;

        // se comprueba si ha sido un toque 
        if (Math.abs(distanciaX) < 10 && Math.abs(distanciaY) < 10) {
            var ahora = Date.now();

            // compruebo si he realizado dos toques seguidos para abrir el editor
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

            //rapido para preguntar borrarla
            if (Math.abs(distanciaX) > 80 &&
                Math.abs(distanciaX) > Math.abs(distanciaY) * 2 &&
                duracion < 300) {

                if (confirm("¿Quieres eliminar esta nota?")) {
                    try {
                        await deleteDoc(doc(db, uid, id));
                        return;
                    } catch (error) {
                        console.error(error);
                    }
                }
                // devuelve
                nota.style.transition = "left 0.25s ease, top 0.25s ease";
                nota.style.left = posicionOriginalX + "px";
                nota.style.top = posicionOriginalY + "px";
            } else {
                try {
                    //esto actualiza la posicion de la nota en firebase
                    await updateDoc(doc(db, uid, id), {
                        coordenadaX: parseFloat(nota.style.left),
                        coordenadaY: parseFloat(nota.style.top)
                    });
                } catch (error) {
                    // recupero la posicion anterior si hay un error
                    nota.style.left = posicionOriginalX + "px";
                    nota.style.top = posicionOriginalY + "px";
                    console.error(error);
                }
            }
        }
    });
}

// cierro el editor sin guardar
cancelarEdicion.addEventListener("click", () => {
    editor.close();
});

// guardo los cambios de una nota
guardarNota.addEventListener("click", async () => {
    const uid = auth.currentUser.uid;
    const id = notaSeleccionada.dataset.id;
    try {a
        await updateDoc(doc(db, uid, id), {
            texto: textoNota.value,
            color: colorNota.value
        });
        editor.close();
    } catch (error) {
        console.error(error);
    }
});

// abre el formulario para crear una nota
crearNota.addEventListener("click", () => {
    nuevoTexto.value = "";
    nuevoColor.value = "#fff59d";
    creador.showModal();
});

// cierro el formulario sin crear
document.getElementById("cancelarCreacion").addEventListener("click", () => {
    creador.close();
});

// crear nota
document.getElementById("confirmarCreacion").addEventListener("click", async () => {
    const uid = auth.currentUser.uid;
    try {
        await addDoc(collection(db, uid), {
            texto: nuevoTexto.value,
            color: nuevoColor.value,
            coordenadaX: pizarra.clientWidth / 2 - 75,
            coordenadaY: pizarra.clientHeight / 2 - 75,
            fechaCreacion: serverTimestamp()
        });
        creador.close();
    } catch (error) {
        console.error(error);
    }
});

//cambios a tiempo real
function escucharNotas(uid) {
    return onSnapshot(collection(db, uid), (resultado) => {
        // revisa los cambios que se han producido
        resultado.docChanges().forEach((cambio) => {
            const id = cambio.doc.id;
            const datos = cambio.doc.data();
            // busca si la nota existe 
            var nota = pizarra.querySelector(`.nota[data-id="${id}"]`);

            // si se borrada la quito
            if (cambio.type === "removed") {
                if (nota) {
                    nota.remove();
                }
                return;
            }

            // si no existe creo un div
            if (!nota) {
                nota = document.createElement("div");
                nota.classList.add("nota");
                nota.dataset.id = id;
                pizarra.appendChild(nota);
                // activo los gestos de la nota
                activarGestos(nota);
            }
            // pongo los datos de firebase en la nota
            nota.textContent = datos.texto;
            nota.style.backgroundColor = datos.color;
            nota.dataset.color = datos.color;
            nota.dataset.x = datos.coordenadaX;
            nota.dataset.y = datos.coordenadaY;
            colocarNota(nota, datos.coordenadaX, datos.coordenadaY);
        });
    }, (error) => {
        console.error(error);
    });
}

// detecto cuando se inicia o cierra sesion
onAuthStateChanged(auth, (usuario) => {
    // dejo de escuchar las notas del usuario anterior
    if (dejarDeEscuchar) {
        dejarDeEscuchar();
        dejarDeEscuchar = null;
    }
    // elimino las notas anteriores de la pantalla
    pizarra.querySelectorAll(".nota").forEach((nota) => {
        nota.remove();
    });
    // cierro los formularios
    editor.close();
    creador.close();
    notaSeleccionada = null;

    // compruebo si hay alguien conectado
    if (usuario) {
        // oculto el inicio de sesion
        acceso.hidden = true;
        // muestro la pizarra
        pizarra.hidden = false;
        // muestro el nombre del usuario
        nombreUsuario.textContent = usuario.displayName;
        // muestro la foto del usuario
        fotoUsuario.src = usuario.photoURL;
        // cargo solamente las notas de ese usuario
        dejarDeEscuchar = escucharNotas(usuario.uid);
    } else {
        acceso.hidden = false;
        pizarra.hidden = true;
    }
});