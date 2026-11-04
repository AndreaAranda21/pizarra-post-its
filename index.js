var nota = document.getElementById("nota");
var offsetX, offsetY;
var ultimoToque = 0;
var inicioX, inicioY;

nota.addEventListener("touchstart", (e) => {
    console.log("Has tocado la nota");
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

    if (Math.abs(distanciaX) < 10 && Math.abs(distanciaY) < 10) {
        var ahora = Date.now();

        if (ultimoToque !== 0 && ahora - ultimoToque < 300) {
            console.log("Doble toque: editar nota");
            ultimoToque = 0;
        } else {
            ultimoToque = ahora;
        }
    } else {
        console.log("Ha sido un arrastre");
        ultimoToque = 0;
    }

});