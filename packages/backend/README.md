# Backend

Package for managing the Round state via event monitoring using OpenZeppelin Defender.

1. Create a relayer on OpenZeppelin defender
2. Create a round and add the relayer address as en operator
3. Set the `ROUND_IMPLEMENTATION_ADDRESS`, `DEFENDER_ADMIN_API_KEY`, `DEFENDER_ADMIN_API_SECRET` and `RELAYER_ID` as env
   vars. Note that the relayer ID should be the ID not the wallet address, but the ID of the relayer on openzeppelin.
4. Set the required env vars
   on https://defender.openzeppelin.com/#/autotask/secrets: `GRAPGHQL_ENDPOINT`
   and `PINATA_JWT`
5. `yarn run deploy`
