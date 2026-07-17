import * as fs from "fs/promises"

let defaultFunctions = [
    "GeometryDash.exe/PlayLayer__init",
    "GeometryDash.exe/MenuLayer__init",
    "GeometryDash.exe/CreatorLayer__init",
    "GeometryDash.exe/GJBaseGameLayer__update",
    "GeometryDash.exe/PauseLayer__customSetup",
    "GeometryDash.exe/PlayLayer__postUpdate",
    "GeometryDash.exe/PlayerObject__init",
    "GeometryDash.exe/LevelCell__loadCustomLevelCell",
]

let server = Bun.serve({
    routes: {
        "/": req => {
            let randomFunction = defaultFunctions[~~(Math.random() * defaultFunctions.length)];
            return Response.redirect(`/${randomFunction}`);
        },

        "/style.css": Bun.file("./public/style.css"),

        "/binaries.json": async req => {
            let ret = [];

            for (let file of await fs.readdir(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}`)) {
                ret.push(file);
            }

            return new Response(JSON.stringify(ret), { headers: { "Content-Type": "application/json" } });
        },

        "/:binary/functions.json": async req => {
            let ret = [];

            for (let file of await fs.readdir(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}/${req.params.binary}`)) {
                if (!file.endsWith(".json")) continue;
                ret.push(file.replace(".json", ""));
            }

            return new Response(JSON.stringify(ret), { headers: { "Content-Type": "application/json" } });
        },

        "/:binary/:function": async req => {
            let html = await Bun.file("./public/index.html").text();
            html = html.replaceAll("{{BINARY}}", `${req.params.binary}`);
            html = html.replaceAll("{{FUNCTION}}", `${req.params.function}`);
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        },

        "/:binary/:function/main.js": async req => {
            let js = await Bun.file("./public/main.js").text();
            js = js.replaceAll("{{BINARY}}", `${req.params.binary}`);
            js = js.replaceAll("{{FUNCTION}}", `${req.params.function}`);
            return new Response(js, { headers: { "Content-Type": "text/javascript" } });
        },

        "/:binary/:function/data.json": async req => {
            return new Response(Bun.file(`${process.env["GD_WEB_DECOMP_OUTPUT_DIR"]}/${req.params.binary}/${req.params.function}.json`));
        }
    },

    async fetch(req) {
        let url = new URL(req.url);

        if (url.pathname.startsWith("/monaco/")) {
            let file = Bun.file(`./node_modules/${url.pathname.replace("/monaco/", "monaco-editor/")}`);
            if (await file.exists()) {
                return new Response(file);
            }
        }

        return new Response(Bun.file("./public/404.html"));
    }
});

console.log(`Running server on port ${server.port}`);
