let bar = document.querySelector("#resize-bar")
let dragging = false;

bar.addEventListener("pointerdown", event => {
    dragging = true;
    bar.setPointerCapture(event.pointerId);
});

bar.addEventListener("pointermove", event => {
    if (!dragging) return;

    let rect = document.querySelector("#code-editors").getBoundingClientRect();
    document.querySelector("#assembly").style.width = `${event.clientX - rect.left}px`;
});

bar.addEventListener("pointerup", event => {
    dragging = false;
});
