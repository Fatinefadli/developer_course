<template>
    <div id="buyasset" class="mb-5">
        <h3>Buy TESLA coin</h3>
        <p>You can only mint up to 1000 TESLA coins</p>
        <div
            v-if="this.acsTxId !== ''"
            class="alert alert-success"
            role="alert"
        >
            Txn Ref:
            <a :href="explorerURL" target="_blank">{{ this.acsTxId }}</a>
        </div>
        <p>TESLA coins left: {{ this.asset_left }}</p>
        <form
            action="#"
            @submit.prevent="handleBuyAsset"
        >
            <div class="mb-3">
                <label for="asset_amount" class="form-label"
                    >Buy amount</label
                >
                <input
                    type="number"
                    class="form-control"
                    id="asset_amount"
                    v-model="asset_amount"
                />
            </div>
            <button type="submit" class="btn btn-primary">Buy</button>
        </form>
    </div>
</template>

<script>
import * as helpers from '../helpers';
import algosdk from 'algosdk';
import holdigsConfig from '../artifacts/mint_asset.js.cp.yaml';
import { getAlgodClient } from "../client.js";
import wallets from "../wallets.js";


export default {
    props: {
        connection: String,
        network: String,
    },

    data() {
        return {
            acsTxId: "",
            asset_left: 0,
            asset_amount: 0,
            explorerURL: "",
            algodClient: null,
            holdigsAppAdress: null,
            holdinsAppID: null,
        };
    },
    created(){
        this.algodClient = getAlgodClient("Localhost"),
        this.holdigsAppAdress = holdigsConfig.default.metadata.holdingsAppAddress
        this.holdinsAppID = holdigsConfig.default.metadata.holdingsAppID
        this.assetLeft();
    },


    methods: {
        async updateTxn(value) {
            this.acsTxId = value;
            this.explorerURL = helpers.getExplorerURL(this.acsTxId, this.network);
        },

        async assetLeft(){
            let applicationInfoResponse1 = await this.algodClient.accountInformation(this.holdigsAppAdress).do();
            this.asset_left=applicationInfoResponse1.assets[0].amount;
    },

        async handleBuyAsset() {
            // write code here
            let userAccount = algosdk.mnemonicToSecretKey(process.env.VUE_APP_ACC1_MNEMONIC);
            let sender = userAccount.addr;

            let params = await this.algodClient.getTransactionParams().do();
            params.fee = 1000
            params.flatFee = true


            let applicationInfoResponse = await this.algodClient.getApplicationByID(this.holdinsAppID).do();
            
            let txn1 = algosdk.makeAssetTransferTxnWithSuggestedParams(
                sender,
                sender,
                undefined,
                undefined,
                0,
                undefined,
                applicationInfoResponse['params']['global-state'][0].value.uint,
                params
            );

            await wallets.sendAlgoSignerOptIn(txn1, this.algodClient);

            let txn2 = algosdk.makePaymentTxnWithSuggestedParams(
                sender, 
                this.holdigsAppAdress, 
                applicationInfoResponse['params']['global-state'][1].value.uint*this.asset_amount, 
                undefined, 
                undefined, 
                params);

            let appArgs = [new Uint8Array(Buffer.from("purchase")), algosdk.encodeUint64(Number(this.asset_amount))];

            let txn3 = algosdk.makeApplicationNoOpTxn(sender, params, this.holdinsAppID,appArgs,undefined,undefined,[applicationInfoResponse['params']['global-state'][0].value.uint]);
            
            // Store txns
            let txns = [txn2, txn3];

            // Assign group ID
            algosdk.assignGroupID(txns);
            const a = await wallets.sendAlgoSignerTransaction(txns, this.algodClient);
            if(a){
            this.updateTxn(a.txId)
           }else{
            console.log("transaction error!!!!");
           }

        },
    },
};
</script>
