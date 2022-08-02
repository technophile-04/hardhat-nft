import { BigNumberish, ethers } from 'ethers';

export interface networkConfigItem {
    blockConfirmations?: number;
    VRFCoordinatorV2: string;
    gasLane: string;
    callBackGasLimit: string;
    subscriptionId?: string;
    ethUSDPriceFeed?: string;
}

export interface networkConfigInfo {
    [key: number]: networkConfigItem;
}

const networkConfig: networkConfigInfo = {
    4: {
        blockConfirmations: 6,
        VRFCoordinatorV2: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
        gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
        callBackGasLimit: '500000',
        subscriptionId: '8436',
        ethUSDPriceFeed: '	0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    31337: {
        blockConfirmations: 1,
        VRFCoordinatorV2: '0x0000',
        gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
        callBackGasLimit: '500000',
    },
};

const developmentChains = ['hardhat', 'localhost'];

export { networkConfig, developmentChains };
