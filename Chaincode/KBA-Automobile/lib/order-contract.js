/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

async function getCollectionName(ctx) {
    const collectionName = 'CollectionOrder';
    return collectionName;
}

class OrderContract extends Contract {
    async orderExists(ctx, orderId) {
        const collectionName = await getCollectionName(ctx);
        const data = await ctx.stub.getPrivateDataHash(collectionName, orderId);
        return !!data && data.length > 0;
    }

    async createOrder(ctx, orderId) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID === 'dealer-auto-com') {
            const exists = await this.orderExists(ctx, orderId);
            if (exists) {
                throw new Error(`The asset order ${orderId} already exists`);
            }
            const orderAsset = {};
            const transientData = ctx.stub.getTransient();
            if (
                transientData.size === 0 ||
        !transientData.has('make') ||
        !transientData.has('make') ||
        !transientData.has('color') ||
        !transientData.has('dealerName')
            ) {
                throw new Error(
                    'The privateValue key was not specified in transient data. Please try again.'
                );
            }
            orderAsset.make = transientData.get('make').toString();
            orderAsset.model = transientData.get('model').toString();
            orderAsset.color = transientData.get('color').toString();
            orderAsset.dealerName = transientData.get('dealerName').toString();
            orderAsset.assetType = 'order';

            const collectionName = await getCollectionName(ctx);
            await ctx.stub.putPrivateData(
                collectionName,
                orderId,
                Buffer.from(JSON.stringify(orderAsset))
            );
        } else {
            return `Under following MSP: ${mspID} cannot able to perform this action`;
        }
    }

    async readOrder(ctx, orderId) {
        const exists = await this.orderExists(ctx, orderId);
        if (!exists) {
            throw new Error(`The asset order ${orderId} does not exist`);
        }
        let privateDataString;
        const collectionName = await getCollectionName(ctx);
        const privateData = await ctx.stub.getPrivateData(collectionName, orderId);
        privateDataString = JSON.parse(privateData.toString());
        return privateDataString;
    }

    async deleteOrder(ctx, orderId) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID === 'dealer-auto-com') {
            const exists = await this.orderExists(ctx, orderId);
            if (!exists) {
                throw new Error(`The asset order ${orderId} does not exist`);
            }
            const collectionName = await getCollectionName(ctx);
            await ctx.stub.deletePrivateData(collectionName, orderId);
        } else {
            return `Under following MSP: ${mspID} cannot able to perform this action`;
        }
    }
}

module.exports = OrderContract;
