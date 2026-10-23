import { updateAll } from "./state.js";
import { FuseWorker } from "/node_module/fuse/dist/fuse-worker.mjs"

let versionInput = document.querySelector("select#version-input");
let binaryInput = document.querySelector("select#binary-input");
let functionInput = document.querySelector("input#function-input");
let overlay = document.querySelector("div#search-overlay");
let json = {};

/**
 * called from state.js
 */
export function updateInputs() {
    versionInput.value = window.presetData.version;
    binaryInput.value = window.presetData.binary;
    functionInput.value = window.presetData.function ?? "";
}

let versionEventController = null;
export function setupVersionInput() {
    console.log("setting up version input");
    versionInput.replaceChildren();

    for (let version of json.versions) {
        let option = document.createElement("option");
        option.innerText = version;
        option.value = version;
        versionInput.appendChild(option);
    }

    if (versionEventController) versionEventController.abort();
    versionEventController = new AbortController();

    versionInput.addEventListener("input", async event => {
        window.presetData.version = versionInput.value;
        await fetchInputData();
        setupBinaryInput();
        setupFunctionInput();
        updateAll();
    }, { signal: versionEventController.signal });
}

let binaryEventController = null;
export function setupBinaryInput() {
    console.log("setting up binary input");
    binaryInput.replaceChildren();

    for (let binary of json.binaries) {
        let option = document.createElement("option");
        option.innerText = binary;
        option.value = binary;
        binaryInput.appendChild(option);
    }

    if (binaryEventController) binaryEventController.abort();
    binaryEventController = new AbortController();

    binaryInput.addEventListener("input", async event => {
        window.presetData.binary = binaryInput.value;
        await fetchInputData();
        setupFunctionInput();
        updateAll();
    }, { signal: binaryEventController.signal });
}

let functionEventController = null;
export function setupFunctionInput() {
    console.log("setting up function input");
    let fuse = new FuseWorker(json.functions);

    async function search() {
        let results = await fuse.search(functionInput.value);
        results = results.slice(0, 100);
        let children = [];

        for (let result of results) {
            let child = document.createElement("div");
            child.innerText = result.item;
            children.push(child);

            child.addEventListener("click", event => {
                unsearch();
                window.presetData.function = result.item;
                updateAll();
            });
        }

        overlay.replaceChildren(...children);
        overlay.style.display = "";
    }

    function unsearch() {
        overlay.style.display = "none";
    }

    if (functionEventController) functionEventController.abort();
    functionEventController = new AbortController();

    functionInput.addEventListener("input", event => {
        search(); // is it okay to rerun fuse search on every single key lol
    }, { signal: functionEventController.signal });

    functionInput.addEventListener("keydown", event => {
        if (event.code == "Enter") {
            overlay.children[0].click();
        }
    }, { signal: functionEventController.signal })

    window.addEventListener("keydown", event => {
        if (event.code == "KeyF" && event.ctrlKey) {
            event.preventDefault();
            functionInput.focus();
        }
    }, { signal: functionEventController.signal });

    // input.addEventListener("blur", unsearch);
    functionInput.addEventListener("click", event => {
        if (event.target !== functionInput && event.target !== overlay) {
            unsearch();
        }
    }, { signal: functionEventController.signal });

    function updateOverlayPosition() {
        let rect = functionInput.getBoundingClientRect();
        overlay.style.top = `${rect.bottom}px`;
        overlay.style.left = `${rect.left}px`;
    }

    window.addEventListener("resize", updateOverlayPosition, { signal: functionEventController.signal });
    updateOverlayPosition();

    if (window.innerWidth > 700) functionInput.focus();
}

export async function fetchInputData() {
    console.log("fetching input data");
    let res = await fetch(`/${window.presetData.version}/${window.presetData.binary}/data.json`);
    json = await res.json();
}
