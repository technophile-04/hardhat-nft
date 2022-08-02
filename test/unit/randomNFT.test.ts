import { assert, expect } from 'chai';
import { network, deployments, ethers } from 'hardhat';
import { developmentChains, networkConfig } from '../../helper-hardhat.config';
import { RandomIpfsNFT, VRFCoordinatorV2Mock } from '../../typechain-types';

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Random IPFS NFT Unit Tests', async function () {
          let randomIpfsNft: RandomIpfsNFT, deployer, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;

          beforeEach(async () => {
              let accounts = await ethers.getSigners();
              deployer = accounts[0];
              await deployments.fixture(['mocks', 'randomNFT']);
              randomIpfsNft = await ethers.getContract('RandomIpfsNFT');
              vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
          });

          describe('constructor', () => {
              it('sets starting values correctly', async function () {
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenURIs(0);
                  assert(dogTokenUriZero.includes('ipfs://'));
              });
          });

          describe('requestNft', () => {
              it("fails if payment isn't sent with the request", async function () {
                  const fee = ethers.utils.parseEther('0.0001');
                  await expect(
                      randomIpfsNft.requestNFT({ value: fee })
                  ).to.be.revertedWithCustomError(randomIpfsNft, 'RandomIpfsNFT__NeedMoreEthSent');
              });
              it('emits an event and kicks off a random word request', async function () {
                  const fee = await randomIpfsNft.getMintFee();
                  await expect(randomIpfsNft.requestNFT({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      'NFTRequested'
                  );
              });
          });
          describe('fulfillRandomWords', () => {
              it('mints NFT after random number is returned', async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once('NFTMinted', async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI('0');
                              const tokenCounter = await randomIpfsNft.getTokenCounter();
                              assert.equal(tokenUri.toString().includes('ipfs://'), true);
                              assert.equal(tokenCounter.toString(), '1');
                              resolve(0);
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });
                      try {
                          const fee = await randomIpfsNft.getMintFee();
                          const requestNftResponse = await randomIpfsNft.requestNFT({
                              value: fee.toString(),
                          });
                          const requestNftReceipt = await requestNftResponse.wait(1);
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt?.events![1]?.args?.requestId,
                              randomIpfsNft.address
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });
      });
