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
        // domReadOnly: true,
        tabSize: 2, // ...sadly
    };

    if (window.innerWidth < 700) {
        params["fontSize"] = 10;
    }

    let res = await fetch("/{{BINARY}}/{{FUNCTION}}/data.json");
    if (res.status == 404) {
        document.querySelector("#http-cat-image").style.display = "block";
        return;
    }

    let json = await res.json();

    function doShitForEditor(editor, editorType) {
        editor.onDidChangeCursorSelection(event => {
            // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.ISelection.html
            let selection = event.selection;
            let hashString = `${editorType}=${selection.selectionStartLineNumber},${selection.selectionStartColumn},${selection.positionLineNumber},${selection.positionColumn}`;

            let hashes = window.location.hash.slice(1).split("$");
            let replacedExisting = false;
            for (let [i, hash] of Object.entries(hashes)) {
                let [ editorID, _ ] = hash.split("=");
                if (editorID == editorType) {
                    replacedExisting = true;
                    hashes[i] = hashString;
                    break;
                }
            }

            if (!replacedExisting) {
                hashes.push(hashString);
            }

            window.location.hash = hashes.join("$");
        });

        let hashes = window.location.hash.slice(1).split("$");
        for (let hash of hashes) {
            let [ editorID, location ] = hash.split("=");
            if (editorID != editorType) continue;

            // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneCodeEditor.html#setSelection
            let split = location.split(",");
            editor.setSelection({
                selectionStartLineNumber: Number(split[0]),
                selectionStartColumn: Number(split[1]),
                positionLineNumber: Number(split[2]),
                positionColumn: Number(split[3])
            });
            editor.revealLineInCenter(Number(split[0]));

            break;
        }

        return editor
    }

    doShitForEditor(monaco.editor.create(
        document.getElementById("assembly"),
        {
            language: "asm",
            value: `${json.assembly}\n`,
            minimap: { enabled: false },
            ...params
        }
    ), "assembly");

    /** @type {string} */
    let pseudocode = json.pseudocode;

    let localVariablesStart = pseudocode.indexOf("\n{") + 2;
    let localVariablesEnd = pseudocode.indexOf("\n\n", localVariablesStart);

    if (localVariablesEnd != -1) {
        let before = pseudocode.substring(0, localVariablesStart);
        let localVars = pseudocode.substring(localVariablesStart, localVariablesEnd);
        let after = pseudocode.substring(localVariablesEnd);

        pseudocode = `${before}\n#pragma region local vars${localVars}\n#pragma endregion local vars${after}`;
    }

    let pseudocodeEditor = doShitForEditor(monaco.editor.create(
        document.getElementById("pseudocode"),
        {
            language: "cpp",
            value: `${pseudocode}\n`,
            minimap: { enabled: true },
            ...params
        }
    ), "pseudocode");

    if (localVariablesEnd != -1) {
        // this is an internal api or something? not sure but i cant find documentation for it anywhere
        // anyway this works i checked the minified source
        let foldingModel = pseudocodeEditor.getContribution("editor.contrib.folding").foldingModel;
        let callback = foldingModel.onDidChange(() => {
            callback.dispose();
            foldingModel.toggleCollapseState([{
                regionIndex: 0
            }]);
        });
    }
});
