# GD Web Decomp Web

A web UI for https://github.com/undefined06855/gd-web-decomp! Slightly buggy, but (since v2!) does not rely on fetching
every single page and can be heavily cached.

## Setup

1. Clone this repository
1. Setup and run [gd-web-decomp](https://github.com/undefined06855/gd-web-decomp) anywhere
1. Create a `.env` file with the following content:

````env
GD_WEB_DECOMP_OUTPUT_DIR="/path/to/gd-web-decomp/output"
PORT=8080
DEVELOPMENT=true
``` (or set the environment variables manually)
1. Run `bun i` to install dependencies, then `bun main` to start hosting!

This project was created using `bun init` in bun v1.4.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
````
