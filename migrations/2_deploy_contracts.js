var Race = artifacts.require('./Race.sol');

module.exports = async function(deployer) {
  await deployer.deploy(Race);
};
