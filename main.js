import { FILE } from "dns";
import * as fs from "fs/promises"

let defaultFunctions = [
    "libcocos2dcpp-32.so/PlayLayer__init",
    "libcocos2dcpp-32.so/MenuLayer__init",
    "libcocos2dcpp-32.so/CreatorLayer__init",
    "libcocos2dcpp-32.so/GJBaseGameLayer__update",
    "libcocos2dcpp-32.so/PauseLayer__customSetup",
    "libcocos2dcpp-32.so/PlayLayer__postUpdate",
    "libcocos2dcpp-32.so/PlayerObject__init",
    "libcocos2dcpp-32.so/LevelCell__loadCustomLevelCell",
];

let aggressiveCachingHeaders = {
    "Cache-Control": "public, max-age=3600, immutable"
};

let monacoCachingHeaders = {
    "Cache-Control": "public, max-age=86400, immutable"
}

let server = Bun.serve({
    routes: {
        "/": req => {
            let randomFunction = defaultFunctions[~~(Math.random() * defaultFunctions.length)];
            return Response.redirect(`/${randomFunction}`);
        },

        "/binaries.json": async req => {
            let ret = [];

            for (let file of await fs.readdir(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}`)) {
                ret.push(file);
            }

            return new Response(JSON.stringify(ret), { headers: aggressiveCachingHeaders });
        },

        "/:binary/functions.json": async req => {
            let ret = [];

            for (let file of await fs.readdir(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}/${req.params.binary}`)) {
                if (!file.endsWith(".json")) continue;
                ret.push(file.replace(".json", ""));
            }

            return new Response(JSON.stringify(ret), { headers: aggressiveCachingHeaders });
        },

        "/:binary/:function": async req => {
            let file = Bun.file("./public/index.html");
            if (!await file.exists()) { return new Response("404 Not Found", { status: 404 }); }

            let html = await file.text();
            html = html.replaceAll("{{BINARY}}", `${req.params.binary}`);
            html = html.replaceAll("{{FUNCTION}}", `${req.params.function}`);
            return new Response(html, { headers: { "Content-Type": file.type } });
        },

        "/:binary/:function/data.json": async req => {
            return new Response(Bun.file(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}/${req.params.binary}/${req.params.function}.json`), { headers: aggressiveCachingHeaders });
        },

        "/:binary/:function/:file": async req => {
            let file = Bun.file(`./public/${req.params.file}`);
            if (!await file.exists()) { return new Response("404 Not Found", { status: 404 }); }

            let js = await file.text();
            js = js.replaceAll("{{BINARY}}", `${req.params.binary}`);
            js = js.replaceAll("{{FUNCTION}}", `${req.params.function}`);
            return new Response(js, { headers: { "Content-Type": file.type } });
        },
    },

    async fetch(req) {
        let url = new URL(req.url);

        if (url.pathname.startsWith("/monaco/")) {
            let file = Bun.file(`./node_modules/${url.pathname.replace("/monaco/", "monaco-editor/")}`);
            if (await file.exists()) {
                return new Response(file, { headers: monacoCachingHeaders });
            }
        }

        return new Response(Bun.file("./public/404.html"));
    }
});

console.log(`Running server on port ${server.port}`);
