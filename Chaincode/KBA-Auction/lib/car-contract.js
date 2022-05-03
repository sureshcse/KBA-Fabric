/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class CarContract extends Contract {

    async auctionAssetExists(ctx, aucId) {
        const buffer = await ctx.stub.getState(aucId);
        return (!!buffer && buffer.length > 0);
    }

    async createAuctionAsset(ctx, aucId, make, model, dom, owner, regNo, chasisNo) {
        const mspID = ctx.clientIdentity.getMSPID();
        if(mspID==='auctioneer-auto-com'){
            const exists = await this.auctionAssetExists(ctx, aucId);
            if (exists) {
                throw new Error(`The car ${aucId} already exists`);
            }
            const carAsset = {
                make,
                model,
                dom,
                owner,
                regNo,
                chasisNo
            };
            const buffer = Buffer.from(JSON.stringify(carAsset));
            await ctx.stub.putState(aucId, buffer);
        }
        else{
            return(`User under following MSP ID:${mspID} is not allowed to initiate auction asset creation`)
        }
    }


    async makeBid(ctx, aucId, bidAmount, maxBidder) {
        const exists = await this.auctionAssetExists(ctx, aucId);
        if (!exists) {
            throw new Error(`The car ${aucId} does not exist`);
        }
        const buffer = await ctx.stub.getState(aucId);
        const asset = JSON.parse(buffer.toString());
        if(bidAmount > asset.bidMaxAmount&& asset.state === 'open'){
            let bidCount = asset.bidCount + 1;
            asset.bidAmount = bidAmount;
            asset.maxBidder = maxBidder;
            asset.bidCount = bidCount
            const new_buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(aucId, new_buffer);
        }

    }

    async openBid(ctx,aucId,faceValue){
        const exists = await this.auctionAssetExists(ctx, aucId);
        if (!exists) {
            throw new Error(`The car ${aucId} does not exist`);
        }

        const asset={
            faceValue,
            status:'in action',
            state:'open',
            bidCount:'0',
            bidMaxAmount:faceValue,
            maxBidder:''
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(aucId, buffer);
    }

    async closeAuction(ctx, carAuctionId) {
        const exists = await this.auctionAssetExists(ctx, carAuctionId);
        if (!exists) {
            throw new Error(`The car auction ${carAuctionId} does not exist`);
        }

        const buffer = await ctx.stub.getState(carAuctionId);
        const asset = JSON.parse(buffer.toString());
        if(asset.state === 'open'){
            asset.state = 'closed';
            asset.status = 'in review';
            const new_buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(carAuctionId, new_buffer);
        }
    }

    async announceWinner(ctx, carAuctionId) {
        const exists = await this.auctionAssetExists(ctx, carAuctionId);
        if (!exists) {
            throw new Error(`The car auction ${carAuctionId} does not exist`);
        }

        const buffer = await ctx.stub.getState(carAuctionId);
        const asset = JSON.parse(buffer.toString());

        if(asset.bidCount > 0 && asset.state === 'closed'){
            asset.status = 'assigned to ' + asset.maxBidder;
            asset.owner = asset.maxBidder;
            const new_buffer = Buffer.from(JSON.stringify(asset));
            await ctx.stub.putState(carAuctionId, buffer);
        }
    }


    async readCar(ctx, aucId) {
        const exists = await this.auctionAssetExists(ctx, aucId);
        if (!exists) {
            throw new Error(`The car ${aucId} does not exist`);
        }
        const buffer = await ctx.stub.getState(aucId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async updateCar(ctx, aucId,newMake,newModel,newDom,newOwner,newRegNo,newChasisNo) {
        const exists = await this.auctionAssetExists(ctx, aucId);
        if (!exists) {
            throw new Error(`The car ${aucId} does not exist`);
        }
        const asset = {
            make:newMake,
            model:newModel,
            dom:newDom,
            owner:newOwner,
            regNo:newRegNo,
            chasisNo:newChasisNo
        };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(aucId, buffer);
    }

    async deleteCar(ctx, aucId) {
        const mspID = ctx.clientIdentity.getMSPID();
        if(mspID==='auctioneer-auto-com'){
            const exists = await this.auctionAssetExists(ctx, aucId);
            if (!exists) {
                throw new Error(`The car ${aucId} does not exist`);
            }
            await ctx.stub.deleteState(aucId);
        }
        else{
            return(`User under following MSP ID:${mspID} is not allowed to delete auction assets`)
        }
    }
}



module.exports = CarContract;
