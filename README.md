# contracts

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
npx hardhat ignition deploy ./ignition/modules/Stablecoin.ts --network localhost
npx hardhat ignition deploy ./ignition/modules/UVX.ts --network localhost
npx hardhat ignition deploy ./ignition/modules/Claims.ts --network localhost
```

If the addresses deployed come out as shown below the setup should be alright.

```
Stablecoin    0x5FbDB2315678afecb367f032d93F642f64180aa3
UVX           0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Claims        0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

Finally grant all necessary roles for the local setup to work properly.

```
npx hardhat run ./scripts/grantRoles.ts --network localhost
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
