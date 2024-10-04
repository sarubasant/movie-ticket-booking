const { initializeKhaltiPayment, verifyKhaltiPayment } = require("../khalti");
const express = require('express');
const auth = require('../middlewares/auth');
const Payment = require('../models/paymentModel');
const Reservation = require('../models/reservation');
const Movie = require('../models/movie');
const userModeling = require('../utils/userModeling');
const generateQR = require('../utils/generateQRCode');

const router = new express.Router();

const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);  // Globally disable useFindAndModify

// route to initilize khalti payment gateway
router.post("/initialize-khalti", async (req, res) => {

  try {
    //try catch for error handling
    const { itemId, totalPrice, website_url } = req.body;

    const itemData = await Reservation.findOne({
      _id: itemId,
      total: Number(totalPrice),
    });
    // console.log(itemData)

    if (!itemData) {
      return res.status(400).send({
        success: false,
        message: "item not found",
      });
    }

    const movieName = await Movie.findById(itemData.movieId)
    // console.log("movie title" + movieName.title)

    const paymentInitate = await initializeKhaltiPayment({
      amount: totalPrice * 100, // amount should be in paisa (Rs * 100)

      purchase_order_id: itemId, // reservationId in our case
      purchase_order_name: movieName.title,
      return_url: `${process.env.BACKEND_URI}/complete-khalti-payment`, // it can be even managed from frontedn
      // return_url: 'http://localhost:3000/#/dashboard',
      website_url,
    });

    res.json({
      success: true,
      // purchasedItemData,
      payment: paymentInitate,
    });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
});

// http://localhost:8080/complete-khalti-payment?
// pidx=N3dy2mTDjLqECJ84sttiAd
// &transaction_id=mGEWC7qAkEvvHbxBrZtzGG
// &tidx=mGEWC7qAkEvvHbxBrZtzGG
// &amount=40000
// &total_amount=40000
// &mobile=98XXXXX005
// &status=Completed
// &purchase_order_id=66f6d1f7b22fc3321410780d
// &purchase_order_name=sano%20sansar

// it is our `return url` where we verify the payment done by user
router.get("/complete-khalti-payment", async (req, res) => {
  const {
    pidx,
    txnId,
    amount,
    mobile,
    purchase_order_id,
    purchase_order_name,
    transaction_id,
  } = req.query;

  // console.log("pidx ".pidx)
  // console.log(purchase_order_id, amount)

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    //   {
    //     "pidx": "N3dy2mTDjLqECJ84sttiAd",
    //     "total_amount": 40000,
    //     "status": "Completed",
    //     "transaction_id": "mGEWC7qAkEvvHbxBrZtzGG",
    //     "fee": 1200,
    //     "refunded": false
    // }

    // Check if payment is completed and details match
    if (
      paymentInfo?.status !== "Completed" ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete information",
        paymentInfo,
      });
    }
    console.log(purchase_order_id, amount)
    // Check if payment done in valid item
    const purchasedItemData = await Reservation.findOne({
      _id: purchase_order_id,
      total: Number(amount / 100),
    });
    console.log(purchasedItemData)

    if (!purchasedItemData) {
      return res.status(400).send({
        success: false,
        message: "Reservation data not found",
      });
    }
    // updating purchase record 
    await Reservation.findByIdAndUpdate(
      purchase_order_id,
      {
        $set: {
          paymentStatus: "paid",
        },
      }
    );

    // Create a new payment record
    const paymentData = await Payment.create({
      pidx,
      transactionId: transaction_id,
      reservationId: purchase_order_id,
      amount: Number(amount / 100),
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "khalti",
      status: "success",
    });

    // Send success response
    // res.json({
    //   success: true,
    //   message: "Payment Successful",
    //   paymentData,
    // });

    // Redirect to the frontend with a success message or status
    const redirectUrl = `http://localhost:3000/#/mydashboard?message=PaymentSuccessful`;
    // const redirectUrl = `http://localhost:3000/?message=PaymentSuccessful`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error,
    });
  }

});

module.exports = router;
