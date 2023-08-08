#!/usr/bin/env node

// if forge fmt is executed from the root of the monorepo the
// paths aren't right.

import { execSync } from "child_process";

let arg = process.argv[2];
if (!arg) {
    console.error("no arg");
    process.exit(1);
}

execSync(`forge fmt ${arg !== "format" ? "--check " : ""}`, { stdio: "inherit" });
