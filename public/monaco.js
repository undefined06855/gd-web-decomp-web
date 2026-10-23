// TODO: ctrl+click support?
// TODO: better assembly highlighting
// TODO: better class highlighting?

require.config({ paths: { vs: "/node_module/monaco/min/vs" } });
await (() => { return new Promise((resolve, reject) => require(["vs/editor/editor.main"], resolve, reject)); })();

class MonacoEditor {
    constructor(editorID) {
        this.id = editorID;
        this.isSettingValue = false;
        this.createdEditor = false;
        this.editor = null;
    }

    /**
     * defer creating editor until we actually need one to improve load times on /
     */
    createEditorIfNeeded() {
        if (this.createdEditor) return;

        // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneEditorConstructionOptions.html
        const params = {
            theme: "vs-dark",
            automaticLayout: true,
            readOnly: true,
            // domReadOnly: true,
            minimap: { enabled: this.id == "pseudocode" },
            language: this.id == "pseudocode" ? "cpp" : "asm",
            tabSize: 2, // ...sadly
            value: "Loading..."
        };

        if (window.innerWidth < 700) {
            params["fontSize"] = 10;
        }

        this.editor = monaco.editor.create(document.getElementById(this.id), params);

        this.editor.onDidChangeCursorSelection(event => {
            if (this.isSettingValue) return;

            // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.ISelection.html
            let selection = event.selection;
            let hashString = `${this.id}=${selection.selectionStartLineNumber},${selection.selectionStartColumn},${selection.positionLineNumber},${selection.positionColumn}`;

            let hashes = window.location.hash.slice(1).split("$");
            let replacedExisting = false;
            for (let [i, hash] of Object.entries(hashes)) {
                let [ id, _ ] = hash.split("=");
                if (id == this.id) {
                    replacedExisting = true;
                    hashes[i] = hashString;
                    break;
                }
            }

            if (!replacedExisting) {
                hashes.push(hashString);
            }

            console.log(`setting hash from ${this.id}`);
            history.replaceState(undefined, undefined, `#${hashes.join("$")}`)
        });

        this.createdEditor = true;
    }

    update(text) {
        let localVariablesStart = text.indexOf("\n{") + 2;
        let localVariablesEnd = text.indexOf("\n\n", localVariablesStart);

        let lineThatPragmaStartsOn = 0;

        if (this.id == "pseudocode" && localVariablesEnd != -1) {
            let before = text.substring(0, localVariablesStart);
            let localVars = text.substring(localVariablesStart, localVariablesEnd);
            let after = text.substring(localVariablesEnd);

            text = `${before}\n#pragma region local vars${localVars}\n#pragma endregion local vars${after}`;

            for (let [i, line] of Object.entries(text.split("\n"))) {
                if (line.startsWith("#pragma region local vars")) {
                    lineThatPragmaStartsOn = parseInt(i) + 1;
                    break;
                }
            }
        }

        this.createEditorIfNeeded();

        // isSettingValue is used to prevent onDidChangeCursorSelection from firing
        this.isSettingValue = true;
        this.editor.setValue(text);
        this.isSettingValue = false;

        if (this.id == "pseudocode" && localVariablesEnd != -1) {
            // this is an internal api or something? not sure but i cant find documentation for it anywhere
            // anyway this works i checked the minified source
            let foldingModel = this.editor.getContribution("editor.contrib.folding").foldingModel;
            let callback = foldingModel.onDidChange(() => {
                callback.dispose();

                for (let regionIndex = 0; regionIndex < foldingModel.regions.length; regionIndex++) {
                    if (foldingModel.regions.toRegion(regionIndex).startLineNumber == lineThatPragmaStartsOn) {
                        foldingModel.toggleCollapseState([{ regionIndex }]);
                        break;
                    }
                }

                // TODO: this sometimes fails for no reason?
                console.warn(`failed to find region index to toggle out of ${foldingModel.regions.length} regions!`);
            });
        }

        let hashes = window.location.hash.slice(1).split("$");
        for (let hash of hashes) {
            let [ editorID, location ] = hash.split("=");
            if (editorID != this.id) continue;

            // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IStandaloneCodeEditor.html#setSelection
            let split = location.split(",");
            this.editor.setSelection({
                selectionStartLineNumber: Number(split[0]),
                selectionStartColumn: Number(split[1]),
                positionLineNumber: Number(split[2]),
                positionColumn: Number(split[3])
            });
            this.editor.revealLineInCenter(Number(split[0]));

            break;
        }
    }
}

/**
 * called from state.js
 */
export async function loadFromServerData() {
    let res = await fetch(`/${window.presetData.version}/${window.presetData.binary}/${window.presetData.function}.json`);
    if (res.status == 404) {
        document.querySelector("#http-cat-image").style.display = "";
        document.querySelector("#code-editors").style.display = "none";
        return;
    } else {
        document.querySelector("#http-cat-image").style.display = "none";
        document.querySelector("#code-editors").style.display = "";
    }

    let json = await res.json();
    assemblyEditor.update(json.assembly);
    pseudocodeEditor.update(json.pseudocode);
}

let assemblyEditor = new MonacoEditor("assembly");
let pseudocodeEditor = new MonacoEditor("pseudocode");
