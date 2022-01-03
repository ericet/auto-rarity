# Auto Rarity
An automate tool to help you managing your summoners

## Features:
* Auto Adventure
* Auto Level up
* Auto Claim glod
* Creating summoners in bulk
* Auto Claim RAR token (No longer needed since all RAR tokens have been claimed)
* Auto transfer RAR from each summoner to one summoner
* Auto wrapping RAR to WRAR

## How to use:

### Setting up
* git clone https://github.com/ericet/auto-rarity.git
* npm install
* mv .env.example .env
* Replace YOUR_WALLET_PRIVATE_KEYS from .env file with your private key(s). If you have more than one wallet, separated by comma(,)
 * eg: KEYS=000000000000,11111111111,22222222222


### Automate adventure, level up and claim gold actions
* `node auto_rarity.js` 


### Create summoners in bulk
* `node create_summoners.js`
* In the prompt, enter number of summoners you want to create

### Claim RAR (No longer needed, all RAR have been claimed)
* `node claim_rar.js`


### Collect RAR
* `node collect_rar.js`
* In the prompt, enter the summoner ID you want all the RAR transfer to



### Wrap RAR tokens into WRAR
Before you're running the script, you should collect all the RAR tokens into one summoner, so you can save some gas.

* `node wrap_rar.js`





