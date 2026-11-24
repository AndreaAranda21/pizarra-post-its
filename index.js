// importo las herramientas de firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
    // permite acceder a firestore donde guardo las notas
    getFirestore,
    // hace referencia a una coleccion de documentos
    collection,
    // hace referencia a un documento concreto
    doc,
    // crea un documento con un id automatico
    addDoc,
    // obtiene la fecha y hora del servidor
    serverTimestamp,
    // escucha los cambios de la base de datos en tiempo real
    onSnapshot,
    // modifica los campos de un documento existente
    updateDoc,
    // elimina un documento de la base de datos
    deleteDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import {
    // permite utilizar la autenticacion de firebase
    getAuth,
    // indica que uso google para iniciar sesion
    GoogleAuthProvider,
    // abre una ventana para iniciar sesion
    signInWithPopup,
    // detecta si el usuario entra o sale de su cuenta
    onAuthStateChanged,
    // cierra la sesion del usuario
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// datos de mi proyecto de firebase
const firebaseConfig = {
    apiKey: "AIzaSyAR9hIaIyrkgLpBgIhaIdUl4moS1VApXXE",
    authDomain: "pizarra-post-its.firebaseapp.com",
    projectId: "pizarra-post-its",
    storageBucket: "pizarra-post-its.firebasestorage.app",
    messagingSenderId: "918508956198",
    appId: "1:918508956198:web:e3569055f5904a9b5754e7"
};

// inicio firebase
const app = initializeApp(firebaseConfig);

// conexion con la base de datos
const db = getFirestore(app);

// conexion con la autenticacion
const auth = getAuth(app);

// cojo los elementos del inicio de sesion
var acceso = document.getElementById("acceso");
var entrarGoogle = document.getElementById("entrarGoogle");
var mensajeAcceso = document.getElementById("mensajeAcceso");
var pizarra = document.getElementById("pizarra");

// cojo los elementos del usuario
var nombreUsuario = document.getElementById("nombreUsuario");
var fotoUsuario = document.getElementById("fotoUsuario");
var cerrarSesion = document.getElementById("cerrarSesion");

// cojo los elementos para editar una nota
var editor = document.getElementById("editor");
var colorNota = document.getElementById("colorNota");
var textoNota = document.getElementById("textoNota");
var cancelarEdicion = document.getElementById("cancelarEdicion");
var guardarNota = document.getElementById("guardarNota");

// cojo los elementos para crear una nota
var crearNota = document.getElementById("crearNota");
var creador = document.getElementById("creador");
var nuevoTexto = document.getElementById("nuevoTexto");
var nuevoColor = document.getElementById("nuevoColor");

// guardo la nota que estoy editando
var notaSeleccionada = null;

// guardo la funcion que deja de escuchar las notas
var dejarDeEscuchar = null;

// utilizo google para iniciar sesion
const proveedorGoogle = new GoogleAuthProvider();

// permito elegir la cuenta de google
proveedorGoogle.setCustomParameters({
    prompt: "select_account"
});

// abro la ventana de google
entrarGoogle.addEventListener("click", async () => {
    mensajeAcceso.textContent = "";
    try {
        await signInWithPopup(auth, proveedorGoogle);
    } catch (error) {
        mensajeAcceso.textContent = "No se pudo iniciar sesion";
        // muestro el error en la consola del navegador
        console.error(error);
    }
});

// cierro la sesion del usuario
cerrarSesion.addEventListener("click", async () => {
    await signOut(auth);
});

// coloco la nota sin que se salga de la pantalla
function colocarNota(nota, x, y) {
    // calculo el limite derecho dejando 8 pixeles de margen
    const maxX = Math.max(8, pizarra.clientWidth - nota.offsetWidth - 8);
    // calculo el limite inferior dejando espacio para el boton de crear
    const maxY = Math.max(100, pizarra.clientHeight - nota.offsetHeight - crearNota.offsetHeight - 20);
    // limito x para que la nota no salga por la izquierda ni por la derecha
    nota.style.left = Math.max(8, Math.min(x, maxX)) + "px";
    // limito y para dejar espacio arriba y evitar que salga por abajo
    nota.style.top = Math.max(100, Math.min(y, maxY)) + "px";
}

// ajusto las notas cuando cambia el tamaño de la pantalla
window.addEventListener("resize", () => {
    pizarra.querySelectorAll(".nota").forEach((nota) => {
        colocarNota(nota, Number(nota.dataset.x), Number(nota.dataset.y));
    });
});

// funcion para mover editar y borrar las notas
function activarGestos(nota) {
    // distancia entre el dedo y la esquina de la nota
    var offsetX, offsetY;
    // coordenadas donde empieza el gesto
    var inicioX, inicioY;
    // momento en el que empieza el gesto en milisegundos
    var tiempoInicio;
    // momento del ultimo toque para detectar el doble toque
    var ultimoToque = 0;
    // posicion a la que vuelve la nota si cancelo o falla el guardado
    var posicionOriginalX, posicionOriginalY;

    // detecto cuando pongo el dedo sobre la nota
    nota.addEventListener("touchstart", (e) => {
        // quito la animacion para que la nota siga al dedo sin retraso
        nota.style.transition = "none";

        // guardo la posicion original de la nota
        posicionOriginalX = nota.offsetLeft;
        posicionOriginalY = nota.offsetTop;

        // guardo el momento en el que empieza el gesto
        tiempoInicio = Date.now();

        // guardo la posicion del dedo
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;

        // calculo la distancia entre el dedo y la nota
        offsetX = inicioX - nota.offsetLeft;
        offsetY = inicioY - nota.offsetTop;
    });

    // muevo la nota siguiendo el dedo
    nota.addEventListener("touchmove", (e) => {
        // cojo el primer dedo que esta tocando la pantalla
        var toque = e.touches[0];
        colocarNota(
            nota,
            toque.clientX - offsetX,
            toque.clientY - offsetY
        );
    });

    // compruebo que gesto he realizado al levantar el dedo
    nota.addEventListener("touchend", async (e) => {

        // cojo la posicion final del dedo
        // cojo la posicion del dedo que acaba de levantarse
        var fin = e.changedTouches[0];

        // calculo cuanto se ha movido el dedo
        var distanciaX = fin.clientX - inicioX;
        var distanciaY = fin.clientY - inicioY;

        // calculo cuanto ha durado el gesto
        var duracion = Date.now() - tiempoInicio;

        // cojo el id de la nota
        const id = nota.dataset.id;

        // cojo el id del usuario conectado
        // el uid identifica al usuario y lo uso como nombre de su coleccion
        const uid = auth.currentUser.uid;

        // compruebo si solo ha sido un toque
        // math abs convierte la distancia en positiva para medir en cualquier direccion
        if (Math.abs(distanciaX) < 10 && Math.abs(distanciaY) < 10) {
            // obtengo el momento actual en milisegundos
            var ahora = Date.now();

            // compruebo si he realizado dos toques seguidos
            // si han pasado menos de 300 milisegundos desde el toque anterior abro el editor
            if (ultimoToque !== 0 && ahora - ultimoToque < 300) {

                // guardo la nota que quiero editar
                notaSeleccionada = nota;

                // pongo su texto y color en el editor
                textoNota.value = nota.textContent;
                colorNota.value = nota.dataset.color;

                // abro el editor
                editor.showModal();
                ultimoToque = 0;
            } else {
                // si es el primer toque guardo su hora para compararla con el siguiente
                ultimoToque = ahora;
            }
        } else {
            ultimoToque = 0;

            // compruebo si he deslizado rapido hacia un lado
            // es un swipe si recorre mas de 80 pixeles en horizontal el doble que en vertical y tarda menos de 300 milisegundos
            if (Math.abs(distanciaX) > 80 &&
                Math.abs(distanciaX) > Math.abs(distanciaY) * 2 &&
                duracion < 300) {

                // pregunto si quiero borrar la nota
                if (confirm("¿Quieres eliminar esta nota?")) {
                    try {

                        // borro la nota de la coleccion del usuario
                        // uid es la coleccion del usuario e id es el documento de la nota
                        await deleteDoc(doc(db, uid, id));
                        // salgo de este bloque de la funcion para no continuar con el resto
                        return;
                    } catch (error) {
                        // muestro el error en la consola del navegador
                        console.error(error);
                    }
                }

                // devuelvo la nota a su posicion si no se borra
                nota.style.transition = "left 0.25s ease, top 0.25s ease";
                nota.style.left = posicionOriginalX + "px";
                nota.style.top = posicionOriginalY + "px";
            } else {
                try {

                    // actualizo la posicion de la nota en firebase
                    // busco el documento por su id dentro de la coleccion del usuario
                    await updateDoc(doc(db, uid, id), {
                        // convierto la posicion de texto con px a un numero
                        coordenadaX: parseFloat(nota.style.left),
                        coordenadaY: parseFloat(nota.style.top)
                    });
                } catch (error) {

                    // recupero la posicion anterior si hay un error
                    nota.style.left = posicionOriginalX + "px";
                    nota.style.top = posicionOriginalY + "px";
                    // muestro el error en la consola del navegador
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

    // cojo el id del usuario conectado
    // el uid identifica al usuario y lo uso como nombre de su coleccion
    const uid = auth.currentUser.uid;

    // cojo el id de la nota seleccionada
    const id = notaSeleccionada.dataset.id;
    try {

        // actualizo el texto y el color de la nota
        // busco el documento por su id dentro de la coleccion del usuario
        await updateDoc(doc(db, uid, id), {
            texto: textoNota.value,
            color: colorNota.value
        });

        // cierro el editor
        editor.close();
    } catch (error) {
        // muestro el error en la consola del navegador
        console.error(error);
    }
});

// abro el formulario para crear una nota
crearNota.addEventListener("click", () => {

    // dejo el texto vacio
    nuevoTexto.value = "";

    // pongo el color amarillo por defecto
    nuevoColor.value = "#fff59d";
    creador.showModal();
});

// cierro el formulario sin crear la nota
document.getElementById("cancelarCreacion").addEventListener("click", () => {
    creador.close();
});

// creo una nota nueva
document.getElementById("confirmarCreacion").addEventListener("click", async () => {

    // cojo el id del usuario conectado
    // el uid identifica al usuario y lo uso como nombre de su coleccion
    const uid = auth.currentUser.uid;
    try {

        // añado la nota a la coleccion del usuario
        // firebase genera el id de la nota y crea la coleccion si no existe
        await addDoc(collection(db, uid), {
            texto: nuevoTexto.value,
            color: nuevoColor.value,
            // calculo una posicion inicial cerca del centro de la pantalla
            coordenadaX: pizarra.clientWidth / 2 - 75,
            coordenadaY: pizarra.clientHeight / 2 - 75,
            // guardo la fecha del servidor y no la del dispositivo
            fechaCreacion: serverTimestamp()
        });

        // cierro el formulario
        creador.close();
    } catch (error) {
        // muestro el error en la consola del navegador
        console.error(error);
    }
});

// escucho las notas del usuario en tiempo real
function escucharNotas(uid) {
    // escucho solo la coleccion del usuario y devuelvo la funcion que permite dejar de escuchar
    return onSnapshot(collection(db, uid), (resultado) => {

        // recorro los cambios que se han producido
        // recorro los documentos nuevos modificados o eliminados
        resultado.docChanges().forEach((cambio) => {

            // cojo el identificador de la nota
            // firebase ya genera este id por eso no necesito guardarlo como otro campo
            const id = cambio.doc.id;

            // cojo los datos de la nota
            // data devuelve los campos guardados como texto color y coordenadas
            const datos = cambio.doc.data();

            // busco si la nota ya existe en la pantalla
            // busco el div que tiene el mismo data id para no crear notas duplicadas
            var nota = pizarra.querySelector(`.nota[data-id="${id}"]`);

            // si se ha borrado la nota la quito de la pantalla
            if (cambio.type === "removed") {
                if (nota) {
                    nota.remove();
                }
                // salgo de este bloque de la funcion para no continuar con el resto
                return;
            }

            // si la nota no existe creo un div
            // si no existe en el html creo un elemento nuevo
            if (!nota) {
                nota = document.createElement("div");

                // añado la clase del css
                nota.classList.add("nota");

                // guardo el id de firebase en la nota
                // dataset guarda datos en el html y permite encontrar la nota en firebase
                nota.dataset.id = id;

                // añado la nota a la pizarra
                pizarra.appendChild(nota);

                // activo los gestos de la nota
                activarGestos(nota);
            }

            // pongo los datos de firebase en la nota
            nota.textContent = datos.texto;
            nota.style.backgroundColor = datos.color;

            // guardo el color y las coordenadas
            nota.dataset.color = datos.color;
            // guardo las coordenadas para poder recolocar la nota al cambiar la pantalla
            nota.dataset.x = datos.coordenadaX;
            nota.dataset.y = datos.coordenadaY;

            // coloco la nota en su posicion
            colocarNota(nota, datos.coordenadaX, datos.coordenadaY);
        });
    }, (error) => {
        // muestro el error en la consola del navegador
        console.error(error);
    });
}

// detecto cuando un usuario inicia o cierra sesion
onAuthStateChanged(auth, (usuario) => {

    // dejo de escuchar las notas del usuario anterior
    if (dejarDeEscuchar) {
        // cancelo la escucha anterior para no recibir notas de otra cuenta
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

    // compruebo si hay un usuario conectado
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
        // empiezo a escuchar la coleccion cuyo nombre es el uid y guardo como detener la escucha
        dejarDeEscuchar = escucharNotas(usuario.uid);
    } else {

        // muestro el inicio de sesion
        acceso.hidden = false;

        // oculto la pizarra
        pizarra.hidden = true;
    }
});