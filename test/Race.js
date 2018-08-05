const RaceBase = artifacts.require('RaceBase');
const Rate = artifacts.require('Rate');

const assertJump = function(error) {
  assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'Invalid opcode error must be returned');
};

async function increaseTimestampBy(seconds) {
  const jsonrpc = '2.0';
  const id = 0;
  const send = (method, params = []) => web3.currentProvider.send({id, jsonrpc, method, params});
  await send('evm_increaseTime', [seconds]);
  await send('evm_mine');
}

contract('Race', function(accounts) {
  beforeEach(async function () {
    this.rate = await Rate.new();
    this.race = await RaceBase.new(this.rate.address);
  });

  it('should create contract', async function () {
    assert.equal(true, true);
  });

  it('should create track', async function () {
    const hashId = 'beebfa4496483c4fb71c462ade7dbeb3602f02a6a6ea9afc69b296ff56aa23dc';
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});

    assert.equal(await this.race.getTrackOwner(hashId), accounts[0]);
  });

  it('should create track from backend', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrackFromBack(hashId, web3.toBigNumber(1 * 10 ** 18), web3.toBigNumber(4), web3.toBigNumber(300));
    assert.equal((await this.race.getBetAmount(hashId)).toNumber(), 1 * 10 ** 18);
  });

  it('should not create track - already exists', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId);

    try {
      await this.race.createTrack(hashId);
    } catch (error) {
      return assertJump(error);
    }

    assert.fail('should have thrown before');
  });

  it('should set portfolio', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const namesToCompare = [web3.padRight(web3.fromAscii('btc'), 66), web3.padRight(web3.fromAscii('eth'), 66)];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);

    assert.deepEqual(await this.race.getPortfolio(hashId, accounts[0]), [namesToCompare, amounts]);
  });

  it('should join to track by id', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    assert.equal(await this.race.getCountPlayerByTrackId(hashId), 2);
  });

  it('should not join to track by id', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    
    try {
      await this.race.joinToTrack(hashId, {from: accounts[1], value: 2 * 10 ** 18});
    } catch (error) {
      return assertJump(error);
    }

    assert.fail('should have thrown before');
  });

  it('should set ready to start', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    assert(this.race.isReadyToStart(hashId), true);
  });

  it('should get running track', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    await this.race.startTrack(hashId, web3.toBigNumber(15000000));

    assert.notEqual((await this.race.runningTracks(hashId)).toNumber(), 0);
    assert.equal((await this.race.runningTracks(hashId)).toNumber(), 15000000);
  });

  it('should is ended track', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    await increaseTimestampBy(5000);

    assert.isTrue(await this.race.isEndedTrack(hashId));
  });

  it('should get players', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    assert.deepEqual(await this.race.getPlayers(hashId), [accounts[0], accounts[1]]);
  });

  it('should get bet amount', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});

    assert.equal(await this.race.getBetAmount(hashId), 1 * 10 ** 18);
  });

  it('should get winners', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 1 * 10 ** 18});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts1 = [web3.toBigNumber(20), web3.toBigNumber(80)];
    const amounts2 = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts2);
    await this.race.setPortfolio(hashId, names, amounts1, {from: accounts[1]});

    const startTime = await this.race.runningTracks(hashId);
    await this.rate.setRates(startTime, names, [web3.toBigNumber(600000), web3.toBigNumber(40000)]);
    await this.rate.setRates(startTime.plus(300), names, [web3.toBigNumber(650000), web3.toBigNumber(45000)]);

    assert.deepEqual(await this.race.getWinners(hashId), [accounts[0]]);
  });

  it('should withdraw rewards', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 3 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1], value: 3 * 10 ** 18}); // winner

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts1 = [web3.toBigNumber(20), web3.toBigNumber(80)];
    const amounts2 = [web3.toBigNumber(10), web3.toBigNumber(90)]; 
    await this.race.setPortfolio(hashId, names, amounts2);
    await this.race.setPortfolio(hashId, names, amounts1, {from: accounts[1]});

    const startTime = await this.race.runningTracks(hashId);
    await this.rate.setRates(startTime, names, [web3.toBigNumber(600000), web3.toBigNumber(40000)]);
    await this.rate.setRates(startTime.plus(300), names, [web3.toBigNumber(650000), web3.toBigNumber(45000)]);
    const beforeBalance = await web3.eth.getBalance(accounts[0]);
    await this.race.withdrawRewards(hashId, {from: accounts[2]});
    const afterBalance = await web3.eth.getBalance(accounts[0]);

    assert.equal(afterBalance.minus(beforeBalance).toNumber(), 6 * 10 ** 18);
  });
});
