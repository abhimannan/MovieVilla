let mongoose = require("mongoose");
const { Schema } = mongoose;
let Review = require("./review.js");
const { string } = require("joi");

const movieSchema = new Schema({
  title : {
    type : String,
  },
  imageURL : {
    url : String,
    filename : String,
  },
  director : {
    type : String,
  },
  rating : {
    type : Number,
  },
  hero : {
    type : String,
  },
  reviews : [
    {
    type : Schema.Types.ObjectId,
    ref : "Review",
  }
  ],
  owner :
    {
      type : Schema.Types.ObjectId,
      ref : "User",
    }
});

// after delete the movie the reviews under that are also deleted
// post middleware : it automatically call when an movie is deleted
movieSchema.post("findOneAndDelete",async(movieData)=>{
  // console.log(movieData);
  if(movieData) {
      await Review.deleteMany({_id : {$in : movieData.reviews}});
  }
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports =  Movie;
