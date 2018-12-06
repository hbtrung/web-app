const Sequelize = require('sequelize');
// var employees = [];
// var departments = [];

// var fs = require('fs');

var sequelize = new Sequelize('d7kaq3m4jic3e','bdonraqrzifsun','88311c967f1c4d4bad3ca1f29b8a1ab395b24102def2afbc6d15677e787d817c',{
    host: 'ec2-54-243-235-153.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions:{
        ssl:true
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addresCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

module.exports.initialize = function(){
    return new Promise(function(resolve, reject){
        sequelize.sync()
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject("unable to sync the database");
        });
    });
}

module.exports.getAllEmployees = function(){
    return new Promise(function(resolve, reject){
        Employee.findAll()
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });

}

module.exports.getManagers = function(){
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                isManager: true
            }
        })
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getDepartments = function(){
    return new Promise(function(resolve, reject){
        Department.findAll()
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getEmployeeByStatus = function(status){
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                status: status
            }
        })
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByDepartment = function(department){
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                department: department
            }
        })
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getEmployeesByManager = function(manager){
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                employeeManagerNum: manager
            }
        })
        .then(function(data){
            resolve(data);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getEmployeeByNum = function(value){
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                employeeNum: value
            }
        })
        .then(function(data){
            resolve(data[0]);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.getDepartmentById = function(id){
    return new Promise(function(resolve, reject){
        Department.findAll({
            where: {
                departmentId: id
            }
        })
        .then(function(data){
            resolve(data[0]);
        })
        .catch(function(){
            reject("no results returned");
        });
    });
}

module.exports.addEmployee = function(employeeData){
    return new Promise(function(resolve, reject){
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (var prop in employeeData){
            if(employeeData[prop] == ""){
                employeeData[prop] = null;
            }
        }
        Employee.create(employeeData)
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject("unable to create employee");
        });
    });
}

module.exports.updateEmployee = function(empData){
    return new Promise(function(resolve, reject){
        empData.isManager = (empData.isManager) ? true : false;
        for (var prop in empData){
            if(empData[prop] == ""){
                empData[prop] = null;
            }
        }
        Employee.update(
            empData,
            {
                where: {
                    employeeNum: empData.employeeNum
            }}
        )
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject("unable to update employee");
        });
    });
}

module.exports.deleteEmployeeByNum = function(empNum){
    return new Promise(function(resolve, reject){
        Employee.destroy({
            where: {
                employeeNum: empNum
            }}
        )
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject();
        });
    });
}

module.exports.addDepartment = function(departmentData){
    return new Promise(function(resolve, reject){
        for (var prop in departmentData){
            if(departmentData[prop] == ""){
                departmentData[prop] = null;
            }
        }
        Department.create(departmentData)
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject("unable to create department");
        });
    });
}

module.exports.updateDepartment = function(departmentData){
    return new Promise(function(resolve, reject){
        for (var prop in departmentData){
            if(departmentData[prop] == ""){
                departmentData[prop] = null;
            }
        }
        Department.update(
            departmentData,
            {
                where: {
                    departmentId: departmentData.departmentId
            }}
        )
        .then(function(){
            resolve();
        })
        .catch(function(){
            reject("unable to update department");
        });
    });
}