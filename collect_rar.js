
require("dotenv").config();
const axios = require("axios");
const ethers = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ftm.tools/`);
const prompt = require('prompt-sync')();
const ABI_RARITY = require('./abi/rarity_rar.json');
const GAS_PERCENT = 0.8;
const rarityManifested = new ethers.Contract(
    "0x00000000000147629f002966C4f2ADc1cB4f0Aca",
    ABI_RARITY,
    provider
);


let wallet;
let nonce;
let rarityManifestedConnected;

const toSummonerId = prompt('Please enter the summoner ID that you want RAR transferred to: ');
start(toSummonerId);


async function start(toSummonerId) {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    nonce = await provider.getTransactionCount(wallet.address);
    rarityManifestedConnected = rarityManifested.connect(wallet);

    let summoners = await getAllMySummoners(wallet.address);
    console.log(`Total of ${summoners.length} summoners loaded`);
    for (let summoner of summoners) {
        if (summoner !== toSummonerId) {
            let balance = await getBalance(summoner);
            if (balance > 0) {
                await transfer(summoner,toSummonerId,balance);
            }
        }

    }

}

function getAllMySummoners(address) {
    return new Promise((resolve, reject) => {
        let summoners = [];
        axios.get(`https://api.ftmscan.com/api?module=account&action=tokennfttx&contractaddress=0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb&address=${address}`).then(resp => {
            let result = resp.data.result;
            for (let nft of result) {
                if (nft.to === address.toLowerCase()) {
                    summoners.push(nft.tokenID)
                }
                if (nft.from == address.toLowerCase()) {
                    removeItem(summoners, nft.tokenID);
                }
            }
            resolve(summoners)

        }).catch(err => {
            console.error(err)
            reject(err)
        });
    });
}


function getBalance(summonerId) {
    return new Promise((resolve, reject) => {
        rarityManifestedConnected.balanceOf(summonerId).then(balance => {
            resolve(balance);
        }).catch(err => {
            console.log(err.reason);
            reject(err);
        })

    });
}

function transfer(from, to, amount) {
    return new Promise(async (resolve, reject) => {
        let gasPrice = (await provider.getGasPrice()) * GAS_PERCENT;
        rarityManifestedConnected.transfer(from, to, amount, {
            gasLimit: 240000,
            gasPrice: gasPrice,
            nonce
        }).then(async (result) => {
            await result.wait();
            console.log(`Summoner[${from}] transferred ${amount / 1000000000000000000} RAR to summoner[${to}]!`);
            nonce++;
            resolve(true)
        }).catch(err => {
            console.log(err)
            reject(err);
        });
    });
}

function removeItem(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}