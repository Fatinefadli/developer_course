const { types } = require("@algo-builder/web");
const { assert, expect } = require("chai");
const { Runtime, AccountStore, ERRORS } = require("@algo-builder/runtime");
const commonfn = require("./functions");

describe("Success Flow", function () {
    // Write your code here
    let master;
    let runtime;
    let appInfoMint;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(100e6); //100 Algos
        runtime = new Runtime([master]);
    });

    it("Deploys mint contract successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const appID = appInfoMint.appID;

        // verify app created
        assert.isDefined(appID);

        // verify app funded
        const appAccount = runtime.getAccount(appInfoMint.applicationAccount);
        assert.equal(appAccount.amount, 2e7);

    }).timeout(10000);

    
    it("asset created successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);

        // verify assetID
        assert.isDefined(assetID);

    }).timeout(10000);


    it("Deploys holding contract successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfo = commonfn.initHolding(runtime,master.account,assetID);
        const appID = appInfo.appID;

        // verify app created
        assert.isDefined(appID);

        // verify app funded
        const appAccount = runtime.getAccount(appInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    }).timeout(10000);

    it("Deploys Burn contract successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfo = commonfn.initBurn(runtime,master.account,assetID);
        const appID = appInfo.appID;

        // verify app created
        assert.isDefined(appID);

        // verify app funded
        const appAccount = runtime.getAccount(appInfo.applicationAccount);
        assert.equal(appAccount.amount, 2e7);
    }).timeout(10000);

    it("Holding contract opts in successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding= commonfn.initHolding(runtime,master.account,assetID);

        // do opt in
        commonfn.optIn(runtime, master.account, 'optin_asset', appInfoHolding.appID, assetID);

    }).timeout(10000);

    it("burn contract opts in successfully", () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoBurn= commonfn.initBurn(runtime,master.account,assetID);

        // do opt in
        commonfn.optIn(runtime, master.account, "optin_asset_burn", appInfoBurn.appID, assetID);

    }).timeout(10000);


    it("price updated successfully" , () => {
        appInfoMint = commonfn.initMint(runtime,master.account);
        const assetID = commonfn.createAsset(runtime,master.account,appInfoMint.appID);
        const appInfoHolding = commonfn.initHolding(runtime,master.account,assetID);

        const newPrice = 7e6;
        //update price
        commonfn.updatePrice(runtime,master.account,appInfoHolding.appID,newPrice);

        //check new price
        assert.equal(runtime.getGlobalState(appInfoHolding.appID, "current_price"), newPrice);
        

    }).timeout(10000);

    
    it("Transfer successfully" , () => {
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
        commonfn.optIn(runtime, master.account, 'optin_asset', appInfoHolding.appID, assetID);
        commonfn.transfer(runtime, 
            "transfer", 
            500000, 
            master.account,
            appInfoMint.appID, 
            appInfoHolding.applicationAccount,
            assetID
            );

        const appAccount = runtime.getAccount(appInfoHolding.applicationAccount);
      
        assert.equal(Number(appAccount.assets.get(assetID).amount),500000);

    }).timeout(10000);

    it("Burn successfully" , () => {
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
        commonfn.optIn(runtime, master.account, "optin_asset_burn", appInfoBurn.appID, assetID);
        commonfn.transfer(runtime, 
            "burn", 
            20000, 
            master.account,
            appInfoMint.appID, 
            appInfoBurn.applicationAccount,
            assetID
        );
        const appAccount = runtime.getAccount(appInfoBurn.applicationAccount);

        assert.equal(Number(appAccount.assets.get(assetID).amount),20000);

    }).timeout(10000);
    

});
