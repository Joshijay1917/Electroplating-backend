import express from 'express'
import Customer from '../model/Customer.js';
import Order from '../model/Order.js';
import PDFDocument from 'pdfkit'

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

router.post('/generate-invoice', async (req, res) => {
    const customerid = req.body.id;
    try {
        const customer = await Customer.findById(customerid)
        const orders = await Order.find({
            customerid: customerid
        })

        if (!orders.length) {
            return res.json({ msg: 'No orders found for this customer', status: 400 });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${customer.name}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add company header
        doc
            .fontSize(25)
            .text('Harshad Electroplating', { align: 'center' })
            .moveDown(0.5);

        // Add customer details
        doc
            .fontSize(15)
            .text(`Customer Name: ${customer.name}`, 100, 150)
            .text(`Phone: ${customer.phone}`, 100, 160)
            .text(`Bill Month: 18/07`, 100, 170)
            .moveDown(1);

        // Create table headers with blue background
        doc
            .fillColor('#1565C0') // Blue color
            .font('Helvetica-Bold')
            .text('Item Name', 50, 200)
            .text('Material', 150, 200)
            .text('Plating 1', 250, 200)
            .text('Plating 2', 300, 200)
            .text('Plating 3', 350, 200)
            .text('Qty', 400, 200)
            .text('Total', 450, 200)
            .moveDown(0.5);

        // Reset text color
        doc.fillColor('#000000').font('Helvetica');

        // Add order items
        let finalTotal = 0;
        orders.forEach(order => {
                // const itemTotal = order.quantity * order.price;
                finalTotal += order.total;

                doc
                    .text(order.itemName, 50)
                    .text(order.material, 150)
                    .text(order.plating.forEach(p => p.price) || '-', 250)
                    .text(order.quantity.toString(), 400)
                    .text(`₹${order.total.toFixed(2)}`, 450)
                    .moveDown(0.5);
        });

        // Add final total
        doc
            .moveTo(400)
            .lineTo(550)
            .stroke()
            .moveDown(0.5)
            .font('Helvetica-Bold')
            .text(`Final Total: ₹${finalTotal.toFixed(2)}`, { align: 'right' });

        // Finalize PDF
        doc.end();

        // return res.json({msg: 'PDF Generate Successfully'})

    } catch (error) {
        console.error(error);
        return res.json({ msg: 'Error generating invoice', status: 400 });
    }
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
