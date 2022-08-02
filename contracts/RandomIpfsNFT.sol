// SPDX-License-Identifier:MIT
pragma solidity 0.8.7;

import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

error RandomIpfsNFT__RangeOutOfBound();
error RandomIpfsNFT__NeedMoreEthSent();
error RandomIpfsNFT__WithdrawFundsFailed();

contract RandomIpfsNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    /* Type Declaration */
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    /* Immutables / Variables for chainlink vrfCoordinator */
    VRFCoordinatorV2Interface private immutable i_vrfV2Coordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;

    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint16 private constant NUM_WORDS = 1;

    /* VRF Helper  */
    mapping(uint256 => address) public s_requestIdToSender;

    /* NFT Variables */
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenURIs;
    uint256 internal immutable i_mintFee;

    /* events */
    event NFTRequested(uint256 indexed requestId, address requester);
    event NFTMinted(Breed dogBreed, address minter);

    constructor(
        address vrfV2Coordinator,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenURIs,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfV2Coordinator) ERC721('Random IPFS NFT', 'RIN') {
        i_vrfV2Coordinator = VRFCoordinatorV2Interface(vrfV2Coordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenURIs = dogTokenURIs;
        i_mintFee = mintFee;
    }

    function requestNFT() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNFT__NeedMoreEthSent();
        }

        requestId = i_vrfV2Coordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NFTRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter = s_tokenCounter + 1;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;

        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogBreed)]);
        emit NFTMinted(dogBreed, dogOwner);
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();

        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }

            cumulativeSum += chanceArray[i];
        }

        revert RandomIpfsNFT__RangeOutOfBound();
    }

    function withDrawFees() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}('');
        if (!success) {
            revert RandomIpfsNFT__WithdrawFundsFailed();
        }
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenURIs(uint256 index) public view returns (string memory) {
        return s_dogTokenURIs[index];
    }
}
