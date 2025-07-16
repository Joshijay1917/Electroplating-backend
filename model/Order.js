import mongoose, { model } from "mongoose";

const orderSchema = mongoose.Schema(
    {
        "itemName": { type: String, require: true },
        "customer": { type: String, require: true },
        "customerid": { type: String, require: true },
        "material": { type: String, require: true },
        "quantity": { type: Number, require: true },
        "baseCost": { type: Number, require: true },
        "total": { type: Number, require: true },
        "plating": { type: Array, require: true },
        "status": { type: String, default: "pending" },
        "gst": { type: Number, default: 0},
    },
    {
        timestamps: true
    }
)

const Order = mongoose.models?.Order || model("Orders", orderSchema)

export default Order
