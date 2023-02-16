# Quadratic Lenster

:warning: This application is under development and only supports Lens Sandbox :warning:

## Packages

- `app`: Submodule with a Lenster fork
- `backend`: Config and script for OpenZeppelin Defender
- `contracts`: Smart contracts for the QuadraticFundingVoteCollectModule
- `grants`: Submodule with an extended fork of the Grants Protocol
- `graph`: Subgraph for monitoring QuadraticFundingVoteCollectModule

## Getting started

1. Use Node version`>=18.0.0`
2. `yarn install`

### Setting up a round

### Creating a post in Quadratic Lenster

### Voting

- Get [WMATIC](https://mumbai.polygonscan.com/address/0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889#writeContract). For example by wrapping MATIC from the [Faucet](https://faucet.polygon.technology/) and depositting it in the wrapper contract.

## Deployments

### App

[Quadratic Lenster](https://qf-lenster-web.vercel.app/)

### Backend

Hosted on OZ Defender with setup instructions in [README](./packages//backend//README.md)

### Contracts

| Network | Address                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Mumbai  | [0xfA54ddC48E78C9C222b20605CB3FA56f5d4ab994](https://mumbai.polygonscan.com/address/0xfA54ddC48E78C9C222b20605CB3FA56f5d4ab994) |

### Grants

- [App](https://grants-round.vercel.app)
- [Contracts](https://github.com/bitbeckers/grants-round/tree/main/packages/contracts/scripts/config)

### Graph

- [QuadraticFundingVotingModule](https://thegraph.com/hosted-service/subgraph/bitbeckers/vote-collect-dev)
- [Grants protocol](https://thegraph.com/hosted-service/subgraph/bitbeckers/vote-collect-dev)
