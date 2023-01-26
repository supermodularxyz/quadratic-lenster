# Backend

Package for managing the Round state via event monitoring using OpenZeppelin Defender.

1. Create Notification channel
2. Create Relayer => Send transaction to RoundImplementation
3. Build Autotask => Parses TS file to CJS export
3. Create Autotask => Parses event and kicks of Relayer
4. Get Autotask webhook from Dashboard
4. Create Sentinel => Monitor event and kicks of Autotask