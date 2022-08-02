import { assert } from 'chai';
import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../helper-hardhat.config';
import { BasicNFT } from '../../typechain-types';

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('BasicNFT', () => {
          let basicNFT: BasicNFT;
          let deployer: string;

          beforeEach(async () => {
              await deployments.fixture(['all']);

              deployer = (await getNamedAccounts()).deployer;

              basicNFT = await ethers.getContract('BasicNFT', deployer);
          });

          describe('constructor', () => {
              it('Should initialize s_counter with zero', async () => {
                  const counter = await basicNFT.getTokenCounter();
                  assert.strictEqual(counter.toString(), '0');
              });
          });

          describe('mintNft', () => {
              beforeEach(async () => {
                  const txnRes = await basicNFT.mintNft();
                  await txnRes.wait(1);
              });
              it('Mint 0th nft with owner as deployer', async () => {
                  const ownerOfFirstNFT = await basicNFT.ownerOf('0');
                  assert.strictEqual(deployer, ownerOfFirstNFT);
              });
              it('Increase the balance of deployer for 0th nft', async () => {
                  const balance = await basicNFT.balanceOf(deployer);
                  assert.strictEqual(balance.toString(), '1');
              });

              it('Increase the tokenCounter to 1', async () => {
                  const counter = await basicNFT.getTokenCounter();
                  assert.strictEqual(counter.toString(), '1');
              });
          });
      });
