let mongoose = require('mongoose');
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  description: {
    type : String,
    required : true,
  },
  rating: {
    type : Number,
    required : true,
  },
  createdAt : {
    type : Date,
    default : Date.now,
  },
  author : {
    type : Schema.Types.ObjectId,
    ref : "User",
  }
});

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
