require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.7.5",
  paths: {
    artifacts: "./app/artifacts",
  },
  networks: {
    rinkeby: {
      url: process.env.ALCHEMY_URL
    }
  }
};
