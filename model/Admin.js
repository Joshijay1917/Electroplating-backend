import mongoose, { model } from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = mongoose.Schema(
    {
        "username": { type: String, require: true },
        "email": { type: String, require: true },
        "password": { type: String, require: true }
    },
    {
        timestamps: true
    }
)

adminSchema.pre('save', async function(next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

const Admin = mongoose.models?.Admin || model("Admin", adminSchema)

export default Admin
