import { execSync } from "child_process";

execSync("forge install carrot=carrot-kpi/contracts-v1 --no-commit");
execSync("forge install foundry-rs/forge-std --no-commit");
execSync("forge install dapphub/ds-test --no-commit");

console.log("Foundry dependencies installed");
