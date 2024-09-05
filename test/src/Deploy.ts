import { Address } from "viem";
import { Amount } from "./Amount";
import { Claim } from "./Claim";
import { ethers } from "hardhat";
import { Expiry } from "./Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./Role";
import { Side } from "./Side";

const MAX = maxUint256;

export const Deploy = async () => {
  const sig = await ethers.getSigners();

  const Stablecoin = await ethers.deployContract("Stablecoin");
  const UVX = await ethers.deployContract("UVX", [sig[0].address, await Stablecoin.getAddress()]);
  const Claims = await ethers.deployContract("Claims", [sig[0].address, await UVX.getAddress()]);

  // We grant the BOT_ROLE to the default signer, so that we can simply mint
  // tokens for test users.
  await UVX.grantRole(Role("BOT_ROLE"), sig[0].address);

  // We grant the CONTRACT_ROLE to the Claims contract, so that UVX tokens can
  // be transferred to and from the Claims contract.
  await UVX.grantRole(Role("CONTRACT_ROLE"), await Claims.getAddress());

  return {
    Address: (ind: number): Address => {
      return sig[ind].address as Address;
    },
    Balance: async (ind: number[], amn: number | number[]) => {
      const add = await Claims.getAddress();

      await Promise.all(ind.map(async (x, i) => {
        const val = Amount(Array.isArray(amn) ? amn[i] : amn);

        await UVX.mint(sig[x].address, val);
        await UVX.connect(sig[x]).approve(add, val);
      }));
    },
    Claims: Claims,
    Signer: (ind: number) => {
      return sig[ind];
    },
    Stablecoin: Stablecoin,
    UVX: UVX,
  };
};

export const CreatePropose7WeekExpiry = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

  await Balance([1, 2, 3], 100);

  await Claims.connect(Signer(2)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(7, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1, "minute")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1, "hour")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(20, "hours")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1, "day")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(2, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(4, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(5, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(151, "hours")]); // 6 days + 7 hours
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  return { Address, Claims, Signer };
};

export const CreatePropose16 = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 50);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(6)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(7)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );
  await Claims.connect(Signer(8)).updatePropose(
    Claim(1),
    Amount(50),
    Side(true),
  );

  await Claims.connect(Signer(9)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(10)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(11)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(12)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(13)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(14)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(15)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );
  await Claims.connect(Signer(16)).updatePropose(
    Claim(1),
    Amount(50),
    Side(false),
  );

  return { Address, Balance, Claims, Signer };
};

export const CreatePropose16Expired = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(CreatePropose16);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer };
};

export const ResolveDispute20True30False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateDispute20True30False);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(15, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(13),
    [0, MAX], //           address 4 and 6
    Expiry(22, "days"), // 7 days from 15 above
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(18, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(4)).updateResolve(
    Claim(13),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(21, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(6)).updateResolve(
    Claim(13),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(23, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalance25True = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1], 25);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(25),
    Side(true),
    Expiry(2, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalance25TrueNoVote = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1], 25);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(25),
    Side(true),
    Expiry(2, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0], // address 1
    Expiry(7, "days"),
  );

  // no vote

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalance25False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1], 25);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(25),
    Side(false),
    Expiry(2, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [MAX], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalance20True30False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateResolve20True30False);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge period
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalance30True20False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5], 10);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(false),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0, MAX], // address 1 and 3
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(3)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    3,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    2,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalance70True115False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(20),
    Side(true),
  );
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(19),
    Side(true),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  // Signer 3 plays both sides but got registered first with true
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(11),
    Side(false),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(25),
    Side(false),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(30),
    Side(false),
  );
  await Claims.connect(Signer(6)).updatePropose(
    Claim(1),
    Amount(30),
    Side(false),
  );
  await Claims.connect(Signer(7)).updatePropose(
    Claim(1),
    Amount(20),
    Side(false),
  );
  await Claims.connect(Signer(8)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0, MAX], // address 1 and 4
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(4)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    5,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    5,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalance12TTrue46MFalse = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8], 10_000_000_000_000);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(300),
    Side(false),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(25_000_000),
    Side(false),
  );
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(1_000_000),
    Side(false),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(20_000_200),
    Side(false),
  );

  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(10_000_000_000_000),
    Side(true),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(2_000_000_000_000),
    Side(true),
  );
  await Claims.connect(Signer(6)).updatePropose(
    Claim(1),
    Amount(500_000_000_000),
    Side(true),
  );
  await Claims.connect(Signer(7)).updatePropose(
    Claim(1),
    Amount(20_000_000_000),
    Side(true),
  );
  await Claims.connect(Signer(8)).updatePropose(
    Claim(1),
    Amount(30_000_000_000),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0, MAX], // address 4 and 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(4)).updateResolve(
    Claim(1),
    Side(false),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalancePunishNoVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateResolvePunishNoVotes);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalancePunishEqualVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateResolvePunishEqualVotes);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    3,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    2,
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalanceBoth22True33False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1], 100);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(12),
    Side(true),
  );

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(11),
    Side(false),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(12),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateBalanceBoth44True17False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1], 100);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(17),
    Side(false),
    Expiry(2, "days"),
  );

  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(22),
    Side(true),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(22),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [MAX], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    1,
  );

  return { Address, Claims, Signer, UVX };
};

