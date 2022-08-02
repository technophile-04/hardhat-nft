import { ethers, network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat.config';
import fs from 'fs';
import { verify } from '../utils/verify';

const HAPPY_SVG: string = fs.readFileSync('./images/dynamicNft/happy.svg', {
    encoding: 'utf-8',
});
const FROWN_SVG: string = fs.readFileSync('./images/dynamicNft/frown.svg', {
    encoding: 'utf-8',
});

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const deployer = (await getNamedAccounts()).deployer;
    const { deploy, log } = deployments;
    const chainId = network.config.chainId!;

    let ethUsdPriceFeedAddress: string;

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract('MockV3Aggregator');
        ethUsdPriceFeedAddress = EthUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUSDPriceFeed!;
    }

    // address priceFeedAddress,
    // string memory happySvgURI,
    // string memory frownSvgURI

    log('---------------------------------------------');
    const args = [ethUsdPriceFeedAddress, HAPPY_SVG, FROWN_SVG];
    const dynamicNft = await deploy('DynamicSvgNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    });
    log('---------------------------------------------');

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...');
        await verify(dynamicNft.address, args);
    }
};

export default deployFunc;

deployFunc.tags = ['all', 'dynamicNFT'];
