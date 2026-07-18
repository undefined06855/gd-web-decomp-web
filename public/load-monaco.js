// this code is so ugly

// TODO: language suppot for not c++
// TODO: maybe dont reload the whole page on page change?
// TODO: get a better import system or whatever
// TODO: ctrl+click support

require.config({ paths: { vs: "/node_module/monaco/min/vs" } });
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
    if (res.status == 404) {
        document.querySelector("#http-cat-image").style.display = "block";
        return;
    }

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
