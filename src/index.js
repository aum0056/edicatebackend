import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import database from "./database/index.js";
import Subject from "./model/Subject.js";
import Openingsubject from "./model/Openingsubject.js";
import Genedcourse from "./model/GenEdCourse.js";
import Studentcourseyear from "./model/studentCourseYear.js"
import Coursedetail from "./model/CourseDetail.js"
import Ratedsubject from "./model/ratedSubject.js"
import subjectData from "./data/subjectData.json";
import CourseDetail from "./data/CourseDetail.json"
import GenEdCourse from "./data/GenEdCourse.json"
import studentCourseYear from "./data/studentCourseYear.json"
import RatedSubject from "./model/ratedSubject.js";

dotenv.config();

const app = express();
database.mongoDB(process.env.MONGO_URI);

app.use(cors());
app.use(bodyParser.json());
// app.use(async (req, res, next) => {
//   next();
// });
const validateAuthentication = async (req, res, next) => {
  const json = JSON.stringify(req.body); 
  try {
    const response = await axios.post("https://myapi.ku.th/auth/login", json, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
      },
    });
    const year = await axios.get(`https://myapi.ku.th/common/getschedule?stdStatusCode=${response.data.user.student.studentStatusCode}&campusCode=B&userType=${response.data.user.userType}`, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": response.data.accesstoken
      },
    })
    res.status(200).send({
      "x-access-token": response.data.accesstoken,
      "results": year.data.results
    });
    
  } catch (error) {
    res.status(500).send({
      code: "ldap_error",
      message: "Account " + req.body.username + " not found.",
      user: null,
    });
  }
};

const decodeToken = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);
  req.user = decoded;
  next();
};

app.post("/login", validateAuthentication, async (req, res) => {
  res.status(200).send({ message: "ok" });
});

app.get("/detail", decodeToken, async (req, res) => {
  try {
    const startYear = await Studentcourseyear.find({startYear: parseInt(req.user.idcode/100000000)})
    const detail = await axios.get(`https://myapi.ku.th/std-profile/getStdEducation?stdId=${req.user.stdid}`, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": req.headers.authorization.split(" ")[1],
      },
    });
    const studentSubject = await axios.get(`https://myapi.ku.th/std-profile/checkGrades?idcode=${req.user.idcode}`, {
      headers: {
        'Content-Type': 'application/json',
        'app-key' : 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
        'x-access-token' : req.headers.authorization.split(" ")[1],
      },
    })
    const course = await Genedcourse.find({year: startYear[0].stdCourse})
    const departmentCourse = await Coursedetail.find({year: startYear[0].stdCourse, majorCode: detail.data.results.education[0].majorCode})
    const subjectId = studentSubject.data.results.map( data => data.grade).map( data => data.map(data => data.subject_code)).flat()
    const subjects = (await Subject.find({ id: { $in: subjectId }, year: startYear[0].stdCourse})).sort((a,b) => a.id-b.id)
    res.status(200).send({ data: detail.data, subject: subjects, course: departmentCourse, genedcourse: course });
  } catch (error) {
    res.status(500).send("error");
  }
});

app.get("/image", decodeToken, async (req, res) => {
  try {
    const response = await axios.get("https://myapi.ku.th/std-profile/stdimages", {
      headers: {
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": req.headers.authorization.split(" ")[1],
      },
      responseType: 'arraybuffer'
    });
    const buffer = `data:image/jpeg;base64,${Buffer.from(response.data, 'binary').toString('base64')}`
    res.status(200).send({ image: buffer });
  } catch (error) {
    res.status(500).send('error');
}
});

app.get("/ratedsubject", decodeToken, async (req, res) => {
  try {
    if(req.user.exp > (Date.now()/1000)) {
      const subjects = await Ratedsubject.find({$and: [{group: req.query.keyword}, {semester: req.query.semester}, {academicYear: req.query.academicyear}]})
      res.status(200).send({subjects: subjects})
    }
    else res.status(500).send('token expired');
  } catch(error) {
    res.status(500).send('error')
  }
})

