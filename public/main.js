// this code is so ugly

// TODO: language suppot for not c++
require.config({ paths: { vs: "/monaco/min/vs" } });
require(["vs/editor/editor.main"], async () => {
    // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneEditorConstructionOptions.html
    const params = {
        theme: "vs-dark",
        automaticLayout: true,
        readOnly: true,
        domReadOnly: true,
        tabSize: 2, // ...sadly
    }

    let res = await fetch("/{{BINARY}}/{{FUNCTION}}/data.json");
    let json = await res.json();

    monaco.editor.create(
        document.getElementById("assembly"),
        {
            language: "asm",
            value: `${json.assembly}\n`,
            minimap: { enabled: false },
            ...params
        }
    );

    monaco.editor.create(
        document.getElementById("pseudocode"),
        {
            language: "cpp",
            value: `${json.pseudocode}\n`,
            minimap: { enabled: true },
            ...params
        }
    );
});

let bar = document.querySelector("#resize-bar")
let dragging = false;

bar.addEventListener("pointerdown", event => {
    dragging = true;
    bar.setPointerCapture(event.pointerId)
});

bar.addEventListener("pointermove", event => {
    if (!dragging) return;

    let rect = document.querySelector("#code-editors").getBoundingClientRect();
    document.querySelector("#assembly").style.width = `${event.clientX - rect.left}px`;
});

bar.addEventListener("pointerup", event => {
    dragging = false;
});


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
