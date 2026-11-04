var nota = document.getElementById("nota");
var offsetX, offsetY;
var ultimoToque = 0;
var inicioX, inicioY;
var tiempoInicio;
var posicionOriginalX, posicionOriginalY;

var editor = document.getElementById("editor");
var colorNota = document.getElementById("colorNota");
var colorActual = "#fff59d";
var textoNota = document.getElementById("textoNota");
var cancelarEdicion = document.getElementById("cancelarEdicion");
var guardarNota = document.getElementById("guardarNota");

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
            textoNota.value = nota.textContent;
            colorNota.value = colorActual;
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

cancelarEdicion.addEventListener("click", () => {
    editor.close();
});

guardarNota.addEventListener("click", () => {
    nota.textContent = textoNota.value;
    colorActual = colorNota.value;
    nota.style.backgroundColor = colorActual;
    editor.close();
});