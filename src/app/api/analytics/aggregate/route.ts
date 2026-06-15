import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Ensure User model is registered before we use $lookup
    if (!mongoose.models.User) {
      mongoose.model('User', User.schema);
    }

    const { searchParams } = new URL(req.url);
    const groupBy = searchParams.get("groupBy"); // "class" | "school" | "student"
    const studentId = searchParams.get("studentId");
    const school = searchParams.get("school");
    const className = searchParams.get("className");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build base match stage for AssessmentResult based on date
    const dateMatch: any = {};
    if (from || to) {
      dateMatch.createdAt = {};
      if (from) dateMatch.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateMatch.createdAt.$lte = toDate;
      }
    }

    // Lookup users to filter by school/class and get their info
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

    const unwindStage = {
      $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: false }
    };

    // Filter by school / class if provided
    const userMatchStage: any = { $match: {} };
    if (school) userMatchStage.$match["userInfo.schoolName"] = school;
    if (className) userMatchStage.$match["userInfo.className"] = className;
    if (studentId) userMatchStage.$match["userId"] = studentId;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    let pipeline: any[] = [];

    // Grouping logic based on groupBy parameter
    if (groupBy === "school" || groupBy === "class") {
      const groupField = groupBy === "school" ? "$userInfo.schoolName" : "$userInfo.className";
      
      pipeline = [
        { $match: dateMatch },
        lookupStage,
        unwindStage,
        userMatchStage,
        {
          $group: {
            _id: { groupName: groupField, skill: "$skill" },
            avgScore: { $avg: "$score" }
          }
        },
        {
          $group: {
            _id: "$_id.groupName",
            skills: {
              $push: { k: { $toLower: "$_id.skill" }, v: "$avgScore" }
            }
          }
        },
        {
          $project: {
            _id: 0,
            label: "$_id",
            values: { $arrayToObject: "$skills" }
          }
        },
        { $sort: { label: 1 } }
      ];
      
    } else if (groupBy === "student") {
      // For student, we want to group by Date (day) and skill
      pipeline = [
        { $match: dateMatch },
        lookupStage,
        unwindStage,
        userMatchStage,
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              skill: "$skill"
            },
            avgScore: { $avg: "$score" }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            skills: {
              $push: { k: { $toLower: "$_id.skill" }, v: "$avgScore" }
            }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            scores: { $arrayToObject: "$skills" }
          }
        },
        { $sort: { date: 1 } }
      ];
    } else {
      // Summary mode: Top level stats + Paginated Top students using $facet
      const searchMatchStage = search 
        ? [{ $match: { name: { $regex: search, $options: "i" } } }] 
        : [];

      const summaryPipeline = [
        { $match: dateMatch },
        lookupStage,
        unwindStage,
        userMatchStage,
        {
          $group: {
            _id: "$userId",
            name: { $first: "$userInfo.name" },
            school: { $first: "$userInfo.schoolName" },
            className: { $first: "$userInfo.className" },
            avgScore: { $avg: "$score" },
            testsTaken: { $sum: 1 }
          }
        },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalStudents: { $sum: 1 },
                  totalTests: { $sum: "$testsTaken" },
                  sumAvgScore: { $sum: "$avgScore" }
                }
              }
            ],
            studentsList: [
              ...searchMatchStage,
              { $sort: { avgScore: -1 } },
              { $skip: skip },
              { $limit: limit + 1 }
            ]
          }
        }
      ];

      const facetResult = await AssessmentResult.aggregate(summaryPipeline);
      const resultData = facetResult[0];

      const stats = resultData.stats[0] || { totalStudents: 0, totalTests: 0, sumAvgScore: 0 };
      const avgOverallScore = stats.totalStudents > 0 ? stats.sumAvgScore / stats.totalStudents : 0;

      const fetchedStudents = resultData.studentsList || [];
      const hasMore = fetchedStudents.length > limit;
      const studentsToReturn = hasMore ? fetchedStudents.slice(0, limit) : fetchedStudents;

      return NextResponse.json({
        success: true,
        hasMore,
        summary: {
          totalStudents: stats.totalStudents,
          totalTests: stats.totalTests,
          avgOverallScore: Math.round(avgOverallScore),
          topStudents: studentsToReturn.map((r: any) => ({
            id: r._id,
            name: r.name,
            school: r.school,
            className: r.className,
            score: Math.round(r.avgScore),
            testsTaken: r.testsTaken
          }))
        }
      });
    }

    const data = await AssessmentResult.aggregate(pipeline);

    // Format output based on grouping
    if (groupBy === "school" || groupBy === "class") {
      // Map missing skills to 0
      const formattedData = data.map(item => ({
        label: item.label || "Chưa phân loại",
        values: {
          speaking: item.values.speaking || 0,
          listening: item.values.listening || 0,
          reading: item.values.reading || 0,
          writing: item.values.writing || 0,
        }
      }));
      return NextResponse.json({ success: true, data: formattedData });
      
    } else if (groupBy === "student") {
      // Flatten the scores object into the main object
      const formattedData = data.map(item => ({
        date: item.date,
        speaking: item.scores.speaking || 0,
        listening: item.scores.listening || 0,
        reading: item.scores.reading || 0,
        writing: item.scores.writing || 0,
      }));
      
      return NextResponse.json({ success: true, data: formattedData });
    }

  } catch (error) {
    console.error("Lỗi API aggregate:", error);
    return NextResponse.json({ success: false, error: "Failed to aggregate data" }, { status: 500 });
  }
}
