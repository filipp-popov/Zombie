var fs = require('fs');
var MPlayer = require('node-mplayer');

var sounds = {};
var status = {};
var player = {};
var folder = {};
var current_folder;
global.language = fs.readFileSync('language.txt', 'utf8').toString();

console.log('Language:', global.language);

folder.ru = '/home/pi/rasp_nodejs/Sound_files/ru/';
folder.en = '/home/pi/rasp_nodejs/Sound_files/en/';
folder.de = '/home/pi/rasp_nodejs/Sound_files/de/';

function Player (soundName, action) {
    if (!action) {
        action = 'play';
    }

    switch (action) {
        case 'play':

            if (status[soundName]) {
                player[soundName].stop();
            }

            setTimeout(function () {
                console.log('Sound play:', soundName);
                if(folder[global.language]) {
                    current_folder = folder[global.language];
                }
                else{
                    current_folder = folder.en;
                }
                player[soundName] = new MPlayer(current_folder + soundName + '.mp3')
                    .on('end', function () {
                        console.log('End play:', soundName);
                        player[soundName] = null;
                        status[soundName] = null;
                    })
                    .on('error', function (err) {
                        console.log('Play error', err);
                        console.log(soundName);
                    });
                player[soundName].play({volume: 90});
                status[soundName] = 'play';
            }, 500);

            break;

        case 'stop':

            if (status[soundName]) {
                player[soundName].stop();
                player[soundName] = null;
                status[soundName] = null;
            }/*
            if (status[soundName]) {
                console.log('Sound stop:', soundName);
                status[soundName].unpipe();
                status[soundName] = null;
            }
            */
            break;
    }

}

module.exports = Player;