app.get("/addallsubject", async (req, res) => {
  subjectData.map(async (x) => {
    const subject = new Subject(x)
    await subject.save()
  })
  // const user = User.()
  // const course = await Course.find()
  res.status(200).send('complete')
});

app.get("/addsubjectopening", async (req, res) => {
  try {
    const subject = await Subject.find()
    const subjectId = [...new Set(subject.map(data => [data.id, data.year, data.group]).sort())]
    const urls = subjectId.map(data => `https://myapi.ku.th/enroll/openSubjectForEnroll?query=${data[0]}-${(data[1]%100)}&academicYear=2563&semester=2&campusCode=B&section=`)
    const SubjectsOpening = (await Promise.all(urls.map(url => axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImI2MDEwNTA0NzY3IiwidXNlcnR5cGUiOiIxIiwiaWRjb2RlIjoiNjAxMDUwNDc2NyIsInN0ZGlkIjoiMTAwNzkwIiwiZmlyc3ROYW1lRW4iOiJOb3Jhc2V0IiwiZmlyc3ROYW1lVGgiOiLguJnguKPguYDguKjguKPguKnguJDguYwiLCJ0aXRsZVRoIjoi4LiZ4Liy4LiiIiwibGFzdE5hbWVFbiI6IlBPVE9ORyIsImxhc3ROYW1lVGgiOiLguYLguJ7guJjguLTguYzguJfguK3guIciLCJpYXQiOjE2MTU5NzY4NDIsImV4cCI6MTYxNTk3ODY0Mn0.ZBUyrBhTf8-50lSGxRhhUki4BcEnnaH0LphPKmjrSKQ",
      }
    },)))).map(res => res.data.results[0])
    const subjectsOpeningAddGroup = SubjectsOpening.map((data, index) => data = {...data, ...{"group": subjectId[index][2]}, ...{"year": subjectId[index][1]}}).filter(data => Object.keys(data).length > 2).map(data => data = {"id": data.subjectCode.slice(0,8),"credit": data.maxCredit,"group": data.group, "thainame": data.subjectNameTh, "engname": data.subjectNameEn, "year": data.year })
    // subjectsOpeningAddGroup.map(async (x) => {
    //   const openingsubject = new Openingsubject(x)
    //   await openingsubject.save()
    // })
    res.status(200).send(subjectsOpeningAddGroup)
  } catch (error) {
    console.log(error)
  }
});
app.get("/addgenedcourse", async (req, res) => {
  GenEdCourse.map(async (x) => {
    const genEdCourse = new Genedcourse(x)
    await genEdCourse.save()
  })
  res.status(200).send('complete')
});
app.get("/addstudentcourseyear", async (req, res) => {
  try {
    studentCourseYear.map(async (x) => {
      const StudentCourseYear = new Studentcourseyear(x)
      await StudentCourseYear.save()
    })
    res.status(200).send('complete')
  } catch(error) {
      res.status(500).send('error')
    }
});
app.get("/test", async (req, res) => {
  try {
    const test = await Ratedsubject.find({group: "ภาษา"})
    res.status(200).send(test)
  } catch(error) {
    res.status(500).send('error')
  }
})
app.get("/addratedsubject", async (req, res) => {
  try {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImI2MDEwNTA0NzY3IiwidXNlcnR5cGUiOiIxIiwiaWRjb2RlIjoiNjAxMDUwNDc2NyIsInN0ZGlkIjoiMTAwNzkwIiwiZmlyc3ROYW1lRW4iOiJOb3Jhc2V0IiwiZmlyc3ROYW1lVGgiOiLguJnguKPguYDguKjguKPguKnguJDguYwiLCJsYXN0TmFtZUVuIjoiUE9UT05HIiwibGFzdE5hbWVUaCI6IuC5guC4nuC4mOC4tOC5jOC4l-C4reC4hyIsInRpdGxlVGgiOiLguJnguLLguKIiLCJyb2xlSWQiOm51bGwsImlhdCI6MTYxNjMyMDU2MywiZXhwIjoxNjE2MzIyMzYzfQ.RR-z6_LMzmRLGaPP_xEreIe7JSlYEOJrhCzn9WvJFyw"
    const openingsubjects = await Openingsubject.find()
    const openingUrls = openingsubjects.map(data => `https://myapi.ku.th/enroll/searchSubjectOpenEnr?query=${data.id}`)
    const subjectsOpeningId = (await Promise.all(openingUrls.map(url => axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": token,
      }
    },)))).map(res => res.data).map(data => data.subjects.map(data => data.subjectCode)).flat()
    const uniqueSubjectsOpeningId = [...new Set(subjectsOpeningId)]
    const secOpeningUrls = uniqueSubjectsOpeningId.map(id => `https://myapi.ku.th/enroll/openSubjectForEnroll?query=${id}&academicYear=2563&semester=2&campusCode=B&section=`)
    const searchSecOpening = (await Promise.all(secOpeningUrls.map(url => axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": token,
      }
    },)))).map(res => res.data).map(data => data.results).map(result => result.map(data => [{id: data.subjectCode.slice(0,8), totalRegistered: data.totalRegistered}]))
    const setSecOpening = searchSecOpening.flat(2)
    const sumRegistered = Array.from(setSecOpening.reduce(
      (m, {id, totalRegistered}) => m.set(id, (m.get(id) || 0) + totalRegistered), new Map
    ), ([id, totalRegistered]) => ({id, totalRegistered}))
    const dataForMerge = sumRegistered.map( id => openingsubjects.filter(data => data.id === id.id).sort((a,b) => b.year-a.year))
    const removeSameId = dataForMerge.map(dataForMerge => dataForMerge[0])
    const addTotalRegistered = removeSameId.map((data,index) => Object.assign(data.toObject(), {totalRegistered: sumRegistered[index].totalRegistered})).sort((a,b) => b.totalRegistered-a.totalRegistered)
    const ratedByGroup = [...new Set(addTotalRegistered.map(data => data.group))]
    let ratedSubjects = ratedByGroup.map(group => group = {academicYear: 2563, semester: 2, group: group, subjects: addTotalRegistered.filter(data => data.group === group)})
    // ratedSubjects.map(async (x) => {
    //   const Ratedsubjects = new Ratedsubject(x)
    //   await Ratedsubjects.save()
    // })
    res.status(200).send('complete')
  } catch(error) {
    res.status(500).send('error')
  }
});

