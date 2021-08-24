const {profile} = require('./profile')
const {Wallets, Gateway} = require('fabric-network')
const path = require('path')
const fs = require('fs')

class clientApplication {
//submit a transaction
   async generateAndSubmitTxn(role,identityLabel,channelName,chaincodeName,contractName,txnName,...args){
       let gateway = new Gateway();
       try {
           this.Profile = profile[role.toLowerCase()]
           const ccpPath = path.resolve(this.Profile["CP"])
           const ccp = JSON.parse(fs.readFileSync(ccpPath,'utf-8'))
           let wallet = await Wallets.newFileSystemWallet(this.Profile["Wallet"])
           await gateway.connect(ccp,{wallet, identity: identityLabel,discovery: {enabled:true, asLocalhost:true}})
           let channel = await gateway.getNetwork(channelName)
           let contract = await channel.getContract(chaincodeName,contractName)
           let result = await contract.submitTransaction(txnName,...args)
           console.log(result)
           return Promise.resolve(result)

        } catch (error) {
            console.log("Error occured",error)
            return Promise.reject(error);
           
       } finally {
           console.log("Disconnect from the gateway.")
           gateway.disconnect()
       }

   }
}

module.exports = {
    clientApplication
}