export const UpdateDispute20True30False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateResolve20True30False);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
  await network.provider.send("evm_mine");

  await Balance([2, 4, 6, 8], 500);

  await Claims.connect(Signer(4)).createDispute(
    Claim(13),
    Amount(20),
    Side(true),
    Expiry(15, "days"), // 7 days from the 8 days above
    Claim(1),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(193, "hours")]); // 8 days + 1 hour
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(2)).updatePropose(
    Claim(13),
    Amount(20),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(195, "hours")]); // 8 days + 3 hours
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(2)).updatePropose(
    Claim(13),
    Amount(25),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(212, "hours")]); // 8 days + 20 hours
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(6)).updatePropose(
    Claim(13),
    Amount(30),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(9, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(8)).updatePropose(
    Claim(13),
    Amount(50),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(10, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(4)).updatePropose(
    Claim(13),
    Amount(20),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(11, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(2)).updatePropose(
    Claim(13),
    Amount(25),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(12, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(8)).updatePropose(
    Claim(13),
    Amount(25),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(13, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(8)).updatePropose(
    Claim(13),
    Amount(40),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(6)).updatePropose(
    Claim(13),
    Amount(20),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(343, "hours")]); // 14 days + 7 hours
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(4)).updatePropose(
    Claim(13),
    Amount(50),
    Side(true),
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateResolve20True30False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5], 10);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0, MAX], //          address 1 and 3
    Expiry(7, "days"), // 4 days from the 3 days above
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(3)).updateResolve(
    Claim(1),
    Side(true),
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateResolvePunishNoVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5], 10);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(10),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [1, MAX - BigInt(1)], // address 2 and 4
    Expiry(7, "days"),
  );

  // no votes cast

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateResolvePunishEqualVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5], 50);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(5),
    Side(false),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).updatePropose(
    Claim(1),
    Amount(12),
    Side(false),
  );
  await Claims.connect(Signer(1)).updatePropose(
    Claim(1),
    Amount(20),
    Side(false),
  );

  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );
  await Claims.connect(Signer(3)).updatePropose(
    Claim(1),
    Amount(10),
    Side(true),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(25),
    Side(true),
  );
  await Claims.connect(Signer(4)).updatePropose(
    Claim(1),
    Amount(20),
    Side(true),
  );
  await Claims.connect(Signer(5)).updatePropose(
    Claim(1),
    Amount(6),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    [0, 2, MAX - BigInt(1), MAX], // address 3, 5, 2 and 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(3)).updateResolve(
    Claim(1),
    Side(false),
  );

  return { Address, Balance, Claims, Signer, UVX };
};

