import express from 'express'
import Customer from '../model/Customer.js';
import Order from '../model/Order.js';
import PDFDocument from 'pdfkit'

const router = express.Router();

router.post('/addcustomer', async (req, res) => {
    const data = await req.body
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
    const { From, To } = req.body.Date;
    
    try {
        const startDate = new Date(`${From}-01T00:00:00.000Z`);
        const endDate = new Date(`${To}-01T00:00:00.000Z`);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const customer = await Customer.findById(customerid)
        const orders = await Order.find({
            $and: [
            {
                customerid: customerid
            },
            {
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        ]})

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

        // Track current Y position dynamically
    let y = 50;

    // Add company header
    doc.fontSize(25)
       .text('Harshad Electroplating', { align: 'center' });
    y += 50; // Move down after header

    // Add customer details
    doc.fontSize(12)
       .text(`Customer Name: ${customer.name}`, 50, y)
       .text(`Phone: ${customer.phone}`, 50, y + 15)
       .text(`Bill Date: ${new Date().toLocaleDateString()}`, 50, y + 30);
        y += 60; // Move down after customer details

        // Create table headers with blue background
        doc.fillColor('#1565C0') // Blue background
           .rect(50, y, 500, 20) // x, y, width, height
           .fill()
           .fillColor('#ffffff') // White text
           .font('Helvetica-Bold')
           .text('Item Name', 70, y + 5)
           .text('Order Date', 200, y + 5)
           .text('Material', 250, y + 5)
           .text('Plating', 300, y + 5)
           .text('Rate/Plate', 350, y + 5)
           .text('Qty', 400, y + 5)
           .text('Total', 450, y + 5);
        y += 30; // Move down after headers

        // Reset styles for table content
        doc.fillColor('#000000').font('Helvetica');

        // Add order items
        let finalTotal = 0;
        orders.forEach(order => {
        // Draw alternating row background
        if (orders.indexOf(order) % 2 === 0) {
            doc.fillColor('#f5f5f5')
               .rect(50, y, 500, 20)
               .fill()
               .fillColor('#000000');
        }
            //let totalPrice = 0;
            const platingSum = order.plating.reduce((sum, p) => sum + p.price, 0);
            //order.plating.forEach(p => {
                //totalPrice += p.price.toFixed(2)
            //})

        doc.text(order.itemName, 70, y + 5)
            .text(new Date(order.createdAt).toLocaleDateString(), 200, y + 5)
            .text(order.material, 250, y + 5)
            //.text(platingSum, 250, y + 5)
            //.text(platingSum, 320, y + 5)
            .text(order.quantity.toString(), 400, y + 5)
            .text(`Rs.${order.total.toFixed(2)}`, 450, y + 5);

        order.plating.forEach(p => {
                doc.text(p.type, 300, y + 5)
                    .text(`Rs.${p.price}`, 350, y + 5)
            

            y += 20;
        })
    
            finalTotal += order.total;
            y += 20; // Move down for next row
        });

        // Add final total
        y += 40; // Extra space before total
         doc.moveTo(400, y+40)
        .lineTo(400, y+40)
        .stroke()
        .font('Helvetica-Bold')
        .text(`Final Total: Rs.${finalTotal.toFixed(2)}`, { align: 'right', continued: false });

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
