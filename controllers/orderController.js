import orderModel from "../modals/orderModel.js";
import userModel from "../modals/userModel.js"
import Stripe from "stripe"


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const frontend_url = "https://tmeech-food-delivery-app.vercel.app/"



// Placing user order from frontend 
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, paymentMethod } = req.body;

    if (paymentMethod === 'Stripe') {
      let line_items = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      }));

      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Charges",
          },
          unit_amount: 2 * 100,
        },
        quantity: 1,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: line_items,
        mode: 'payment',
        success_url: `${frontend_url}/verify?success=true&userId=${userId}&items=${encodeURIComponent(JSON.stringify(items))}&amount=${amount}&address=${encodeURIComponent(JSON.stringify(address))}`,
        cancel_url: `${frontend_url}/verify?success=false`,
      });

      res.json({ success: true, session_url: session.url });
    } else {
      const newOrder = new orderModel({
        userId,
        items,
        amount,
        address,
        paymentMethod,
      });

      await newOrder.save();
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      res.json({ success: true, message: "Order placed successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
};


    
const verifyOrder = async (req, res) => {
  const { success, userId, items, amount, address } = req.query;

  try {
    if (success === "true") {
      const newOrder = new orderModel({
        userId,
        items: JSON.parse(items),
        amount,
        address: JSON.parse(address),
        paymentMethod: 'Stripe',
        payment: true,
      });

      await newOrder.save();
      await userModel.findByIdAndUpdate(userId, { cartData: {} });

      res.json({ success: true, message: "Order placed and paid" });
    } else {
      res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying order" });
  }
};


// user order for frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId })
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//Listing order for admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// api for updating order status
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        console.log(error); 
        res.json({success:false,message:"Error"})
    }
}

export {placeOrder, verifyOrder, userOrders, listOrders, updateStatus}