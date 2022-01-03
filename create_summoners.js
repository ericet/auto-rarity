
require("dotenv").config();
const ethers = require("ethers");
const prompt = require('prompt-sync')();
const summonerTypes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ftm.tools/`);
const ABI_RARITY = require('./abi/rarity.json');
const rarityManifested = new ethers.Contract(
    "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb",
    ABI_RARITY,
    provider
);
let wallet,nonce,rarityManifestedConnected;

const numOfSummoners = prompt('How many summoners do you want to create? ');
start(numOfSummoners);
async function start(numOfSummoners) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    nonce = await provider.getTransactionCount(wallet.address);
    rarityManifestedConnected = rarityManifested.connect(wallet);
    for (let i = 0; i < numOfSummoners; i++) {
        let classId = (Math.floor(Math.random() * 11)) + 1
        await createSummoner(classId);
    }
}

async function createSummoner(classId) {
    return new Promise(async (resolve) => {
        let gasPrice = (await provider.getGasPrice());
        rarityManifestedConnected.summon(classId, {
            gasLimit: 240000,
            gasPrice: gasPrice,
            nonce
        }).then(async (result) => {
            let logs = await result.wait();
            console.log(`${summonerTypes[classId]} created!`);
            nonce++;
            resolve(true);
        }).catch(async (err) => {
            console.error(err);
        });
    })
}