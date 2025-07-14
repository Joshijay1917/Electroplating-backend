import mongoose, { model } from "mongoose";

const customerSchema = mongoose.Schema(
    {
        "name": { type: String, require: true },
        "phone": { type: String, require: true }
    },
    {
        timestamps: true
    }
)

const Customer = mongoose.models?.Customer || model("Customer", customerSchema)

export default Customer