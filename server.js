import express from 'express'
import Customer from './model/Customer.js';
import cors from 'cors'
import Order from './model/Order.js';
import connectDB from './db/db.js'
import router from './routes/Router.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors())

connectDB();

app.use("/api", router)

app.get('/', async (req, res) => {
    res.send('Hello backend')
})

app.get('/allcustomer', async(req, res) => {
    let customers = await Customer.find({})

    if(customers) {
        res.json(customers);
    } else {
        res.json({ msg: "Failed to get customers", status: 400})
    }
})

app.get('/allorders', async(req, res) => {
    let orders = await Order.find({})

    if(orders) {
        res.json(orders);
    } else {
        res.json({ msg: "Failed to get Orders", status: 400})
    }
})

app.put('/changestatus', async(req, res) => {
    console.log("Status request:", req.body.orderID);

    if(req.body.orderID) {
        try {
            const updatedDoc = await Order.findOneAndUpdate({_id: req.body.orderID}, {status: req.body.status})
            if(!updatedDoc) {
                return res.status(400).json({msg:"Order not found", status: 400});
            }
            
            res.status(200).json({msg: "Status Changed Successfully"});
        } catch (error) {
            res.status(400).json({msg:"Cannot change status: " + error, status: 400})
        }
    } else {
        res.status(400).json({msg:"Order ID is not defined", status: 400})
    }
})

app.listen(PORT, () => {
    console.log(`app listen on port ${PORT}`);
})
