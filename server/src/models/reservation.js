const mongoose = require('mongoose');

const { Schema } = mongoose;
const reservationSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  startAt: {
    type: String,
    required: true,
    trim: true,
  },
  seats: {
    type: [Schema.Types.Mixed],
    required: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  movieId: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  cinemaId: {
    type: Schema.Types.ObjectId,
    ref: 'Cinema',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  checkin: {
    type: Boolean,
    default: false,
  },
  // new code
  paymentStatus: {
    type: String,
    enum: ["paid", "pending"],
    default: "pending",
  },
  pidx: {
    type: String,
    default: "",
  },
  transactionId: {
    type: String,
    default: "",
  }
  //new code end
},
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
