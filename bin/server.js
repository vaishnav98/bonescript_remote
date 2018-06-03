#!/usr/bin/env node

var rl = require('readline');
var fs = require('fs');
var winston = require('winston');
var shell = require('shelljs');
var configFilePath = '/usr/local/lib/node_modules/bonescript/src/remote_config.json';
var obj = {};
var args = process.argv;
args.splice(0, 2);
var options = args.toString();

var debug = process.env.DEBUG ? true : false;

var restartServer = function () {
    console.log('Restarting BoneScript Service');
    shell.exec('sudo systemctl stop bonescript.service', {
        silent: true
    });
    shell.exec('sudo systemctl start bonescript.service', {
        silent: true
    });
    console.log('BoneScript Service Restarted');
}

switch (options) {
case 'enable':
    obj.enableRemote = true;
    break;
case 'disable':
    obj.enableRemote = false;
    if (fs.existsSync(configFilePath)) {
        if (debug) winston.debug('disabling remote bonescript')
        fs.unlinkSync(configFilePath);
        restartServer();
        process.exit(-1);
    } else {
        console.log("Error : Config File not found");
        process.exit(-1);
    }
    break;
default:
    console.log('Usage : remote_bonescript enable (or) remote_bonescript disable');
    process.exit(-1);
    break;
}

var read = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});
read.question("Enter username : ", function (answer) {
    if (answer.length == 0) {
        console.log('Please Enter valid username');
        process.exit(-1);
    }
    obj.username = answer;
    onReadUser();
});

var onReadUser = function () {
    read.question("Enter password : ", function (answer) {
        if (answer.length < 8) {
            console.log('Password length should be atleast 8 characters');
            process.exit(-1);
        }
        obj.password = answer;
        onReadPassword();
    });
}

var onReadPassword = function () {
    read.question("Do yo want to set up https server ('yes' or 'no'): ", function (answer) {
        switch (answer) {
        case 'yes':
            obj.enableHTTPS = true;
            readSSlkey();
            break;
        case 'no':
            obj.enableHTTPS = false;
            read.close();
            onReadServerOptions();
            break;
        default:
            console.log('Only yes or no is accepted as an answer');
            process.exit(-1);
            break;
        }
    });
}

var onReadSSLcert = function () {
    read.question("Enter the passphrase for the SSL certificate : ", function (answer) {
        read.close();
        if (answer.length != 0) {
            obj.SSLpassphrase = answer;
            onReadServerOptions();
        } else {
            console.log('Please enter a valid passphrase');
            process.exit(-1);
        }
    });

}

var onReadSSLkey = function () {
    read.question("Enter the path to the SSL .cert file: ", function (answer) {
        if (fs.existsSync(answer)) {
            obj.SSLcert = fs.readFileSync(answer).toString();
            onReadSSLcert();
        } else {
            console.log('SSL cert does not exist at ' + answer);
            process.exit(-1);
        }
    });
}

var readSSlkey = function () {
    read.question("Enter the path to the SSL .key file: ", function (answer) {
        if (fs.existsSync(answer)) {
            obj.SSLkey = fs.readFileSync(answer).toString();
            onReadSSLkey();
        } else {
            console.log('SSL key does not exist at ' + answer);
            process.exit(-1);
        }
    });
}

var onReadServerOptions = function () {
    if (debug) winston.debug('enabling remote bonescript')
    var remoteConfigExists = fs.existsSync(configFilePath);
    var json = JSON.stringify(obj);
    if (remoteConfigExists)
        console.log('Remote BoneScript config file exists, overwriting ...');
    fs.writeFileSync(configFilePath, json, 'utf8');
    restartServer();
}