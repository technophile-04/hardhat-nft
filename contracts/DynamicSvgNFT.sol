// SPDX-License-Identifier:MIT
pragma solidity 0.8.8;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import 'base64-sol/base64.sol';

error DynamicSvgNFT__TokenURINotExist();

contract DynamicSvgNFT is ERC721 {
    uint256 private s_tokenCounter;

    string private i_happySvgURI;
    string private i_frownSvgURI;
    string private constant base64EncodedSvgPrefix = 'data:image/svg+xml;base64,';
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(
        address priceFeedAddress,
        string memory happySvgURI,
        string memory frownSvgURI
    ) ERC721('Dynamic Svg NFT', 'DSN') {
        s_tokenCounter = 0;
        i_happySvgURI = svgToImageURI(happySvgURI);
        i_frownSvgURI = svgToImageURI(frownSvgURI);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function mintNFT(int256 highValue) public {
        s_tokenCounter += 1;
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return 'data:application/json;base64,';
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) {
            revert DynamicSvgNFT__TokenURINotExist();
        }

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_frownSvgURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_happySvgURI;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(), // You can add whatever name here
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getHappySvgURI() public view returns (string memory) {
        return i_happySvgURI;
    }

    function getFrownSvgURI() public view returns (string memory) {
        return i_frownSvgURI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getPriceFeed() public view returns (address) {
        return address(i_priceFeed);
    }
}
