
require("dotenv").config();
const axios = require("axios");
const ethers = require("ethers");
const summonerTypes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ftm.tools/`);
const ABI_RARITY = require('./abi/rarity.json');
const ABI_GOLD = require('./abi/rarity_gold.json');
const rarityManifested = new ethers.Contract(
  "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb",
  ABI_RARITY,
  provider
);
const rarityGoldContract = new ethers.Contract("0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2", ABI_GOLD,
  provider);
const INTERVAL = process.env.INTERVAL;


let wallet;
let nonce;
let rarityManifestedConnected;
let rarityGoldConnected;
start()
setInterval(function () {
  start()
}, INTERVAL * 60 * 1000)

async function adventure(summonerId) {
  return new Promise(async (resolve, reject) => {
    let gasPrice = (await provider.getGasPrice()) * 0.8;
    rarityManifestedConnected.adventure(summonerId, {
      gasLimit: 240000,
      gasPrice: gasPrice,
      nonce
    }).then(async (result) => {
      await result.wait();
      nonce++;
      console.log(`Summoner[${summonerId}] adventured`);
      resolve(true);
    }).catch(err => {
      console.log(err.reason);
      reject(err);
    });

  });

}


async function levelUp(summonerId) {
  return new Promise(async (resolve, reject) => {
    let gasPrice = (await provider.getGasPrice()) * 0.8;
    rarityManifestedConnected.level_up(summonerId, {
      gasLimit: 240000,
      gasPrice: gasPrice,
      nonce
    }).then(async (result) => {
      await result.wait();
      console.log(`${summonerId} level up!`);
      nonce++;
      resolve(true)
    }).catch(err => {
      console.log(err)
      reject(err);
    });
  });
}


async function claimGold(summonerId, claimable) {
  return new Promise(async (resolve, reject) => {
    let gasPrice = (await provider.getGasPrice()) * 0.8;
    rarityGoldConnected.claim(summonerId, {
      gasLimit: 240000,
      gasPrice: gasPrice,
      nonce
    }).then(async (result) => {
      await result.wait();
      console.log(`Summoner[${summonerId}] claimed ${claimable} GOLD!`);
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
  rarityGoldConnected = rarityGoldContract.connect(wallet);


  let summoners = await getAllMySummoners(wallet.address);
  console.log(`Total of ${summoners.length} summoners loaded`);
  for (let summoner of summoners) {
    let summonerInfo = await getSummonerInfo(summoner);
    let nextAdventureTime = summonerInfo._log.toNumber();
    let currentXp = summonerInfo._xp / 1000000000000000000;
    let currentClass = summonerInfo._class.toNumber();
    let currentLevel = summonerInfo._level.toNumber();
    let currentSummonerType = summonerTypes[currentClass - 1];
    let currentTime = Math.floor(Date.now() / 1000);
    let nextLevelXp = (await rarityManifestedConnected.xp_required(currentLevel)) / 1000000000000000000;
    let claimable = (await rarityGoldConnected.claimable(summoner)) / 1000000000000000000;
    if (currentTime >= nextAdventureTime) {
      if (currentLevel > 0) {
        console.log(`${summoner} ${currentSummonerType} Lv${currentLevel} xp: ${currentXp} is going to the adventure!`);
        await adventure(summoner);
      }
    } else {
      let available = secondsToHms(nextAdventureTime - currentTime);
      console.log(`Summoner[${summoner}] next adventure in: ${available}`)
    }
    if (currentXp >= nextLevelXp) {
      console.log(`summoner[${summoner}] ${currentSummonerType} Lv${currentLevel} xp: ${currentXp} is going to level up!`);
      await levelUp(summoner);
    }
    if (claimable > 0) {
      await claimGold(summoner, claimable);
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

function getSummonerInfo(summonerId) {
  return new Promise((resolve, reject) => {
    rarityManifestedConnected.summoner(summonerId).then(summonerInfo => {
      resolve(summonerInfo);
    }).catch(err => {
      console.log(err.reason);
      reject(err);
    })

  });
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

function removeItem(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}