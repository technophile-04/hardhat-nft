import { verify } from '../utils/verify';
import { ethers, network } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains, networkConfig } from '../helper-hardhat.config';
import { VRFCoordinatorV2Mock } from '../typechain-types';
import { storeImages, storeTokeUriMetadata } from '../utils/uploadToPinata';

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther('10');
const MINT_FEE = ethers.utils.parseEther('0.1');

const IMAGES_LOCATION = './images/randomNft';

const metadataTemplate = {
    name: '',
    description: '',
    image: '',
    attributes: [
        {
            trait_type: 'Cuteness',
            value: 100,
        },
    ],
};

const deployFunc: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, log } = deployments;
    const chainId = network.config.chainId!;

    const deployer = (await getNamedAccounts()).deployer;
    let tokenUris: string[] = [
        'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo',
        'ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d',
        'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm',
    ];

    let VRFCoordinatorV2MockAddress: string;
    let subId: string;

    if (process.env.UPLOAD_TO_PINATA === 'true') {
        tokenUris = await handleTokenUris();
    }

    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract(
            'VRFCoordinatorV2Mock',
            deployer
        );

        VRFCoordinatorV2MockAddress = VRFCoordinatorV2Mock.address;
        const txnResponse = await VRFCoordinatorV2Mock.createSubscription();
        const txnReceipt = await txnResponse.wait();
        subId = txnReceipt.events![0]?.args?.subId;

        const txnRes = await VRFCoordinatorV2Mock.fundSubscription(subId, VRF_SUB_FUND_AMOUNT);
        await txnRes.wait(1);
    } else {
        VRFCoordinatorV2MockAddress = networkConfig[chainId].VRFCoordinatorV2;
        subId = networkConfig[chainId].subscriptionId!;
    }

    const GAS_LANE = networkConfig[chainId!]['gasLane'];
    const CALLBACK_GAS_LIMIT = networkConfig[chainId!]['callBackGasLimit'];

    log('--------------------------------------');

    const args = [
        VRFCoordinatorV2MockAddress,
        subId,
        GAS_LANE,
        CALLBACK_GAS_LIMIT,
        tokenUris,
        MINT_FEE,
    ];

    const randomNFT = await deploy('RandomIpfsNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
    });

    log('--------------------------------------');

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...');
        await verify(randomNFT.address, args);
    }
};

async function handleTokenUris() {
    let tokenUris: string[] = [];
    const { responses: imageUploadResponses, files } = await storeImages(IMAGES_LOCATION);
    for (const imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate };
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace('.png', '');
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMetadata);
        tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`);
    }
    console.log('Token URIs uploaded! They are:');
    console.log(tokenUris);

    return tokenUris;
}

export default deployFunc;

deployFunc.tags = ['all', 'randomNFT'];
