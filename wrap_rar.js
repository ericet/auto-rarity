
require("dotenv").config();
const axios = require("axios");
const ethers = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ftm.tools/`);
const ABI_RARITY = require('./abi/rarity_rar.json');
const ABI_WRAP_RAR = require('./abi/wrap_rar.json')
const GAS_PERCENT = 0.8;
const SPENDER = '2596298'
const rarityManifested = new ethers.Contract(
    "0x00000000000147629f002966C4f2ADc1cB4f0Aca",
    ABI_RARITY,
    provider
);

const wrapRarManifested = new ethers.Contract(
    "0x817CA23E8393Aa3E0075a40deD609684651982d7",
    ABI_WRAP_RAR,
    provider
);


let wallet;
let nonce;
let rarityManifestedConnected;
let wrapRarManifestedConnected;

start();


async function start() {
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    nonce = await provider.getTransactionCount(wallet.address);
    rarityManifestedConnected = rarityManifested.connect(wallet);
    wrapRarManifestedConnected = wrapRarManifested.connect(wallet);
    let summoners = await getAllMySummoners(wallet.address);
    console.log(`Total of ${summoners.length} summoners loaded`);
    for (let summoner of summoners) {
        let balance = await getBalance(summoner);
        if (balance > 0) {
            let allowance = await getAllowance(summoner, SPENDER);
            if (allowance == 0) {
                await setApproval(summoner, SPENDER);
            }
            await wrapRar(summoner, balance);
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

function setApproval(from, spender) {
    return new Promise(async (resolve, reject) => {
        let gasPrice = (await provider.getGasPrice()) * GAS_PERCENT;
        rarityManifestedConnected.approve(from, spender, -1, {
            gasLimit: 240000,
            gasPrice: gasPrice,
            nonce
        }).then(async (result) => {
            await result.wait();
            console.log(`Summoner[${summonerId}] has the spender set!`);
            nonce++;
            resolve(true)
        }).catch(err => {
            console.log(err)
            reject(err);
        });
    });
}

function wrapRar(summonerId, amount) {
    return new Promise(async (resolve, reject) => {
        let gasPrice = (await provider.getGasPrice()) * GAS_PERCENT;
        wrapRarManifestedConnected.wrap(summonerId, amount, {
            gasLimit: 240000,
            gasPrice: gasPrice,
            nonce
        }).then(async (result) => {
            await result.wait();
            console.log(`Summoner[${summonerId}] just wrapped ${amount / 1000000000000000000} RAR!`);
            nonce++;
            resolve(true)
        }).catch(err => {
            console.log(err)
            reject(err);
        });
    });
}

function getAllowance(summonerId, allowance) {
    return new Promise((resolve, reject) => {
        rarityManifestedConnected.allowance(summonerId, allowance).then(allowance => {
            resolve(allowance);
        }).catch(err => {
            console.log(err.reason);
            reject(err);
        })

    });
}

function removeItem(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}