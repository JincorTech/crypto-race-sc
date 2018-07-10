const Race = artifacts.require('Race');

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
    this.race = await Race.new();
  });

  it('should create contract', async function () {
    assert.equal(true, true);
  });

  it('should create track', async function () {
    const hashId = 'beebfa4496483c4fb71c462ade7dbeb3602f02a6a6ea9afc69b296ff56aa23dc';
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});

    assert.equal(await this.race.getTrackOwner(hashId), accounts[0]);
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
    await this.race.joinToTrack(hashId, {from: accounts[1]});

    assert.equal(await this.race.getCountPlayerByTrackId(hashId), 2);
  });

  it('should set ready to start', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1]});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    assert(this.race.isReadyToStart(hashId), true);
  });

  it('should get running track', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1]});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    assert.notEqual((await this.race.runningTracks(hashId)).toNumber(), 0);
  });

  it('should is ended track', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});
    await this.race.joinToTrack(hashId, {from: accounts[1]});

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
    await this.race.joinToTrack(hashId, {from: accounts[1]});

    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(10), web3.toBigNumber(90)];
    await this.race.setPortfolio(hashId, names, amounts);
    await this.race.setPortfolio(hashId, names, amounts, {from: accounts[1]});

    assert.deepEqual(await this.race.getPlayers(hashId), [ '0x6e517e4acf913ac5994c16c1792ba1666655d050','0x2dca65407eed461704f4f6156c25e3741876da2b' ]);
  });

  it('should get depo', async function () {
    const hashId = web3.toHex(web3.sha3('6e58599f-80b0-448f-a1a4-6a6fe629a52b'));
    await this.race.createTrack(hashId, {from: accounts[0], value: 1 * 10 ** 18});

    assert.equal(await this.race.getDepo(hashId, accounts[0]), 1 * 10 ** 18);
  })
});
