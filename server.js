const data = require("./data-service.js");
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const bodyParser = require('body-parser');
const exphbs = require("express-handlebars");
const dataServiceAuth = require("./data-service-auth.js");
const clientSessions = require('client-sessions');

const HTTP_PORT = process.env.PORT || 8080;
var fs = require("fs");

function onHttpStart(){
    console.log("Express http server listening on " + HTTP_PORT);
}

const storage = multer.diskStorage({
    destination: "./public/images/uploaded/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({storage:storage});

app.use(express.static('public'));

// Setup client-sessions
app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "not-so-guessable-string", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 60 * 1000 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next){
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next){
    if (!req.session.user){
        res.redirect("/login");
    } else {
        next();
    }
}

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req,res,next) => {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/,"");
    next();
})

app.engine('.hbs', exphbs({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active"': "") +
            '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },

        equal: function(lvalue, rvalue, options){
            if(arguments.length < 3)
                throw new error("Handlebars Helper equal needs 2 parameters");
            if(lvalue != rvalue){
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));

app.set('view engine', '.hbs');

app.get("/", function(req, res){
    res.render('home');
});

app.get("/about", function(req, res){
    res.render('about');
});

app.get("/login", function(req, res){
    res.render('login');
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then(function(user){
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        
        res.redirect('/employees');
    })
    .catch((err) => {
        res.render('login', {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body)
    .then(function(){
        res.render('register', {successMessage: "User created"});
    })
    .catch(function(err){
        res.render('register', {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/logout", function(req, res){
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) =>{
    res.render('userHistory');
});

app.get("/employees/add", ensureLogin, function(req, res){
    data.getDepartments()
    .then(function(data){
        res.render('addEmployee', {departments:data});
    })
    .catch(function(){
        res.render('addEmployee', {departments:[]});
    });
});

app.post("/employees/add", ensureLogin, (req,res) => {
    data.addEmployee(req.body)
    .then(function(){
        res.redirect("/employees");
    })
    .catch(function(msg){
        res.status(500).send(msg);
    });
});

app.post("/employee/update", ensureLogin, (req,res) => {
    data.updateEmployee(req.body)
    .then(function(value){
        res.redirect("/employees");
    })
    .catch(function(msg){
        res.status(500).send(msg);
    });
});

app.get("/employees", ensureLogin, (req, res) => {
    
    if(req.query.department){
    data.getEmployeesByDepartment(req.query.department)
    .then(function(value){
        res.render('employees', {data : value});
    })
    .catch(function(msg){
        res.render('employees', {message : msg});
    });
    } else if (req.query.status){
        data.getEmployeeByStatus(req.query.status)
        .then(function(value){
            res.render('employees', {data : value});
        })
        .catch(function(msg){
            res.render('employees', {message : msg});
        });
    } else if (req.query.manager){
        data.getEmployeesByManager(req.query.manager)
        .then(function(value){
            res.render('employees', {data : value});
        })
        .catch(function(msg){
            res.render('employees', {message : msg});
        });
    }
    else {
        data.getAllEmployees()
        .then(function(value){
            if(value.length > 0){
                res.render('employees', {data : value});
            }
            else{
                res.render('employees', {message : "No results returned"});
            }
        })
        .catch(function(msg){
            res.render('employees', {message : msg});
        });
    }
});

app.get("/employee/:empNum", ensureLogin, (req,res) => {
        // initialize an empty object to store the values
    let viewData = {};

    data.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error 
    }).then(data.getDepartments)
    .then((data) => {
        viewData.departments = data; // store department data in the "viewData" object as "departments"
    
        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching 
        // viewData.departments object
    
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }
    
    }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
            res.status(404).send("Employee Not Found");
        } else {
            res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });  
});

app.get("/employees/delete/:empNum", ensureLogin, function(req,res){
    data.deleteEmployeeByNum(req.params.empNum)
    .then(function(){
        res.redirect("/employees");
    })
    .catch(function(){
        res.status(500).send("Unable to Remove Employee / Employee not found");
    })
});

app.get("/departments", ensureLogin, (req, res) => {
    data.getDepartments()
    .then(function(value){
        if(value.length > 0){
            res.render("departments", {data : value});
        } else {
            res.render("departments", {message : "No results returned"});
        }  
    })
    .catch((msg) => {
        res.render("departments", {message : msg});
    });
});

app.get("/departments/add", ensureLogin, function(req, res){
    res.render('addDepartment');
});

app.post("/departments/add", ensureLogin, (req,res) => {
    data.addDepartment(req.body)
    .then(function(){
        res.redirect("/departments");
    })
    .catch(function(msg){
        res.send(msg);
    });
});

app.post("/department/update", ensureLogin, (req,res) => {
    data.updateDepartment(req.body)
    .then(function(value){
        res.redirect("/departments");
    })
    .catch(function(msg){
        res.send(msg);
    });
});

app.get("/department/:value", ensureLogin, (req,res) => {
    data.getDepartmentById(req.params.value)
    .then(function(value){
        if(value != undefined){
            res.render("department", {department : value});
        } else{
            res.status(404).send("Department Not Found");
        }
    })
    .catch(function(msg){
        res.status(404).send("Department Not Found");
    });
});

app.get("/managers", ensureLogin, (req, res) => {
    data.getManagers()
    .then((value) => {
        if(value.length > 0){
            res.render("employees", {data : value});
        } else {
            res.render("employees", {message : "No results returned"});
        }
    })
    .catch((msg) => {
        res.render("employees", {message : msg});
    })
});

app.get("/images/add", ensureLogin, function(req, res){
    res.render('addImage');
});

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req,res) => {
    res.redirect("/images");
});

app.get("/images", ensureLogin, (req,res) => {
    fs.readdir("./public/images/uploaded", (err, items) => {
        res.render('images',{data : items});
        })
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

data.initialize()
.then(dataServiceAuth.initialize)
.then(app.listen(HTTP_PORT, onHttpStart))
.catch((msg) => {console.log(msg);});