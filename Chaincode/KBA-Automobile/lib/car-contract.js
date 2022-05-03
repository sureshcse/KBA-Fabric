/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class CarContract extends Contract {

    async carExists(ctx, carId) {
        const buffer = await ctx.stub.getState(carId);
        return (!!buffer && buffer.length > 0);
    }

    async createCar(ctx, carId, make, model, color, dateOfManufacture, manufacturerName ) {
        const mspID = ctx.clientIdentity.getMSPID();
        if(mspID === 'manufacturer-auto-com'){
            const exists = await this.carExists(ctx, carId);
            if (exists) {
                throw new Error(`The car ${carId} already exists`);
            }
            const carAsset = {
                make,
                model,
                color,
                dateOfManufacture,
                status:'In Factory',
                ownedBy: manufacturerName,
                assetType:'car',

            };
            const buffer = Buffer.from(JSON.stringify(carAsset));
            await ctx.stub.putState(carId, buffer);
        }

        else{
            return(`User under following MSP:${mspID} cannot perform this action`);
        }
    }

    async readCar(ctx, carId) {
        const exists = await this.carExists(ctx, carId);
        if (!exists) {
            throw new Error(`The car ${carId} does not exist`);
        }
        const buffer = await ctx.stub.getState(carId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async deleteCar(ctx, carId) {
        const mspID = ctx.clientIdentity.getMSPID();
        if(mspID === 'manufacturer-auto-com'){
            const exists = await this.carExists(ctx, carId);
            if (!exists) {
                throw new Error(`The car ${carId} does not exist`);
            }
            await ctx.stub.deleteState(carId);
        }
        else{
            return(`User under following MSP:${mspID} cannot perform this action`);
        }

    }

    async queryAllCars(ctx){
        const queryString = {
            selector:{
                assetType:'car'
            },
            sort: [{dateOfManufacture: 'asc'}]
        };
        let resultIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        let result = await this.getAllResults(resultIterator,false);
        return JSON.stringify(result);
    }

    async getCarsByRange(ctx,startKey,endKey){
        let resultIterator = await ctx.stub.getStateByRange(startKey,endKey);
        let result = await this.getAllResults(resultIterator,false);
        return JSON.stringify(result);
    }

    async getCarsWithPagination(ctx,_pageSize,_bookmark){
        const queryString = {
            selector: {
                assetType : 'car',
            }
        };
        const pageSize = parseInt(_pageSize,10);
        const bookmark = _bookmark;
        const {iterator,metadata} = await ctx.stub.getQueryResultWithPagination(
            JSON.stringify(queryString),
            pageSize,
            bookmark
        );
        const result = await this.getAllResults(iterator,false);
        const results = {};
        results.Result = result;
        results.ResponseMetaData = {
            RecordCount : metadata.fetched_records_count,
            Bookmark : metadata.bookmark
        };
        return JSON.stringify(results);
    }

    async getCarsHistory(ctx,carId){
        let resultIterator = await ctx.stub.getHistoryForKey(carId);
        let results = await this.getAllResults(resultIterator,true);
        return JSON.stringify(results);
    }

    async getAllResults(iterator,isHistory){
        let allResults = [];
        for(let res = await iterator.next();
            !res.done;
            res = await iterator.next()
        ){
            if(res.value && res.value.value.toString()){
                let jsonRes = {};
                if(isHistory && isHistory === true){
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.timestamp = res.value.timestamp;
                    jsonRes.Value = JSON.parse(res.value.value.toString());
                }
                else{
                    jsonRes.Key = res.value.key;
                    jsonRes.Record = JSON.parse(res.value.value.toString());
                }

                allResults.push(jsonRes);
            }
        }
        await iterator.close();
        return allResults;
    }

}

module.exports = CarContract;
