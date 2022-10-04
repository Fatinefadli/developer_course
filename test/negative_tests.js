const { types } = require("@algo-builder/web");
const { assert} = require("chai");
const { convert} = require("@algo-builder/algob");
const { Runtime, AccountStore, ERRORS } = require("@algo-builder/runtime");
const commonfn = require("./functions");

const RUNTIME_ERR1009 = 'RUNTIME_ERR1009: TEAL runtime encountered err opcode';

describe("Negative Tests", function () {
    // Write your code here

    let master;
    let runtime;
    let appInfoMint;
    let acc1;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(100e9); //100 Algos
        acc1 = new AccountStore(600e9); //100 Algos
        runtime = new Runtime([master,acc1]);
    });
    
    it("Double asset creation fails", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
    
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);

        assert.throws(() => { const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID) }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset creation fails when non-creator calls", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        assert.throws(() => { const assetID = commonfn.createAsset(runtime,acc1.account,appInfoMint.appID) }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset transfer fails when supply is insufficient" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);

       commonfn.optIn(runtime, master.account, 'optin_asset', appInfoHolding.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "transfer", 
            50000000, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset burn fails when supply is insufficient" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);

        commonfn.optIn(runtime, master.account,"optin_asset_burn", appInfoBurn.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "burn", 
            10000000, 
            master.account,
            appInfoMint.appID, 
            appInfoBurn.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset transfer fails when non-creator calls" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);

       // do opt in
       commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "transfer", 
            50000000, 
            acc1.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);


    }).timeout(10000);

    it("Asset burn fails when non-creator calls" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        

        // do opt in
        commonfn.optIn(runtime, master.account,"optin_asset_burn", appInfoBurn.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "burn", 
            10000000, 
            acc1.account,
            appInfoMint.appID, 
            appInfoBurn.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Update price fails when called by non-creator" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const newPrice = 8e6;
        //update price by non creator
        assert.throws(() => { commonfn.updatePrice(runtime,acc1.account,appInfoHolding.appID,newPrice) }, RUNTIME_ERR1009);
    
    }).timeout(10000);

    it("purchase token fails when supply < amount solde" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        // do opt in
        commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);
        commonfn.transfer(runtime, 
            "transfer", 
            50, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
            );
        const amountOfAsset = 100;
        const amountOfAlgo = 5e6*100;
        assert.throws(() =>{commonfn.purchase(runtime, acc1.account, assetID, appInfoHolding.applicationAccount,amountOfAlgo, appInfoHolding.appID,amountOfAsset)}, RUNTIME_ERR1009);
    }).timeout(100000);

    it("purchase token fails when transaction is not grouped" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        // do opt in
        commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);
        commonfn.transfer(runtime, 
            "transfer", 
            50, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
            );
        const amountOfAsset = 100;
        assert.throws(() =>{
            runtime.executeTx({
                type: types.TransactionType.CallApp,
                sign: types.SignType.SecretKey,
                fromAccount: acc1.account,
                appID: appInfoHolding.appID,
                payFlags: { totalFee: 1000 },
                foreignAssets: [assetID],
                appArgs: [convert.stringToBytes("purchase"),convert.uint64ToBigEndian(amountOfAsset)],
            })}, RUNTIME_ERR1009);
         }).timeout(100000);


    it("Buying 0 tocken fails" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        // do opt in
        commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);
        commonfn.transfer(runtime, 
            "transfer", 
            50, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
            );
        const amountOfAsset = 0;
        const amountOfAlgo = 5e6*100;
        assert.throws(() =>{commonfn.purchase(runtime, acc1.account, assetID, appInfoHolding.applicationAccount,amountOfAlgo, appInfoHolding.appID,amountOfAsset)}, RUNTIME_ERR1009);
    }).timeout(100000);


    it("Buying tockens with insufficient algos" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        // do opt in
        commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);
        commonfn.transfer(runtime, 
            "transfer", 
            50, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
            );
        const amountOfAsset = 100;
        const amountOfAlgo = 5e6;
        assert.throws(() =>{commonfn.purchase(runtime, acc1.account, assetID, appInfoHolding.applicationAccount,amountOfAlgo, appInfoHolding.appID,amountOfAsset)}, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Transfer token to non holding app fails" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);

       // do opt in
       commonfn.optIn(runtime, master.account,'optin_asset', appInfoHolding.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "transfer", 
            50000000, 
            acc1.account,
            appInfoMint.appID, 
            appInfoBurn.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);


    }).timeout(10000);

    it("Burn token to non burn app fails" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoBurn = commonfn.initBurn(runtime,master.account,assetID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);
        commonfn.saveAccounts(runtime,
            master.account,
            appInfoMint.appID,
            appInfoHolding.applicationAccount,
            appInfoBurn.applicationAccount);
        

        // do opt in
        commonfn.optIn(runtime, master.account,"optin_asset_burn", appInfoBurn.appID, assetID);

        assert.throws(() => { commonfn.transfer(runtime, 
            "burn", 
            10000000, 
            acc1.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
        ) }, RUNTIME_ERR1009);
    }).timeout(10000);
});
