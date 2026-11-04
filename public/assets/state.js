import { fetchInputData, setupBinaryInput, setupFunctionInput, setupVersionInput, updateInputs } from "./inputs.js";
import { loadFromServerData } from "./monaco.js";

const defaultState = {
    version: "2.2081",
    binary: "libcocos2dcpp-32.so",
    function: null,
};

// https://stackoverflow.com/a/3354511
export async function updateAll(isNavigating = true) {
    updateInputs();

    console.log(`updateAll(navigating = ${isNavigating})`);
    console.log(`presetData: ${window.presetData}, ${window.presetData.function}`);

    if (window.presetData.function == null) {
        document.querySelector("#code-editors").style.display = "none";
        document.querySelector("#homepage").style.display = "";
        document.title = "GD Web Decomp";
    } else {
        document.querySelector("#code-editors").style.display = "";
        document.querySelector("#homepage").style.display = "none";
        document.title = `GD Web Decomp | ${window.presetData.function} from ${window.presetData.binary} @ ${window.presetData.version}`;

        loadFromServerData();
    }

    if (isNavigating) {
        if (window.presetData.function == null) {
            window.history.pushState({ presetData: window.presetData }, "", "/");
        } else {
            window.history.pushState(
                { presetData: window.presetData },
                "",
                `/${window.presetData.version}/${window.presetData.binary}/${window.presetData.function}`,
            );
        }
    }

    document.querySelector("#loading-spinner").style.display = "none";
}

// TODO: going backwards and forwards a bit buggy still
window.addEventListener("popstate", async event => {
    console.log(`popstate: ${event.state?.presetData}`);

    // in an ideal world this would never happen...
    if (event.state?.presetData === undefined && window.location.pathname != "/") {
        console.error(
            `no presetData in popstate event but window location is ${window.location.pathname}! Reloading...`,
        );
        window.location.reload();
    }

    window.presetData = event.state?.presetData ?? { ...defaultState };
    await updateAll(false);
});

// window.addEventListener("pageshow", async event => {
//     console.log(`pageshow, persisted: ${event.persisted}`);
//     await updateAll(false);
// });

// autofilled by server
if (!window.presetData) {
    window.presetData = { ...defaultState };
}

await fetchInputData();
setupBinaryInput();
setupVersionInput();
setupFunctionInput();
await updateAll(false);

document.querySelector("#icon").addEventListener("click", async event => {
    event.preventDefault();
    window.presetData.function = null;
    await updateAll();
});

Array.from(document.querySelectorAll("img")).forEach(img =>
    img.addEventListener("dragstart", event => {
        event.preventDefault();
    }),
);
