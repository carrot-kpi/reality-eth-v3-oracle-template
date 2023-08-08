# Contributing

The Reality.eth v3 oracle template contracts are developed using Foundry, so in
order to contribute you need to first install Foundry locally. Check out
[this link](https://getfoundry.sh/) to easily install Foundry on your machine.
Make sure you periodically update Foundry to the latest version.

Foundry manages dependencies using git submodules, so it's advised to use
`git clone --recurse-submodules` when cloning the repo in order to have a
ready-to-go environment. If `git clone` was used without the
`--recurse-submodules` flag, you can just run
`git submodule update --init --recursive` in the cloned repo in order to easily
install the dependencies.

After having done the above, the environment should be ready to work with.

## Profiles

Profiles can be used in Foundry to specify different build configurations to
fine-tune the development process. Here we use 2 profiles:

- `test`: This profile pretty much skips all the optimizations and focuses on
  raw speed. As the name suggests, this is used to run all the available tests
  in a quick way, and without useless optimization.
- `production`: The production profile must be used when deploying contracts in
  production. This profile achieves a good level of optimization and also
  focuses on the production contracts, skipping compilation of the tests
  entirely. Depending on your machine, building with this profile can take some
  time.

All the profiles above are specified in the `foundry.toml` file at the root of
the project.

## Testing

Tests are written in Solidity and you can find them in the `tests` folder. Both
property-based fuzzing and standard unit tests are easily supported through the
use of Foundry.

In order to launch tests you can both use Forge commands directly or npm
scripts.

## Pre-commit hooks

In order to reduce the ability to make mistakes to the minimum, pre-commit hooks
are enabled to both run all the available tests and to lint the commit message
through `husky` and `@commitlint/config-conventional`. Please have a look at the
supported formats by checking
[this](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
out.

### Deploying the template

In order to deploy the template contract to a given network you can go ahead and
create a .env.<NETWORK_NAME> file exporting 5 env variables:

```
export PRIVATE_KEY=""
export RPC_ENDPOINT=""
export REALITY_ADDRESS=""
export MINIMUM_QUESTION_TIMEOUT=""
export MINIMUM_ANSWER_WINDOWS=""
```

brief explainer of the env variables:

- `PRIVATE_KEY`: the private key related to the account that will perform the
  deployment.
- `RPC_ENDPOINT`: the RPC endpoint that will be used to broadcast transactions.
  This will also determine the network where the deployment will happen.
- `REALITY_ADDRESS`: the reference Reality.eth contract address that this template 
  instance will point to.
- `MINIMUM_QUESTION_TIMEOUT`: the minimum allowed question timeout when asking 
  questions on Reality.eth.
- `MINIMUM_ANSWER_WINDOWS`: a number indicating the minimum amount of answer
  windows that must pass between the question opening timestamp and the KPI token
  expiration. This is used to avoid malicious questions that open for answers right
  before the KPI token expires, not leaving the crowdsourced answer process the
  time to play out organically. As an example, if this value is set to 3 and a
  question is asked that opens at time x with a question timeout of 1 minute,
  the expiration timestamp of the attached KPI token will have to be set to at
  least x + 3 minutes in order for the creation process to go through.


Once you have one instance of this file for each network you're interested in
(e.g. .`env.goerli`, `.env.gnosis`, `env.mainnet` etc etc), you can go ahead and
locally load the env variables by executing `source .env.<NETWORK_NAME>`. After
doing that, you can finally execute the following command to initiate the
deployment:

```
FOUNDRY_PROFILE=production forge script --broadcast --slow --private-key $PRIVATE_KEY --fork-url $RPC_ENDPOINT --sig 'run(address,uint256,uint256)' Deploy $REALITY_ADDRESS $MINIMUM_QUESTION_TIMEOUT $MINIMUM_ANSWER_WINDOWS
```

### Deploying the trusted arbitrator

In order to deploy the trusted arbitrator contract to a given network you can go
ahead and create a .env.<NETWORK_NAME> file exporting 4 env variables:

```
export PRIVATE_KEY=""
export RPC_ENDPOINT=""
export REALITY_ADDRESS=""
export METADATA=""
export QUESTION_FEE=""
export DISPUTE_FEE=""
```

brief explainer of the env variables:

- `PRIVATE_KEY`: the private key related to the account that will perform the
  deployment.
- `RPC_ENDPOINT`: the RPC endpoint that will be used to broadcast transactions.
  This will also determine the network where the deployment will happen.
- `REALITY_ADDRESS`: the reference Reality.eth contract address that this arbitrator 
  instance will point to.
- `METADATA`: the initial arbitrator metadata. Have a look
  [here](https://reality.eth.limo/app/docs/html/arbitrators.html#getting-information-about-the-arbitrator).
- `QUESTION_FEE`: the initial arbitrator question fee, expressed in the target
  chain's native currency.
- `DISPUTE_FEE`: the initial arbitrator dispute fee, expressed in the target
  chain's native currency.

Once you have one instance of this file for each network you're interested in
(e.g. .`env.goerli`, `.env.gnosis`, `env.mainnet` etc etc), you can go ahead and
locally load the env variables by executing `source .env.<NETWORK_NAME>`. After
doing that, you can finally execute the following command to initiate the
deployment:

```
FOUNDRY_PROFILE=production forge script --broadcast --slow --private-key $PRIVATE_KEY --fork-url $RPC_ENDPOINT --sig 'run(address,string,uint256,uint256)' DeployArbitrator $REALITY_ADDRESS $METADATA $QUESTION_FEE $DISPUTE_FEE
```

### Setting the trusted arbitrator creation fee

In order to set the trusted arbitrator creation fee on a given network you can
go ahead and create a .env.<NETWORK_NAME> file exporting 4 env variables:

```
export PRIVATE_KEY=""
export RPC_ENDPOINT=""
export ARBITRATOR=""
export QUESTION_FEE=""
```

brief explainer of the env variables:

- `PRIVATE_KEY`: the private key related to the account that will perform the
  deployment.
- `RPC_ENDPOINT`: the RPC endpoint that will be used to broadcast transactions.
  This will also determine the network where the deployment will happen.
- `ARBITRATOR`: the arbitrator address. You must own this contract.
- `QUESTION_FEE`: the arbitrator question fee, expressed in the target chain's
  native currency.

Once you have one instance of this file for each network you're interested in
(e.g. .`env.goerli`, `.env.gnosis`, `env.mainnet` etc etc), you can go ahead and
locally load the env variables by executing `source .env.<NETWORK_NAME>`. After
doing that, you can finally execute the following command to initiate the
deployment:

```
FOUNDRY_PROFILE=production forge script --broadcast --slow --private-key $PRIVATE_KEY --fork-url $RPC_ENDPOINT --sig 'run(address,uint256)' SetArbitratorQuestionFee $ARBITRATOR $QUESTION_FEE
```
