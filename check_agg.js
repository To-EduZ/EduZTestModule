const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://EduZ3667:naobo2@englishkidsapp.hyzcoyq.mongodb.net/english-kids-app?appName=EnglishKidsApp").then(async () => {
  const AssessmentResult = mongoose.connection.collection("assessmentresults");
  const lookupStage = {
      $lookup: {
        from: "users",
        let: { userIdStr: "$userId" },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $eq: [ { $toString: "$_id" }, "$$userIdStr" ] 
              } 
            } 
          }
        ],
        as: "userInfo",
      }
  };
  const results = await AssessmentResult.aggregate([
    lookupStage,
    { $limit: 1 }
  ]).toArray();
  
  console.log(JSON.stringify(results[0], null, 2));
  process.exit(0);
});
