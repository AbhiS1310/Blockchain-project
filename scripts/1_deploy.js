
async function main() {
  const Token =  await ethers.getContractFactory("Token");
  const token = await Token.deploy('My Token','Tok','1000000');
  await token.deployed();
  console.log(token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
