const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const mongoose = require('mongoose');
const { render } = require("ejs");


// =================== DATABASE INITIALIZATION ======================= //

mongoose.connect("mongodb+srv://admin:admin@cluster0.1eryibc.mongodb.net/pollDB", {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

const quesSchema = new mongoose.Schema({
    questionUID : String,
    optionUID: String,
    questionStatement: String,
    numberOfOptions: Number,
    options: String
});

const Quiz = mongoose.model("Quiz", quesSchema);

//===================================================================== //


const app = express();
const port = process.env.PORT || 3000;

const publicDirPath = path.join(__dirname, "./public");
app.use(bodyParser.urlencoded( {extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(publicDirPath));


app.get("/", function(req, res) {
    // req -> coming from client
    // res -> it is what i want to send back to client
    res.render('index');
});

app.post("/", function(req, res) {
    console.log(req.body);

    let questionUID = crypto.randomBytes(16).toString("hex");
    let optionUID = crypto.randomBytes(16).toString("hex");
    let numberOfOptions = Object.keys(req.body).length; numberOfOptions -= 2;

    console.log(questionUID);
    console.log(optionUID);

    let options = {};

    for (const keyy in req.body) {

        if( req.body.hasOwnProperty(keyy)) {
            if(keyy === "question" || keyy === "submit") continue;
            let vall = req.body[keyy];
            options[keyy] = {};
            options[keyy].optionStatement = {};
            options[keyy].optionStatement = vall;
            options[keyy].count = {};
            options[keyy].count = 0;
        }
    }
    
    options = JSON.stringify(options);

    const quiz = new Quiz ({
        questionUID: questionUID,
        optionUID: optionUID,
        questionStatement: req.body.question,
        numberOfOptions: numberOfOptions,
        options: options
    });

    quiz.save();
    questionUID = "report/" + questionUID;
    optionUID = "poll/" + optionUID;

    res.render('shareLinks', {
        viewReportLink: questionUID,
        sharePollLink: optionUID
    })


});

app.get('/poll/*', function(req, res) {
    // console.log(req.originalUrl);
    let optionUID = req.originalUrl.slice(6);
    // console.log(optionUID);

    // render the question with options of string
    Quiz.find({optionUID: optionUID}, function(err, docs) {
        if (err) {
            console.log(err);
        } else {

            if(docs && docs.length > 0) {
                
                console.log(docs);
                option = JSON.parse(docs[0].options);
                question = docs[0].questionStatement;

                res.render('poll', {
                    option: option,
                    question: question
                });
            } else {
                res.render('msg', {
                    message : "POLL NOT FOUND"
                });
            }
            
        }
    })
});


app.post('/poll/*', async function(req, res) {
    let optionUID = req.originalUrl.slice(6);
    // console.log(req.body);

    // udate the db
    let toUpdateJson = await Quiz.findOne({optionUID: optionUID});
    toUpdateJson = JSON.parse(toUpdateJson.options);

    for (const keyy in req.body) {

        if( req.body.hasOwnProperty(keyy)) {
            let val1 = req.body[keyy];
            for(const keyyy in toUpdateJson) {
                if(keyyy === val1) {
                    toUpdateJson[keyyy].count = toUpdateJson[keyyy].count + 1;
                    
                }
            }

            let toUpdateStr = JSON.stringify(toUpdateJson);
        
            Quiz.findOneAndUpdate({optionUID: optionUID}, {options: toUpdateStr}, {new: true} ,function(err, docs) {
                if(err) {
                    console.log(err);
                }
            });


        }
    }
    res.render('msg', {
        message: "Response Submitted"
    })



});

app.get('/report/*', function(req, res) {
    let questionUID = req.originalUrl.slice(8);
    Quiz.find({questionUID: questionUID}, function(err, docs) {
        if (err) {
            console.log(err);
        } else {

            if(docs && docs.length > 0) {  
                console.log(docs);
                option = JSON.parse(docs[0].options);
                question = docs[0].questionStatement;
                // console.log(option);
                res.render('report', {
                    option: option,
                    question: question
                });
            } else {
                res.render('msg', {
                    message : "POLL NOT FOUND"
                });
            }
            
        }
    })
})

app.post('/report/*', function(req, res) {

    let questionUID = req.originalUrl.slice(8);
    // delete the record

    Quiz.deleteOne({questionUID: questionUID}, function(err) {
        if(err) {
            console.log(err);
        }
    });

    res.render('msg', {
        message: "Poll Deleted Successfully"
    });
});

app.get('*', function(req, res) {
    res.render('msg', {
        message: "404 - Page Not Found"
    });
})

app.listen(3000, function() {
    console.log("server started on port: 3000");
});
