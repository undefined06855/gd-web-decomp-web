import { setupInputs, updateInputs } from "./inputs.js";
import { loadFromServerData } from "./monaco.js";

const defaultState = {
    version: "2.2091",
    binary: "libcocos2dcpp-32.so",
    function: null
};

// https://stackoverflow.com/a/3354511

export async function updateAll(isNavigating = true) {
    updateInputs();

    console.log(`updateAll(navigating = ${isNavigating})`);
    console.log(`presetData: ${window.presetData}, ${window.presetData.function}`);

    if (window.presetData.function == null) {
        document.querySelector("#code-editors").style.display = "none";
        document.querySelector("#homepage").style.display = "";
    } else {
        document.querySelector("#code-editors").style.display = "";
        document.querySelector("#homepage").style.display = "none";

        document.title = `GD Web Decomp | ${window.presetData.function} from ${window.presetData.binary} @ ${window.presetData.version}`;
        if (isNavigating) {
            window.location.hash = "";
            window.history.pushState({ presetData: window.presetData }, "", `/${window.presetData.version}/${window.presetData.binary}/${window.presetData.function}`);
        }

        loadFromServerData();
    }

    document.querySelector("#loading-spinner").style.display = "none";
}

// TODO: going backwards and forwards a bit buggy still
window.addEventListener("popstate", async event => {
    console.log(`popstate: ${event.state?.presetData}`)
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

await setupInputs();
await updateAll(false);
