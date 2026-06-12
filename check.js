const mongoose = require("mongoose");

let mongodbUri = "mongodb+srv://EduZ3667:naobo2@englishkidsapp.hyzcoyq.mongodb.net/english-kids-app?appName=EnglishKidsApp";
require("dotenv").config({ path: ".env.local" });
if (process.env.MONGODB_URI) mongodbUri = process.env.MONGODB_URI;

mongoose.connect(mongodbUri).then(async () => {
  const usersCount = await mongoose.connection.collection("users").countDocuments();
  const resultsCount = await mongoose.connection.collection("assessmentresults").countDocuments();
  console.log("Users:", usersCount);
  console.log("Results:", resultsCount);
  
  const sampleUser = await mongoose.connection.collection("users").findOne();
  console.log("Sample User ID Type:", typeof sampleUser._id, sampleUser._id);
  
  const sampleResult = await mongoose.connection.collection("assessmentresults").findOne();
  console.log("Sample Result User ID:", sampleResult.userId, "Type:", typeof sampleResult.userId);
  
  mongoose.disconnect();
});
