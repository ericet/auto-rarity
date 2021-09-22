
require("dotenv").config();
const axios = require("axios");
const ethers = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ftm.tools/`);
const ABI_RARITY = require('./abi/rarity_rar.json');
const GAS_PERCENT = 1; 
const rarityManifested = new ethers.Contract(
  "0x00000000000147629f002966C4f2ADc1cB4f0Aca",
  ABI_RARITY,
  provider
);



let wallet;
let nonce;
let rarityManifestedConnected;
start()


async function claimRar(summonerId, claimable) {
  return new Promise(async (resolve, reject) => {
    let gasPrice = (await provider.getGasPrice()) * GAS_PERCENT;
    rarityManifestedConnected.claim(summonerId, {
      gasLimit: 240000,
      gasPrice: gasPrice,
      nonce
    }).then(async (result) => {
      await result.wait();
      console.log(`Summoner[${summonerId}] claimed ${claimable} RAR!`);
      nonce++;
      resolve(true)
    }).catch(err => {
      console.log(err)
      reject(err);
    });
  });
}

async function start() {
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  nonce = await provider.getTransactionCount(wallet.address);
  rarityManifestedConnected = rarityManifested.connect(wallet);

  let summoners = await getAllMySummoners(wallet.address);
  console.log(`Total of ${summoners.length} summoners loaded`);
  for (let summoner of summoners) {
    let claimable = (await getClaimable(summoner))/1000000000000000000;
    if (claimable > 0) {
      await claimRar(summoner,claimable);
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

function getClaimable(summonerId) {
  return new Promise((resolve, reject) => {
    rarityManifestedConnected.claimable(summonerId).then(claimable => {
      resolve(claimable);
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