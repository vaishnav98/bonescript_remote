#!/usr/bin/env node

var rl = require('readline');
var fs = require('fs');
var main = require('../index');
var username, password, isHTTPS, address, password;
var configFilePath = '../config.json';
var configExists = false;
var targetDetails = {};
var obj = {};
var configWritepath;
var read = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});
try {
    config = require('../config.json');
    username = config.username;
    password = config.password;
    targetDetails.isHTTPS = config.isHTTPS;
    targetDetails.address = config.address;
    targetDetails.port = config.port;
    password = config.password;
    configExists = true;
} catch (ex) {
    configExists = false;
}

var args = process.argv;
var options = process.argv[2];
var filepath = process.argv[3];
var flags = process.argv[4];


var configureOptions = function () {

    read.question("Enter path to write config file (press enter to choose default : /usr/local/lib/node_modules/bonescript_remote/) : ", function (answer) {
        if (answer.length == 0) {
            configWritepath = '/usr/lib/node_modules/bonescript_remote/config.json';
        } else
            configWritepath = answer;
        onReadpath();
    });

    var onReadpath = function () {
        read.question("Enter username : ", function (answer) {
            if (answer.length < 1) {
                console.log('Enter a valid username');
                process.exit(-1);
            }
            obj.username = answer;
            onReadUser();
        });
    }

    var onReadUser = function () {
        read.question("Enter password : ", function (answer) {
            if (answer.length < 8) {
                console.log('Password length is always > 8 characters');
                process.exit(-1);
            }
            obj.password = answer;
            onReadPass();
        });
    }

    var onReadPass = function () {
        read.question("is HTTPS enabled on the server ? (yes or no): ", function (answer) {

            obj.isHTTPS = (answer == 'yes');
            onReadHTTPS();
        });
    }

    var onReadHTTPS = function () {
        read.question("Enter address (press enter to choose default : 192.168.7.2) : ", function (answer) {
            if (answer.length == 0) {
                obj.address = '192.168.7.2';
            } else
                obj.address = answer;
            onReadAddress();
        });
    }
    var onReadAddress = function () {
        read.question("Enter port number (press enter to choose default : 80) : ", function (answer) {
            if (answer.length == 0) {
                obj.port = '80';
            } else
                obj.port = answer;
            onReadPort();
        });

    }

    var onReadPort = function () {
        var json = JSON.stringify(obj);
        if (configExists)
            console.log('config file exists, overwriting ...');
        fs.writeFileSync(configWritepath, json, 'utf8');
        read.close();
    }
}
switch (options) {
case 'config':
    configureOptions();
    break;
case 'upload':
    if (fs.existsSync(filepath) && configExists)
        main.runRemoteModule(username, password, filepath, targetDetails)
    else {
        if (!fs.existsSync(filepath)) {
            console.log('file does not exist : for upload the usage is remotebone_client upload app.js')
            process.exit(-1);
        }
       if (!configExists) {
           if(flags == '-u' || flags == '-unsecure'){
                if (fs.existsSync(filepath))
                     main.runRemoteModule(null,null, filepath, {"isHTTPS":false,"address":"192.168.7.2","port":"80"});
             }
            else {
                console.log('configuration file does not exist!');
                configureOptions();
            }
        }
    }
    break;
default:
    console.log('Usage : remotebone_client config (or) remote_bone upload app.js');
    process.exit(-1);
    break;
}
