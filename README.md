# Command Line Utility for BoneScript remote upload
*draft version 

Usage : Client side 

if no setup done on server side
```
git clone https://github.com/vaishnav98/bonescript_remote.git
sudo npm install -g ./bonescript_remote
(for running app.js script on board)
remotebone_client upload /path/to/app.js -u
(or)
remotebone_client upload /path/to/app.js -unsecure
```
if secure upload enabled on server side
```
git clone https://github.com/vaishnav98/bonescript_remote.git
sudo npm install -g ./bonescript_remote
(configuration)
remotebone_client config
//Enter config details :
//enter full path for config file : example /usr/local/lib/node_modules/bonescript_remote/config.json
(for running app.js script on board)
remotebone_client upload /path/to/app.js
```
Usage : server side[on beaglebone] (server side setup not compulsory , only for security)

```
update to this version of BoneScript
https://github.com/vaishnav98/bonescript/tree/remote-upload

git clone https://github.com/vaishnav98/bonescript_remote.git
sudo npm install -g ./bonescript_remote
(configuration)
remotebone_server enable
//Enter config details :
(for disabling remote_enable feature)
remotebone_server enable
```



