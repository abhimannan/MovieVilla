let Movie = require("../models/movies.js");
let User = require("../models/user.js"); // assuming your user model file is named user.js

const mongoose = require('mongoose');

main()
  .then(() => {
    console.log("DB is connected!!");
  })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/movieVilla');
}

let data = [
  {
    title: "Ss",
    imageURL: {
      url: "https://www.mamm.au/img/front/our_work_movies.jpg",
      filename: "filename",
    },
    director: "ef",
    rating: 5,
    hero: "dsf",
  },
  {
    title: "Ss",
    imageURL: {
      url: "https://www.mamm.au/img/front/our_work_movies.jpg",
      filename: "filename",
    },
    director: "ef",
    rating: 5,
    hero: "dsf",
  },
  {
    title: "Ss",
    imageURL: {
      url: "https://www.mamm.au/img/front/our_work_movies.jpg",
      filename: "filename",
    },
    director: "ef",
    rating: 5,
    hero: "dsf",
  },
  {
    title: "Ss",
    imageURL: {
      url: "https://www.mamm.au/img/front/our_work_movies.jpg",
      filename: "filename",
    },
    director: "ef",
    rating: 5,
    hero: "dsf",
  },
  {
    title: "Ss",
    imageURL: {
      url: "https://www.mamm.au/img/front/our_work_movies.jpg",
      filename: "filename",
    },
    director: "ef",
    rating: 5,
    hero: "dsf",
  }
];

let initDb = async () => {
  await Movie.deleteMany({});
  await User.deleteMany({});

  // Step 1: create a test user
  let user = new User({
    email: "test@example.com",
    username: "testuser"
  });
  await user.save();

  // Step 2: Add the user._id to each movie
  let updatedData = data.map((obj) => ({
    ...obj,
    owner: user._id
  }));

  // Step 3: Insert the updated data
  await Movie.insertMany(updatedData);
  console.log("Data Was Initialized!!");
};

initDb();
