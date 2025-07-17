import express from 'express'
import Customer from '../model/Customer.js';
import Order from '../model/Order.js';

const router = express.Router();

router.post('/addcustomer', async (req, res) => {
    const data = await req.body;
    data.name = data.name.toLowerCase()

    if (!data.name || !data.phone) {
        return res.status(400).json(
            { msg: "Name and Phone are required", status: 400}
        )
    }

    const existingCustomer = await Customer.findOne({name:data.name})
    if (existingCustomer) {
        return res.status(400).json(
            { msg: "Customer already registered", status: 400}
        );
    }

    await Customer.create(data)

    return res.status(200).json({msg: "Register successfully"})
})

router.post('/addorder', async (req, res) => {
    const data = req.body;
    console.log("Data:", data.gstApply === 'yes(18)');
    
    let baseCost = 0;
    for (let i = 0; i < req.body.plating.length; i++) {
        const plate = req.body.plating[i]
        
        baseCost += +(plate.price * data.quantity).toFixed(2)
    }

    let gst = 0;
    if(data.gstApply === 'yes(18)') {
        gst = +(baseCost * 0.18).toFixed(2);
    } else if(data.gstApply === 'yes(12)') {
        gst = +(baseCost * 0.12).toFixed(2);
    } else {
        gst = 0;
    }
    
    const total = +(baseCost + gst).toFixed(2)

    if(!data.itemName) {
        return res.status(400).json(
            {msg: "itemName is required", status: 400}
        )
    }
    if(!data.quantity) {
        return res.status(400).json(
            {msg: "quantity is required", status: 400}
        )
    }

    let order = {...data, baseCost: baseCost, gst: gst, total: total}

    await Order.create(order);

    // let finalorder = await Order.findOne({itemName: order.itemName})

    return res.status(200).json({msg: `Order created successfully`});
})

router.post('/currentcustomerorder', async(req, res) => {
    const customerid = req.body.customersid

    try {
        const order = await Order.find({customerid: customerid})
        return res.json(order)
    } catch (error) {
        return res.json({msg:"failed to get orders of currentCustomer", status:400})
    }
})

router.delete('/delete', async(req, res) => {
    console.log("Delete request:", req.body.customerID);

    if(req.body.customerID) {
        try {
            await Customer.deleteOne({_id: req.body.customerID})
            res.status(200).json({msg:"Customer Delete Successfully"})
        } catch (error) {
            res.status(400).json({msg:"Cannot delete customer: " + error, status: 400})
        }
    } else if(req.body.orderID) {
        try {
            await Order.deleteOne({_id: req.body.orderID})
            res.status(200).json({msg:"Order Delete Successfully"})
        } catch (error) {
            res.status(400).json({msg:"Cannot delete order: " + error, status: 400})
        }
    } else {
        res.status(400).json({msg:"ID is not defined", status: 400})
    }
})

export default router;
