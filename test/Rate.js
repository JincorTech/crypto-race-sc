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

contract('Rate', function(accounts) {
  beforeEach(async function () {
    this.rate = await Rate.new();
  });

  it('should create contract', async function () {
    assert.equal(true, true);
  });

  it('should set rate', async function () {
    const time = web3.toBigNumber(1531222330);
    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(2000000), web3.toBigNumber(120000)];
    await this.rate.setRates(time, names, amounts);
  });

  it('should get rate', async function () {
    const time = web3.toBigNumber(1531222330);
    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(2000000), web3.toBigNumber(120000)];
    await this.rate.setRates(time, names, amounts);
    assert.equal((await this.rate.getRate(time, names[0])).toNumber(), amounts[0].toNumber());
  });

  it('should get rates', async function () {
    const time = web3.toBigNumber(1531222330);
    const names = [web3.fromAscii('btc'), web3.fromAscii('eth')];
    const amounts = [web3.toBigNumber(2000000), web3.toBigNumber(120000)];
    await this.rate.setRates(time, names, amounts);
    assert.deepEqual((await this.rate.getRates(time, names)), amounts);
  });
});
