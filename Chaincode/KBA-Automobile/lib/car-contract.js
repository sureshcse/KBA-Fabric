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

    async createCar(ctx, carId, value) {
        const exists = await this.carExists(ctx, carId);
        if (exists) {
            throw new Error(`The car ${carId} already exists`);
        }
        const asset = { value };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(carId, buffer);
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

    async updateCar(ctx, carId, newValue) {
        const exists = await this.carExists(ctx, carId);
        if (!exists) {
            throw new Error(`The car ${carId} does not exist`);
        }
        const asset = { value: newValue };
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(carId, buffer);
    }

    async deleteCar(ctx, carId) {
        const exists = await this.carExists(ctx, carId);
        if (!exists) {
            throw new Error(`The car ${carId} does not exist`);
        }
        await ctx.stub.deleteState(carId);
    }

}

module.exports = CarContract;
