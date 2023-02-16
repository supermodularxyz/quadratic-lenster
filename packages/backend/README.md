# Backend

Package for managing the Round state via event monitoring using OpenZeppelin Defender.

1. Create a relayer on OpenZeppelin defender
2. Create a round and add the relayer address as en operator
3. Set the `ROUND_IMPLEMENTATION_ADDRESS`, `DEFENDER_ADMIN_API_KEY`, `DEFENDER_ADMIN_API_SECRET` and `RELAYER_ID` as env
   vars. Note that the relayer ID (e.g. `8e42d8c4-1cf0-4cac-863b-fce50420997e`) should be the ID and not the wallet
   address.
4. Ensure the relay has funds to perform transactions, either by using a faucet or transferring funds to it directly.
5. Set the required env vars
   on https://defender.openzeppelin.com/#/autotask/secrets: `GRAPGHQL_ENDPOINT`
   and `PINATA_JWT`
6. `yarn run deploy`