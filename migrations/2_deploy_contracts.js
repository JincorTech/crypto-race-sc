var Race = artifacts.require('./Race.sol');
var Rate = artifacts.require('./Rate.sol');

module.exports = async function(deployer) {
  await deployer.deploy(Race);
  await deployer.deploy(Rate);
};
