var RaceBase = artifacts.require('./RaceBase.sol');
var Rate = artifacts.require('./Rate.sol');

module.exports = async function(deployer) {
  await deployer.deploy(Rate);
  await deployer.deploy(RaceBase, Rate.address);
};
