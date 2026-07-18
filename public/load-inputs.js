import { FuseWorker } from '/node_module/fuse/dist/fuse-worker.mjs'

async function loadFunctionInput() {
    let input = document.querySelector("#function-input");
    let overlay = document.querySelector("#search-overlay");

    input.value = "{{FUNCTION}}";

    let res = await fetch("/{{BINARY}}/functions.json");
    let json = await res.json();
    let fuse = new FuseWorker(json);

    async function search() {
        let results = await fuse.search(input.value);
        results = results.slice(0, 30);
        let children = [];

        for (let result of results) {
            let child = document.createElement("div");
            child.innerText = result.item;
            children.push(child);

            child.addEventListener("click", event => {
                unsearch();
                window.location.href = `/{{BINARY}}/${result.item}`;
            });
        }

        overlay.replaceChildren(...children);
        overlay.style.display = "";
    }

    function unsearch() {
        overlay.style.display = "none";
    }

    input.addEventListener("keydown", event => {
        if (event.code == "Enter") {
            overlay.children[0].click();
        } else {
            search();
        }
    });

    window.addEventListener("keydown", event => {
        if (event.code == "KeyF" && event.ctrlKey) {
            event.preventDefault();
            input.focus();
        }
    })

    // input.addEventListener("blur", unsearch);
    window.addEventListener("click", event => {
        if (event.target !== input && event.target !== overlay) {
            unsearch();
        }
    });

    function updateOverlayPosition() {
        let rect = input.getBoundingClientRect();
        overlay.style.top = `${rect.bottom}px`;
        overlay.style.left = `${rect.left}px`;
    }

    window.addEventListener("resize", updateOverlayPosition);
    updateOverlayPosition();

    if (window.innerWidth > 700) input.focus();
}

async function loadBinaryInput() {
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
}

(async () => {
    await loadBinaryInput();
    await loadFunctionInput();
})();
