import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def holdings_approval():

    basic_checks= And(
        Txn.rekey_to() == Global.zero_address(),
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.asset_close_to() == Global.zero_address()
    )

    assetID = Btoi(Txn.application_args[0])
    handle_creation = Seq([
        Assert(basic_checks),
        App.globalPut(Bytes("assetID"), assetID),
        App.globalPut(Bytes("current_price"), Int(5000000)), # 5 algos
        Return(Int(1))
    ])

    amountforUpdate = Btoi(Txn.application_args[1])
    update_price= Seq([
        Assert(basic_checks),
        Assert(Txn.sender()==Global.creator_address()),
        App.globalPut(Bytes("current_price"), amountforUpdate),
        Return(Int(1))
    ])

    optin_asset=Seq([
        Assert(basic_checks),
        Assert(App.globalGet(Bytes("assetID"))==Txn.assets[0]),
        Assert(App.globalGet(Bytes("check"))==Int(0)),
        Assert(Txn.sender() == Global.creator_address()),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
        TxnField.type_enum: TxnType.AssetTransfer,
        TxnField.asset_receiver: Global.current_application_address(),
        TxnField.asset_amount: Int(0),
        TxnField.xfer_asset: Txn.assets[0], # Must be in the assets array sent as part of the application call
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(Bytes("check"), Int(1)), #To check if Asset has not been opted in before

        Return(Int(1))
    ])

    senderAssetBalance = AssetHolding.balance(Global.current_application_address(), App.globalGet(Bytes("assetID")))
    amount = Seq(
        senderAssetBalance,
        Assert(senderAssetBalance.hasValue()),
        senderAssetBalance.value()
    )
    # a group of transactions
    balance = Balance(Gtxn[0].sender())
    minBalance = MinBalance(Gtxn[0].sender())
    realBalance = balance - minBalance
    #the balance should be valid
    amountOftesla = Btoi(Gtxn[1].application_args[1])

    purchase = Seq([
        Assert(basic_checks),
        Assert(App.globalGet(Bytes("assetID"))==Txn.assets[0]),

        Assert(Global.group_size()==Int(2)),
        Assert(Gtxn[0].type_enum()==TxnType.Payment),
        Assert(Gtxn[1].type_enum()==TxnType.ApplicationCall),

        Assert(amount>=amountOftesla),
        Assert(amountOftesla<=Int(1000)),
        Assert(amountOftesla>=Int(1)),
        Assert(realBalance>=App.globalGet(Bytes("current_price"))*amountOftesla + Int(1000)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
        TxnField.type_enum: TxnType.AssetTransfer,
        TxnField.asset_receiver: Gtxn[1].sender(),
        TxnField.asset_amount: amountOftesla,
        TxnField.xfer_asset: Gtxn[1].assets[0], # Must be in the assets array sent as part of the application call
        }),
        InnerTxnBuilder.Submit(),
        Return(Int(1))
    ])

    handle_noop = Seq(
         Cond(
            [Txn.application_args[0] == Bytes("optin_asset"), optin_asset],
            [Txn.application_args[0] == Bytes("UpdatePrice"), update_price],
            [Txn.application_args[0] == Bytes("purchase"), purchase],
        )
    )

    handle_optin = Seq([
        Assert(App.optedIn(Txn.sender(), Txn.application_id())),
        Return(Int(1))
    ])

    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

    return program

if __name__ == "__main__":
    print(compileTeal(holdings_approval(), mode=Mode.Application, version=6))