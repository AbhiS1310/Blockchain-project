const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(),'ether');
}

describe('Token', ()=>{
    let token,deployer,reciever,exchange;
    beforeEach(async ()=>{
        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy('My Token','Tok',tokens(1000000));
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        reciever = accounts[1];
        exchange = accounts[2];
    })

    describe("Deployment", ()=>{
        it('has a correct name', async ()=>{
            expect(await token.name()).to.equal('My Token');
        })
        it('has a correct symbol', async ()=>{
            expect(await token.symbol()).to.equal('Tok');
        })
        it('has a correct decimals', async ()=>{
            expect(await token.decimals()).to.equal('18');
        })
        it('has a correct total supply', async ()=>{
            expect(await token.totalSupply()).to.equal(tokens('1000000'));
        })
        it('assign total supply to deployer', async ()=>{
            expect(await token.balanceOf(deployer.address)).to.equal(tokens('1000000'));
        })
    })

    describe("Sending Token", ()=>{
        describe('Success', ()=>{
            let result,amount;
            beforeEach(async ()=>{
                amount = tokens(100);
                let transaction = await token.connect(deployer).transfer(reciever.address,amount);
                result = await transaction.wait();
            })

            it('transfer Token', async ()=>{
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
                expect(await token.balanceOf(reciever.address)).to.equal(amount);
            })
            it('emits a Transfer event', async ()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Transfer');
                const args = event.args;
                expect(args._from).to.equal(deployer.address);
                expect(args._to).to.equal(reciever.address);
                expect(args._value).to.equal(amount);
            })
        })
        describe('Failure', ()=>{
            it('insufficient amount', async ()=>{
                await expect(token.connect(deployer).transfer(reciever.address,tokens(100000000))).to.be.reverted;
            })
            it('invalid address', async ()=>{
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000',tokens(100))).to.be.reverted;
            })
        })
    })

    describe('Approving tokens', ()=>{
        let result,amount;
        beforeEach(async ()=>{
            amount = tokens(100);
            let transaction = await token.connect(deployer).approve(exchange.address ,amount);
            result = await transaction.wait();
        })
        describe('Success', ()=>{
            it('allocates an allowance for delegated token spend', async ()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount);
            })
            it('emits a Transfer event', async ()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Approval');
                const args = event.args;
                expect(args._from).to.equal(deployer.address);
                expect(args._spender).to.equal(exchange.address);
                expect(args._value).to.equal(amount);
            })
        })
        describe('Failure', ()=>{
            it('invalid spender', async ()=>{
                await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000',amount)).to.be.reverted;
            })
        })
    })

    describe('Delegated token trnsfer', ()=>{
        let result,amount;
        beforeEach(async ()=>{
            amount = tokens(100);
            let transaction = await token.connect(deployer).approve(exchange.address ,amount);
            result = await transaction.wait();
        })
        describe('Success', ()=>{
            beforeEach(async ()=>{
                let transaction = await token.connect(exchange).transferFrom(deployer.address,reciever.address,amount);
                result = await transaction.wait();
            })
            it('transfer token', async ()=>{
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900));
                expect(await token.balanceOf(reciever.address)).to.equal(amount);
            })
            it('resets the allowance token',async ()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(tokens(0));
            })
            it('emits a Transfer event', async ()=>{
                const event = result.events[0];
                expect(event.event).to.equal('Transfer');
                const args = event.args;
                expect(args._from).to.equal(deployer.address);
                expect(args._to).to.equal(reciever.address);
                expect(args._value).to.equal(amount);
            })
        })
        describe('Failure', ()=>{
            it('insufficient amount', async ()=>{
                await expect(token.connect(exchange).transferFrom(deployer.address,reciever.address,tokens(100000000))).to.be.reverted;
            })
            it('invalid address', async ()=>{
                await expect(token.connect(exchange).transferFrom(deployer.address,'0x0000000000000000000000000000000000000000',amount)).to.be.reverted;
            })
        })
    })
})