(async () => {
    let input = document.querySelector("#function-input");
    let res = await fetch("/{{BINARY}}/functions.json");
    let json = await res.json();

    for (let func of json) {
        let el = document.createElement("option");
        el.value = func;
        el.innerText = func;
        input.appendChild(el);
    }

    input.value = "{{FUNCTION}}";
    input.addEventListener("input", event => {
        window.location.href = `/{{BINARY}}/${input.value}`
    });
})();

(async () => {
    let input = document.querySelector("#binary-input");
    let res = await fetch("/binaries.json");
    let json = await res.json();

    for (let func of json) {
        let el = document.createElement("option");
        el.value = func;
        el.innerText = func;
        input.appendChild(el);
    }

    input.value = "{{BINARY}}";
    input.addEventListener("input", event => {
        window.location.href = `/${input.value}/{{FUNCTION}}`
    });
})();