// Here we show that the balances calculated change according to the flipped
// votes. The version with the balances updated based on true votes can be found
// in test/Claims.updateBalance.reward.ts where we use the fixture
// UpdateBalance20True30False.
export const UpdateDisputedBalance20True30False = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(ResolveDispute20True30False);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(29, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(13),
    100,
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateProposeMaxDispute = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

  await Balance([1, 2], 500);
  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

  //
  // Claim 1
  //

  {
    await Claims.connect(Signer(1)).createPropose(
      Claim(1),
      Amount(5),
      Side(true),
      Expiry(2, "days"),
    );

    await Claims.connect(Signer(2)).updatePropose(
      Claim(1),
      Amount(5),
      Side(false),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  {
    await Claims.connect(Signer(9)).createResolve(
      Claim(1),
      [0, MAX], //          address 1 and 2
      Expiry(5, "days"), // 2 days from the 3 days above
    );

    await Claims.connect(Signer(1)).updateResolve(
      Claim(1),
      Side(true),
    );
    await Claims.connect(Signer(2)).updateResolve(
      Claim(1),
      Side(true),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]);
  await network.provider.send("evm_mine");

  //
  // Dispute 1
  //

  {
    await Claims.connect(Signer(1)).createDispute(
      Claim(101),
      Amount(10),
      Side(true),
      Expiry(10, "days"), // 4 days from the 6 days above
      Claim(1),
    );

    await Claims.connect(Signer(2)).updatePropose(
      Claim(101),
      Amount(20),
      Side(false),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(11, "days")]);
  await network.provider.send("evm_mine");

  {
    await Claims.connect(Signer(9)).createResolve(
      Claim(101),
      [0, MAX], //           address 1 and 2
      Expiry(13, "days"), // 2 days from the 11 days above
    );

    await Claims.connect(Signer(1)).updateResolve(
      Claim(101),
      Side(true),
    );
    await Claims.connect(Signer(2)).updateResolve(
      Claim(101),
      Side(true),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]);
  await network.provider.send("evm_mine");

  //
  // Dispute 2
  //

  {
    await Claims.connect(Signer(1)).createDispute(
      Claim(102),
      Amount(20),
      Side(true),
      Expiry(18, "days"), // 4 days from the 14 days above
      Claim(1),
    );

    await Claims.connect(Signer(2)).updatePropose(
      Claim(102),
      Amount(30),
      Side(false),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(18, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateResolveMaxDispute = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateProposeMaxDispute);

  {
    await Claims.connect(Signer(9)).createResolve(
      Claim(102),
      [0, MAX], //           address 1 and 2
      Expiry(20, "days"), // 2 days from the 18 days above
    );

    await Claims.connect(Signer(1)).updateResolve(
      Claim(102),
      Side(false),
    );
    await Claims.connect(Signer(2)).updateResolve(
      Claim(102),
      Side(false),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(21, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalanceMaxDispute = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateResolveMaxDispute);

  await Claims.connect(Signer(0)).updateBalance(
    Claim(102),
    100,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(101),
    100,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalanceMaxDisputeEqualVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateProposeMaxDispute);

  {
    await Claims.connect(Signer(9)).createResolve(
      Claim(102),
      [0, MAX], //           address 1 and 2
      Expiry(20, "days"), // 2 days from the 18 days above
    );

    await Claims.connect(Signer(1)).updateResolve(
      Claim(102),
      Side(true),
    );
    await Claims.connect(Signer(2)).updateResolve(
      Claim(102),
      Side(false),
    );
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(21, "days")]);
  await network.provider.send("evm_mine");

  {
    await Claims.connect(Signer(0)).updateBalance(
      Claim(102),
      100,
    );

    await Claims.connect(Signer(0)).updateBalance(
      Claim(101),
      100,
    );

    await Claims.connect(Signer(0)).updateBalance(
      Claim(1),
      100,
    );
  }

  return { Address, Balance, Claims, Signer, UVX };
};

export const UpdateBalanceMaxDisputeNoVotes = async () => {
  const { Address, Balance, Claims, Signer, UVX } = await loadFixture(UpdateProposeMaxDispute);

  {
    await Claims.connect(Signer(9)).createResolve(
      Claim(102),
      [0, MAX], //           address 1 and 2
      Expiry(20, "days"), // 2 days from the 18 days above
    );

    // no votes
  }

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(21, "days")]);
  await network.provider.send("evm_mine");

  {
    await Claims.connect(Signer(0)).updateBalance(
      Claim(102),
      100,
    );

    await Claims.connect(Signer(0)).updateBalance(
      Claim(101),
      100,
    );

    await Claims.connect(Signer(0)).updateBalance(
      Claim(1),
      100,
    );
  }

  return { Address, Balance, Claims, Signer, UVX };
};
