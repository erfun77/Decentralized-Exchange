const assert = require('assert');
const { Contract } = require('ethers');
const { default: Web3 } = require('web3');

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require('chai').use(require('chai-as-promised')).should()


function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}
contract("EthSwap", ([deployer, investor]) => {
    
    let token, ethSwap;
    before(async () => {
        token = await Token.new();
        ethSwap = await EthSwap.new(token.address);
        await token.transfer(ethSwap.address, tokens('1000000'));

    })
    describe('Token deployement', async () => {
        it("Token has a name", async () => {
            const name =  await token.name();
            assert.equal(name, 'Stitch Token')
        })
    })

    describe('EthSwap deployement', async () => {
        it("contract has a name", async () => {
            const name =  await ethSwap.name();
            assert.equal(name, 'Cryptocurrency Exchange')
        })
    })

    it('contract has tokens', async () => {
        let balance = await token.balanceOf(ethSwap.address);
        assert.equal(balance.toString(), tokens('1000000'));
    })

    describe('buyTokens()', async () => {
        let result;

        before(async () => {
            result = await ethSwap.buyTokens({from: investor, value: web3.utils.toWei('1', 'ether')})
        })

        it("Allows user to instantly purchase tokens from ethSwap for a fixed price", async () => {
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('100'))

            let ethSwapBalance
            ethSwapBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalance.toString(), tokens("999900"))
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalance.toString(), web3.utils.toWei('1', 'ether'))

            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount.toString(), tokens('100').toString())
            assert.equal(event.rate.toString(), '100')
        })
    })

    describe('sellTokens()', async () => {
        let result;

        before(async () => {
            
            await token.approve(ethSwap.address, tokens('100'), {from: investor})
            result = await ethSwap.sellTokens(tokens('100'), {from: investor})
        })

        it("Allows user to instantly sell tokens to ethSwap for a fixed price", async () => {
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('0'))

            let ethSwapBalance
            ethSwapBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalance.toString(), tokens("1000000"))
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalance.toString(), web3.utils.toWei('0', 'ether'))

            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount.toString(), tokens('100').toString())
            assert.equal(event.rate.toString(), '100')

        })
    })
})