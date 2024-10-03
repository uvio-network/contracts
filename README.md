# contracts

This repository contains the smart contracts of the Uvio platform. Learn more
about Uvio at https://docs.uvio.network.



### formatting

The smart contracts are formatted using `forge`. Details are configured in the
`foundry.toml`. See https://book.getfoundry.sh/reference/config/formatter for
more information.



### testing

For local testing it is recommended to run an anvil node.

```
anvil --chain-id 1337
```

Deploy the smart contracts for local testing in order.

```
npx hardhat ignition deploy ./ignition/modules/localhost/Stablecoin.ts --network localhost
npx hardhat ignition deploy ./ignition/modules/localhost/UVX.ts --network localhost
npx hardhat ignition deploy ./ignition/modules/localhost/Claims.ts --network localhost
```

The `v0.4.0` contracts can be checked out and deployed at the Git hash below.

```
860577652fcf1c5277de15f2a6aec9bcedf033a8
```

If the addresses deployed come out as shown below the setup should be alright.

```
Stablecoin    0x5FbDB2315678afecb367f032d93F642f64180aa3
UVX           0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Claims        0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

Finally grant all necessary roles for the local setup to work properly.

```
npx hardhat run ./scripts/localhost/grantRoles.v.0.4.0.ts --network localhost
```

The `Claims` contract has a new version on `main` and needs to be deployed separately.

```
npx hardhat ignition deploy ./ignition/modules/localhost/Claims.ts --network localhost
```

```
Claims        0x0165878A594ca255338adfa4d48449f69242Eb8F
```

The newly deployed `Claims` contract needs to get its roles granted too.

```
npx hardhat run ./scripts/localhost/grantRoles.v.0.5.0.ts --network localhost
```

The accounts below are being used in the unit tests.

```
Address(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Address(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Address(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Address(3) 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Address(4) 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
Address(5) 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
Address(6) 0x976EA74026E726554dB657fA54763abd0C3a0aa9
Address(7) 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
Address(8) 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f
Address(9) 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720
```

The npm script `npm run cover` has been removed since the coverage report for
this repository created more problems than it helped to solve. For one the
coverage takes a relatively long time to wait for in CI. And then, a lot of our
unit tests are time based. And for some reason the tests run using coverage
enabled produce a lot of time glitches, which causes the tests to fail due to
leap seconds. Long story short, we do not create code coverage reports in CI. If
anyone wants to see those reports for themselves, just run the following
command locally.

```
./node_modules/.bin/hardhat coverage
```

```
----------------------|----------|----------|----------|----------|----------------|
File                  |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------------|----------|----------|----------|----------|----------------|
 contracts/           |    99.31 |    89.68 |      100 |    95.41 |                |
  Claims.sol          |    99.15 |    89.57 |      100 |    95.51 |... 3,1216,1516 |
  UVX.sol             |      100 |       90 |      100 |    94.96 |... 320,332,370 |
 contracts/interface/ |      100 |      100 |      100 |      100 |                |
  ILender.sol         |      100 |      100 |      100 |      100 |                |
  IReceiver.sol       |      100 |      100 |      100 |      100 |                |
  IStablecoin.sol     |      100 |      100 |      100 |      100 |                |
  IToken.sol          |      100 |      100 |      100 |      100 |                |
 contracts/lib/       |      100 |      100 |      100 |      100 |                |
  Bits.sol            |      100 |      100 |      100 |      100 |                |
 contracts/mock/      |     87.5 |     37.5 |      100 |       75 |                |
  Receiver.sol        |    83.33 |    33.33 |      100 |    71.43 |... 81,82,85,86 |
  Stablecoin.sol      |      100 |       50 |      100 |    85.71 |             13 |
 contracts/test/      |      100 |      100 |      100 |      100 |                |
  BitsTest.sol        |      100 |      100 |      100 |      100 |                |
----------------------|----------|----------|----------|----------|----------------|
All files             |    98.71 |    88.36 |      100 |    94.62 |                |
----------------------|----------|----------|----------|----------|----------------|
```
