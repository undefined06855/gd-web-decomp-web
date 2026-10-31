import * as fs from "fs/promises";

const outputDir = process.env["GD_WEB_DECOMP_OUTPUT_DIR"];

let server = Bun.serve({
    routes: {
        "/node_module/*": async req => {
            let url = new URL(req.url);
            let path = url.pathname.replace("/node_module/", "");

            let modules = {
                monaco: "monaco-editor",
                fuse: "fuse.js",
            };

            for (let [fakePath, realPath] of Object.entries(modules)) {
                if (path.startsWith(`${fakePath}/`)) {
                    let file = Bun.file(`./node_modules/${path.replace(`${fakePath}/`, `${realPath}/`)}`);
                    if (await file.exists()) {
                        return new Response(file, { headers: { "Content-Type": file.type } });
                    }
                }
            }

            return new Response(Bun.file("public/404.html"), { status: 404 });
        },

        "/:file": async req => {
            let file = Bun.file(`public/assets/${req.params.file}`);
            if (!(await file.exists())) return new Response(Bun.file("public/404.html"), { status: 404 });
            return new Response(file, { headers: { "Content-Type": file.type } });
        },

        "/": Bun.file("public/index.html"),
        "/:version/:binary/:function": async req => {
            if (req.params.function.endsWith(".json")) {
                let file = Bun.file(
                    `${outputDir}/${req.params.version}/${req.params.binary}/data/${req.params.function}`,
                );
                if (!(await file.exists())) return new Response(Bun.file("public/404.html"), { status: 404 });
                return new Response(file);
            } else {
                let html = await Bun.file("public/index.html").text();

                return new Response(
                    new HTMLRewriter()
                        .on("body", {
                            element: body => {
                                body.prepend(
                                    `
                                        <script>
                                            window.presetData = {
                                                version: ${JSON.stringify(req.params.version)},
                                                binary: ${JSON.stringify(req.params.binary)},
                                                function: ${JSON.stringify(req.params.function)}
                                            };
                                        </script>
                                    `.trim(),
                                    { html: true },
                                );
                            },
                        })
                        .transform(html),
                    {
                        headers: { "Content-Type": "text/html" },
                    },
                );
            }
        },

        "/:version/:binary/data.json": async req => {
            let versions = [];
            for (let folder of await fs.readdir(`${outputDir}`)) {
                if (await Bun.file(`${outputDir}/${folder}`).exists()) continue; // this is a file not a directory
                versions.push(folder);
            }

            versions.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

            let binaries = [];
            for (let binary of await fs.readdir(`${outputDir}/${req.params.version}`)) {
                if (await Bun.file(`${outputDir}/${req.params.version}/${binary}`).exists()) continue; // this is a file not a directory
                if (!(await fs.exists(`${outputDir}/${req.params.version}/${binary}/data`))) continue; // no data subdirectory
                binaries.push(binary);
            }

            binaries.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

            let functions = [];
            if (await fs.exists(`${outputDir}/${req.params.version}/${req.params.binary}/data`)) {
                for (let file of await fs.readdir(`${outputDir}/${req.params.version}/${req.params.binary}/data`)) {
                    if (!file.endsWith(".json")) continue;
                    functions.push(file.replace(".json", ""));
                }
            }

            functions.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

            return new Response(JSON.stringify({ versions, binaries, functions }), {
                headers: { "Content-Type": "application/json" },
            });
        },

        "/*": req => new Response(Bun.file("public/404.html"), { status: 404 }),
    },

    port: process.env["PORT"],
    development: process.env["DEVELOPMENT"] == "true",
});

console.log(`Running server on port ${server.port}`);
