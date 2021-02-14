import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import jwt from "jsonwebtoken";
import database from "./database";
import Subject from "./model/Subject";
import Openingsubject from "./model/Openingsubject";
import Genedcourse from "./model/GenEdCourse"
import Coursedetail from "./model/CourseDetail"
import subjectData from "./data/subjectData.json";
import CourseDetail from "./data/CourseDetail.json"
import GenEdCourse from "./data/GenEdCourse.json"

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
    res.status(200).send({
      "x-access-token": response.data.accesstoken,
    });
    // console.log(response.data);
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

app.post("/detail", decodeToken, async (req, res) => {
  const startYear = parseInt(req.user.idcode/100000000);
  let studentYear = (startYear >= 60) ? 2559 : 2555
  try {
    const detail = await axios.get(
      `https://myapi.ku.th/std-profile/getStdEducation?stdId=`.concat(
        req.user.stdid
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
          "x-access-token": req.headers.authorization.split(" ")[1],
        },
      }
    );
    const path = 'https://myapi.ku.th/std-profile/checkGrades?idcode='.concat(req.user.idcode)
    const studentSubject = await axios.get(path, {
    headers: {
      'Content-Type': 'application/json',
      'app-key' : 'txCR5732xYYWDGdd49M3R19o1OVwdRFc',
      'x-access-token' : req.headers.authorization.split(" ")[1],
      },
    })
    const subjectId = studentSubject.data.results.map( data => data.grade).map( data => data.map(data => data.subject_code)).flat()
    const subjects = (await Promise.all(subjectId.map(id => Subject.findOne({id, year: studentYear})))).filter(subject => !!subject)
    res.status(200).send({ data: detail.data, baseDetail: req.user, subject: subjects });
  } catch (error) {
    res.status(500).send("error");
  }
});

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
    const urls = subjectId.map(data => "https://myapi.ku.th/enroll/openSubjectForEnroll?query="+data[0]+"-"+(data[1]%100)+"&academicYear=2563&semester=2&campusCode=B&section=")
    const SubjectsOpening = (await Promise.all(urls.map(url => axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "app-key": "txCR5732xYYWDGdd49M3R19o1OVwdRFc",
        "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImI2MDEwNTA0NzY3IiwidXNlcnR5cGUiOiIxIiwiaWRjb2RlIjoiNjAxMDUwNDc2NyIsInN0ZGlkIjoiMTAwNzkwIiwiZmlyc3ROYW1lRW4iOiJOb3Jhc2V0IiwiZmlyc3ROYW1lVGgiOiLguJnguKPguYDguKjguKPguKnguJDguYwiLCJsYXN0TmFtZUVuIjoiUE9UT05HIiwibGFzdE5hbWVUaCI6IuC5guC4nuC4mOC4tOC5jOC4l-C4reC4hyIsInRpdGxlVGgiOiLguJnguLLguKIiLCJyb2xlSWQiOm51bGwsImlhdCI6MTYxMjgyMTIwNSwiZXhwIjoxNjEyODIzMDA1fQ.dmHzpVKRyxaNtZfAWq0UXOhsaqE5M_ooMGFM9xEppAI",
      }
    },)))).map(res => res.data.results[0])
    const subjectsOpeningAddGroup = SubjectsOpening.map((data, index) => data = {...data, ...{"group": subjectId[index][2]}, ...{"year": subjectId[index][1]}}).filter(data => Object.keys(data).length > 2).map(data => data = {"id": data.subjectCode.slice(0,8),"credit": data.maxCredit,"group": data.group, "thainame": data.subjectNameTh, "engname": data.subjectNameEn, "year": data.year })
    subjectsOpeningAddGroup.map(async (x) => {
      const openingsubject = new Openingsubject(x)
      await openingsubject.save()
    })
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
app.get("/test", async (req, res) => {
  // const subject = Subject.()
  // const openingsubject = await Openingsubject.find({id : /^01001/})
  // console.log(openingsubject)
  const course = await Genedcourse.find({year: 2559})
  console.log(course)
  const test = GenEdCourse
  res.status(200).send(test)
});

app.get("/addcoursedetail", async (req,res) => {
  CourseDetail.map(async (x) => {
    const CourseDetail = new Coursedetail(x)
    await CourseDetail.save()
  })
res.status(200).send('complete')
})

app.post("/search", decodeToken, async (req, res) => {
  try {
    const startYear = parseInt(req.user.idcode/100000000);
    let studentYear = (startYear >= 60) ? 2559 : 2555
    const openingsubject = await Openingsubject.find({$and: [{$or: [{ id: { $regex: req.body.subjectCode }}, { thainame :{ $regex : req.body.subjectCode }}, { engname :{ $regex : req.body.subjectCode, $options: "i" }}]},{year: studentYear}]})
    res.status(200).send(openingsubject)
  } catch (error) {
    res.status(500).send('error');
  }
})

app.post("/searchbygroup", async (req, res) => {
  try {
    const openingsubject = await Openingsubject.find({group: req.body.subjectGroup})
    res.status(200).send(openingsubject);
  } catch (error) {
    res.status(500).send('error');
  }
})

app.post("/genedcourse", decodeToken, async (req, res) => {
  try {
    const startYear = parseInt(req.user.idcode/100000000);
    let studentYear = (startYear >= 60) ? 2559 : 2555
    const course = await Genedcourse.find({year: studentYear})
    res.status(200).send(course)
  } catch (error) {
    res.status(500).send('error');
  }
})


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
