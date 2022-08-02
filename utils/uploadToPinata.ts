import pinataSDK from '@pinata/sdk';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const { PINATA_API_KEY, PINATA_API_SECRET_KEY } = process.env;

const pinata = pinataSDK(PINATA_API_KEY!, PINATA_API_SECRET_KEY!);

async function storeImages(imageFilePath: string) {
    const fullImagesPath = path.resolve(imageFilePath);
    console.log('[storeImages:7]', fullImagesPath);
    const files = fs.readdirSync(fullImagesPath);
    console.log('[storeImages:10]', files);
    const responses = [];
    console.log('Uploading to ipfs...');
    for (let fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
        try {
            const res = await pinata.pinFileToIPFS(readableStreamForFile);
            responses.push(res);
        } catch (error) {
            console.log(error);
        }
    }

    return { responses, files };
}

async function storeTokeUriMetadata(metadata: Object) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}

export { storeImages, storeTokeUriMetadata };
