const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: "dupquwf3j",
  api_key: "787689686637351",
  api_secret: "urlDejs4RpPnWEsS7eYorYeNbPw"
});

const mongodbUri = "mongodb+srv://EduZ3667:naobo2@englishkidsapp.hyzcoyq.mongodb.net/english-kids-app?appName=EnglishKidsApp";

async function check() {
  try {
    console.log("Checking Cloudinary...");
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'hubxanh_yle_pdf_digitalizer/',
      max_results: 10
    });
    console.log(`Found ${result.resources.length} images in Cloudinary hubxanh_yle_pdf_digitalizer/`);
    result.resources.forEach(r => console.log(r.secure_url));

    console.log("\nChecking MongoDB...");
    await mongoose.connect(mongodbUri);
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name).join(", "));
    
    const questionsCount = await db.collection("questions").countDocuments();
    console.log(`Questions in DB: ${questionsCount}`);
    
    const questions = await db.collection("questions").find({}).limit(5).toArray();
    questions.forEach(q => console.log(q.id, q.imagePath));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
