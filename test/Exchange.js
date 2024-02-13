const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(),'ether');
}

describe('Exchange', ()=>{
    let deployer,exchange,feeAccount,user1,token1,token2;
    const percent = 20;
    beforeEach(async ()=>{
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        feeAccount = accounts[1];
        user1 = accounts[2];
        const Token = await ethers.getContractFactory('Token');
        token1 = await Token.deploy('My Token','Tok',tokens(1000000));
        token2 = await Token.deploy('Mock Dia','mDIA',tokens(1000000));
        let transaction = await token1.connect(deployer).transfer(user1.address,tokens(100));
        await transaction.wait();
        const Exchange = await ethers.getContractFactory('Exchange');
        exchange = await Exchange.deploy(feeAccount.address,percent);
    })

    describe("Deployment", ()=>{
        it('tracks the fee account', async ()=>{
            expect(await exchange.feeAccount()).to.equal(feeAccount.address);
        })
        it('tracks the fee percent', async ()=>{
            expect(await exchange.percent()).to.equal(percent);
        })
    })

    describe('Depositing tokens', ()=>{
        let amount,transaction,result;
        
        describe('Success', ()=>{
            beforeEach(async ()=>{
                amount = tokens(10);
                transaction = await token1.connect(user1).approve(exchange.address,amount);
                result = await transaction.wait();
                transaction = await exchange.connect(user1).depositToken(token1.address,amount);
                result = await transaction.wait();
            })
            it('tracks the deposite token', async ()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount);
                expect(await exchange.tokens(token1.address,user1.address)).to.equal(amount);
                expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(amount);
            })
            it('emits the deposit event', async ()=>{
                const event = result.events[1];
                expect(event.event).to.equal('Deposit');
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(user1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(amount);

            })
        })
        describe('Failure', ()=>{
            it('insufficient balance', async ()=>{
                await expect(exchange.connect(user1).depositToken(token1.address,amount)).to.be.reverted;
            })
        })
    })

    describe('Withdrawing tokens', ()=>{
        let amount,transaction,result;
        
        describe('Success', ()=>{
            beforeEach(async ()=>{
                amount = tokens(10);
                transaction = await token1.connect(user1).approve(exchange.address,amount);
                result = await transaction.wait();
                transaction = await exchange.connect(user1).depositToken(token1.address,amount);
                result = await transaction.wait();

                transaction = await exchange.connect(user1).withdrawToken(token1.address,amount);
                result = await transaction.wait();
            })
            it('tracks the withdraw token', async ()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0);
                expect(await exchange.tokens(token1.address,user1.address)).to.equal(0);
                expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(0);
            })
            it('emits the withdraw event', async ()=>{
                const event = result.events[1];
                expect(event.event).to.equal('Withdraw');
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(user1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(0);
            })
        })
        describe('Failure', ()=>{
            it('insufficient balance', async ()=>{
                await expect(exchange.connect(user1).depositToken(token1.address,amount)).to.be.reverted;
            })
        })
    })

    describe('Making Order', ()=>{
        let amount,transaction,result;
        
        describe('Success', ()=>{
            beforeEach(async ()=>{
                amount = tokens(1);
                transaction = await token1.connect(user1).approve(exchange.address,amount);
                result = await transaction.wait();
                transaction = await exchange.connect(user1).depositToken(token1.address,amount);
                result = await transaction.wait();

                transaction = await exchange.connect(user1).makeOrder(token1.address,amount,token2.address,amount);
                result = await transaction.wait();
            })
            it('tracks the order', async ()=>{
                expect(await exchange.orderCount()).to.equal(1);
            })
            it('emits the order event', async ()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Order');
                const args = event.args;
                expect(args.id).to.equal(1);
                expect(args.user).to.equal(user1.address);
                expect(args.giveToken).to.equal(token1.address);
                expect(args.giveValue).to.equal(amount);
                expect(args.getToken).to.equal(token2.address);
                expect(args.getValue).to.equal(amount);
                expect(args.timestamp).to.at.least(1);
            })
        })
        describe('Failure', ()=>{
            it('insufficient balance', async ()=>{
                await expect(exchange.connect(user1).makeOrder(token1.address,amount,token2.address,amount)).to.be.reverted;
            })
        })
    })

    describe('Canceling Order', ()=>{
        let amount,transaction,result;
        beforeEach(async ()=>{
            amount = tokens(1);
            transaction = await token1.connect(user1).approve(exchange.address,amount);
            result = await transaction.wait();
            transaction = await exchange.connect(user1).depositToken(token1.address,amount);
            result = await transaction.wait();

            transaction = await exchange.connect(user1).makeOrder(token1.address,amount,token2.address,amount);
            result = await transaction.wait();
        })
        describe('Success', ()=>{
            beforeEach(async ()=>{
                transaction = await exchange.connect(user1).cancelOrder(1);
                result = await transaction.wait();
            })
            it('tracks the order cancellation', async ()=>{
                expect(await exchange.cancelOrders(1)).to.equal(true);
            })
            it('emits the cancel order event', async ()=>{
                const event = result.events[0];
                expect(event.event).to.equal('CancelOrder');
                const args = event.args;
                expect(args.id).to.equal(1);
                expect(args.user).to.equal(user1.address);
                expect(args.giveToken).to.equal(token1.address);
                expect(args.giveValue).to.equal(amount);
                expect(args.getToken).to.equal(token2.address);
                expect(args.getValue).to.equal(amount);
                expect(args.timestamp).to.at.least(1);
            })
        })
        describe('Failure', ()=>{
            it('invalid id', async ()=>{
                await expect(exchange.connect(user1).cancelOrder(189)).to.be.reverted;
            })
        })
    })
})