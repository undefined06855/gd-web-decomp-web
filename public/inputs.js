import { updateAll } from "./state.js";
import { FuseWorker } from "/node_module/fuse/dist/fuse-worker.mjs"

let versionInput = document.querySelector("select#version-input");
let binaryInput = document.querySelector("select#binary-input");
let functionInput = document.querySelector("input#function-input");
let overlay = document.querySelector("div#search-overlay");

/**
 * called from state.js
 */
export function updateInputs() {
    versionInput.value = window.presetData.version;
    binaryInput.value = window.presetData.binary;
    functionInput.value = window.presetData.function ?? "";
}

/**
 * ideally wouldn't be called from state.js but it is since it needs to be called after window.presetData.function is
 * set
 */
export async function setupInputs() {
    let res = await fetch(`/${window.presetData.version}/${window.presetData.binary}/data.json`);
    let json = await res.json();

    for (let version of json.versions) {
        let option = document.createElement("option");
        option.innerText = version;
        option.value = version;
        versionInput.appendChild(option);
    }

    for (let binary of json.binaries) {
        let option = document.createElement("option");
        option.innerText = binary;
        option.value = binary;
        binaryInput.appendChild(option);
    }

    versionInput.addEventListener("input", event => {
        window.presetData.version = versionInput.value;
        updateAll();
    });

    binaryInput.addEventListener("input", event => {
        window.presetData.binary = binaryInput.value;
        updateAll();
    });

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

    functionInput.addEventListener("input", event => {
        search(); // is it okay to rerun fuse search on every single key lol
    });

    functionInput.addEventListener("keydown", event => {
        if (event.code == "Enter") {
            overlay.children[0].click();
        }
    })

    window.addEventListener("keydown", event => {
        if (event.code == "KeyF" && event.ctrlKey) {
            event.preventDefault();
            functionInput.focus();
        }
    });

    // input.addEventListener("blur", unsearch);
    functionInput.addEventListener("click", event => {
        if (event.target !== functionInput && event.target !== overlay) {
            unsearch();
        }
    });

    function updateOverlayPosition() {
        let rect = functionInput.getBoundingClientRect();
        overlay.style.top = `${rect.bottom}px`;
        overlay.style.left = `${rect.left}px`;
    }

    window.addEventListener("resize", updateOverlayPosition);
    updateOverlayPosition();

    if (window.innerWidth > 700) functionInput.focus();
}
