var nota = document.getElementById("nota");
var offsetX, offsetY;

nota.addEventListener("touchstart", (e) => {
    console.log("Has tocado la nota");
    console.log(e.touches[0].clientX);
    console.log(e.touches[0].clientY);
    offsetX = e.touches[0].clientX - nota.offsetLeft;
    offsetY = e.touches[0].clientY - nota.offsetTop;
});

nota.addEventListener("touchmove", (e) => {
    var toque = e.touches[0];

    nota.style.left = (toque.clientX - offsetX) + "px";
    nota.style.top = (toque.clientY - offsetY) + "px";
    console.log(toque.clientX);
});