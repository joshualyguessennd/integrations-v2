import hre, { ethers } from "hardhat";

import {
  ACL,
  AddressProvider,
  BlacklistHelper,
  ContractsRegister,
  CreditConfigLive,
  CreditConfigurator,
  CreditManager,
  DegenNFT,
  ERC20,
  IPool4626,
  LinearInterestRateModel,
  PoolService,
} from "../types";
import {
  CollateralTokenStruct,
  CreditManagerOptsStruct,
} from "../types/contracts/test/config/CreditConfig";
import { Constants } from "./Constants";

const ADDRESS_PROVIDER = "0xcF64698AFF7E5f27A11dff868AF228653ba53be0";
const ADDRESS_PROVIDER_GOERLI = "0x95f4cea53121b8A2Cb783C6BFB0915cEc44827D3";
import helpers from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  let ap: AddressProvider;
  let acl: ACL;
  let contractRegister: ContractsRegister;
  let pools: string[];
  let pool: PoolService;
  let linearInterestRate: LinearInterestRateModel;
  let cmOpt: CreditManagerOptsStruct;
  let collateralTokens: CollateralTokenStruct[];
  let blacklistHelper: BlacklistHelper;
  let degenNFT: DegenNFT;
  let creditConfigLive: CreditConfigLive;
  let cm: CreditManager;
  let pool4226: IPool4626;

  try {
    ap = await ethers.getContractAt("AddressProvider", ADDRESS_PROVIDER);
    acl = await ethers.getContractAt("ACL", await ap.getACL());
    const aclConfigurator = await acl.owner();
    console.log("owner", aclConfigurator);
    contractRegister = await ethers.getContractAt(
      "ContractsRegister",
      await ap.getContractsRegister(),
    );
    const linearInterestRateFactory = await ethers.getContractFactory(
      "LinearInterestRateModel",
    );

    // impersonate acl owner
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [aclConfigurator],
    });

    // assign signer role to aclConfigurator
    const signer = await ethers.getSigner(aclConfigurator);

    // give enough balance to aclConfigurator
    const balance = ethers.utils.parseEther("1000000");
    await ethers.provider.send("hardhat_setBalance", [
      aclConfigurator,
      balance.toString(),
    ]);

    // deploy new linear Rate
    linearInterestRate = await linearInterestRateFactory.deploy(
      Constants.U_OPTIMAL,
      Constants.U_RESERVE,
      Constants.R_BASE,
      Constants.R_SLOPE_1,
      Constants.R_SLOPE_2,
      Constants.R_SLOPE_3,
      false,
    );
    // deploy new pool
    const poolFactory = await ethers.getContractFactory("PoolService");
    pool = await poolFactory
      .connect(signer)
      .deploy(
        ADDRESS_PROVIDER,
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        linearInterestRate.address,
        Constants.EXPECTED_LIQUIDITY_LIMIT,
      );

    await pool.deployed();
    console.log("new pool", pool.address);
    // add new pool contract register
    // await contractRegister.connect(signer).addPool(pool.address);

    // transfer ownership to EOA
    await acl
      .connect(signer)
      .transferOwnership("0x20da9f3d7d5cb96c2822338830cfd6dee6d508d8");

    const new_signer = await ethers.getSigner(
      "0x20da9f3d7d5cb96c2822338830cfd6dee6d508d8",
    );

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x20da9f3d7d5cb96c2822338830cfd6dee6d508d8"],
    });

    const balance_ = ethers.utils.parseEther("1000000");
    await ethers.provider.send("hardhat_setBalance", [
      "0x20da9f3d7d5cb96c2822338830cfd6dee6d508d8",
      balance_.toString(),
    ]);

    // deploy new credit manager
    const cmFactory = await ethers.getContractFactory("CreditManagerFactory");

    // add collateral tokens
    collateralTokens = [];
    for (let token of Constants.tokens) {
      collateralTokens.push(token);
    }

    console.log(collateralTokens);

    const degenFactory = await ethers.getContractFactory("DegenNFT");

    degenNFT = await degenFactory
      .connect(new_signer)
      .deploy(ap.address, "DegenNFT", "Gear-Degen");

    console.log("new degen nft deployed at address", degenNFT.address);

    // const deployed_pool = await ethers.getContractAt(
    //   "PoolService",
    //   "0x24946bCbBd028D5ABb62ad9B635EB1b1a67AF668",
    // );

    pools = await contractRegister.getPools();

    console.log("address provider", await pool.addressProvider());

    // const whale = "0x60FaAe176336dAb62e284Fe19B885B095d29fB7F";
    // await hre.network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: [whale],
    // });
    // const whale_signer = await ethers.getSigner(whale);

    // const DAI_CONTRACT = await ethers.getContractAt(
    //   "ERC20",
    //   "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    // );

    // const transfer = await DAI_CONTRACT.connect(whale_signer).approve(
    //   pool.address,
    //   100_000_000_000,
    // );

    // await console.log("approve hash", transfer.hash);
    // const tx = await pool
    //   .connect(whale_signer)
    //   .addLiquidity(10_000_000, whale, 0);

    // console.log("add liquidity hash", tx.to);

    cmOpt = {
      minBorrowedAmount: BigInt(1000e18),
      maxBorrowedAmount: BigInt(125000e18),
      collateralTokens: collateralTokens,
      degenNFT: degenNFT.address,
      blacklistHelper: "0x0000000000000000000000000000000000000000",
      expirable: true,
    };

    const cmf = await cmFactory
      .connect(new_signer)
      .deploy(pool.address, cmOpt, 0, { gasLimit: 3000000 });

    await cmf.deployed();
  } catch (error) {
    console.log(error);
  }
}

main();