app.get("/addcoursedetail", async (req,res) => {
  CourseDetail.map(async (x) => {
    const CourseDetail = new Coursedetail(x)
    await CourseDetail.save()
  })
res.status(200).send('complete')
})

app.get("/search", decodeToken, async (req, res, next) => {
  try {
    if(req.user.exp > (Date.now()/1000))  {
      const startYear = await Studentcourseyear.find({startYear: parseInt(req.user.idcode/100000000)})
      const openingsubject = await Openingsubject.find({$and: [{$or: [{ id: { $regex: req.query.keyword }}, { thainame :{ $regex : req.query.keyword }}, { engname :{ $regex : req.query.keyword, $options: "i" }}]},{year: startYear[0].stdCourse}]})
      const openingsubjects = openingsubject.sort((a,b) => a.id-b.id)
      res.status(200).send(openingsubjects)
    }
    else res.status(500).send('token expired');
  } catch (error) {
    res.status(500).send('error');
  }
})

app.get("/searchbygroup", decodeToken, async (req, res) => {
  try {
    if(req.user.exp > (Date.now()/1000))  {
      const openingsubject = await Openingsubject.find({group: req.query.keyword})
      const openingsubjects = openingsubject.sort((a,b) => a.id-b.id)
      res.status(200).send(openingsubjects);
    }
    else res.status(500).send('token expired');
  } catch (error) {
    res.status(500).send('error');
  }
})

app.get("/genedcourse", decodeToken, async (req, res) => {
  try {
    const startYear = await Studentcourseyear.find({startYear: parseInt(req.user.idcode/100000000)})
    const course = await Genedcourse.find({year: startYear[0].stdCourse})
    res.status(200).send(course)
  } catch (error) {
    res.status(500).send('error');
  }
})


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
