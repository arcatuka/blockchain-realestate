
const hre = require("hardhat");

async function main() {

  // We get the contract to deploy
  const RealEstateCoinFactory = await hre.ethers.getContractFactory("RealEstateCoin");
  const realestateCoin = await RealEstateCoinFactory.deploy();

  await realestateCoin.deployed();

  console.log("Real Estate Coin deployed to:", realestateCoin.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
