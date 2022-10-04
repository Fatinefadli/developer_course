const { executeTransaction, convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // write your code here
    const master = deployer.accountsByName.get("master");

    const approvalFile = "holdings_approval.py";
    const clearStateFile = "holdings_clearstate.py";
    
    const app = deployer.getApp(approvalFile, clearStateFile);
    const appID1 = app.appID;

    let globalState = await readAppGlobalState(deployer, master.addr, appID1);
    const current_price = globalState.get("current_price");
    const updateprice = [convert.stringToBytes("UpdatePrice"),convert.uint64ToBigEndian(3e6)];

    await executeTransaction(deployer, {
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: appID1,
        payFlags: { totalFee: 1000 },
        appArgs: updateprice,
    });
}

module.exports = { default: run };
