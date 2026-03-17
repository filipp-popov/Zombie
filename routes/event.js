var express = require('express');
var router = express.Router();
var http = require('http');
var querystring = require('querystring');
var fs = require('fs');
var UArt = require('./../components/serialport');
var config = require('./../config.json');
var Shell = require('shelljs/global');
var Play = require('./../components/Player.js');
var send2server = require('./../components/get-sender.js');
var Universal = require('./../components/universal.js');

/**
 * @return {number}
 */

var boardAddress = 0;

function UartWrite(address){
    UArt.writePacket(address);
}

function taskRunDelay (task, callback, delay) {
    global.timeouts[task] = setTimeout(callback, delay);
}

function taskCancel(task){
    if (global.timeouts[task]) {
        clearTimeout(global.timeouts[task]);
        global.timeouts[task] = null;
    }
}


/* GET home page. */
router.get('/', function(req, res) {

    //Game status
    if(req.query.id === 'game_status'){
        if(req.query.param === 'maintenance'){
            //������������
            global.gameState = 1; //?????????
            boardAddress = 18;
            global.boardsTable[boardAddress][1] = global.gameState;
            global.boardsTable[boardAddress][0] &= ~(1<<7);
            UartWrite(boardAddress);

            boardAddress = 5;
            global.boardsTable[boardAddress][0] &= ~(1<<5);
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'ready'){
            //����������
            global.gameState = 3;
            boardAddress = 18;
            global.boardsTable[boardAddress][1] = global.gameState;
            global.boardsTable[boardAddress][0] |= (1<<7);
            UartWrite(boardAddress);

            boardAddress = 5;
            global.boardsTable[boardAddress][0] |= (1<<5);
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'game_started'){
            //����
            global.gameState = 2;
            boardAddress = 18;
            global.boardsTable[boardAddress][1] = global.gameState;
            global.boardsTable[boardAddress][0] |= (1<<7);
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    //Language
    else if(req.query.id === 'game_language'){
        if ((req.query.param == 'de') || (req.query.param == 'en') || (req.query.param == 'ru')){
            fs.writeFile("language.txt", req.query.param, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Language was changed:", req.query.param);

                    global.language = req.query.param;

                    send2server(querystring.stringify({
                        area: 'zombie',
                        id: 'game_language',
                        param: req.query.param
                    }));
                }
            });


        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown language: ' + req.query.param);
        }

        res.send(req.query);
    }

    //Raspberry
    else if(req.query.id === 'raspberry'){
        if(req.query.param === 'shutdown'){
            console.log('Shutdown');
            exec('sudo shutdown -h now');
        }
        else if(req.query.param === 'reset'){
            console.log('Reset');
            exec('sudo shutdown -r now');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown raspberry command ...');
        }
        res.send(req.query);
    }

    //Sonar
    else if(req.query.id === 'sonar_calibration'){
        res.json(global.cameraCalibration);
    }

    //Mail
    else if(req.query.id === 'key_air_tube_correct_input'){
        boardAddress = 16;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 1;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 254;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'girl_air_tube_lock_on'){
        boardAddress = 16;
        if(req.query.param === 'true'){
            Universal.writeLock1(16, 1);
            Universal.writeLock2(16, 1);
            UartWrite(16);
        }
        else if(req.query.param === 'false'){
            Universal.writeLock1(16, 0);
            Universal.writeLock2(16, 0);
            UartWrite(16);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'final_card_air_tube_lock_on'){
        boardAddress = 16;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 64;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 191;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'key_air_tube_lock_on'){

        boardAddress = 16;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 32;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 223;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    //Sterilizer
    else if(req.query.id === 'sterilizer_lock_on'){
        boardAddress = 17;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 64;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 191;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'sterilizer_completed'){
        boardAddress = 17;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 32;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 223;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    //Door
    else if(req.query.id === 'prison_lock_on'){
        boardAddress = 18;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 128;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 127;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'prison_lock_on'){
        boardAddress = 18;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 128;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 127;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    //Final box
    else if(req.query.id === 'final_box_finished'){
        boardAddress = 5;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= 8;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 247;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'final_box_in_progress'){
        boardAddress = 5;
        if(req.query.param === 'true'){
            Play('demo_zombie', 'stop');

            Play('final');

            global.boardsTable[boardAddress][0] |= 16;
            UartWrite(boardAddress);

            setTimeout(function() {
                global.switchLight = 100;
                Universal.writeRelay1(boardToAddress('main_light'), 0);
                Universal.writeRelay2(boardToAddress('main_light'), 0);
                UArt.writePacket('main_light');
            }, 100);

            setTimeout(function() {
                global.switchLight = 0;
                //if(((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 1;
                //else global.onSwitch1 = 2;
                //Universal.writeRelay1(boardToAddress('main_light'), 1);
                //Universal.writeRelay2(boardToAddress('main_light'), 0);
                //UArt.writePacket('main_light');
            }, 35000);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= 239;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'final_box_lock_on'){
        boardAddress = 5;
        if(req.query.param === 'true'){
            global.boardsTable[boardAddress][0] |= (1<<5);
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            global.boardsTable[boardAddress][0] &= ~(1<<5);
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    //Light
    else if(req.query.id === 'main_light_on'){
        boardAddress = 2;
        if(req.query.param === 'true'){
            if(((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 1;
            else global.onSwitch1 = 2;

            global.boardsTable[boardAddress][0] &= ~64;
            global.boardsTable[boardAddress][0] |= 128;
            UartWrite(boardAddress);

            if(global.gameState == 2){
                taskRunDelay('light', function () {
                    if(Universal.readRelay1(boardAddress)) {
                        Play('generator');

                        if (((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 2;
                        else global.onSwitch1 = 1;

                        Universal.writeRelay1(boardAddress, 0);
                        Universal.writeRelay2(boardAddress, 1);
                        UArt.writePacket('main_light');
                    }
                }, 240000);
            }
        }
        else if(req.query.param === 'false'){

            if(((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 2;
            else global.onSwitch1 = 1;
            global.boardsTable[boardAddress][0] &= ~128;
            global.boardsTable[boardAddress][0] |= 64;
            UartWrite(boardAddress);

            taskCancel('light');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'input_lock_on'){
        boardAddress = 2;
        if(req.query.param === 'true'){
            Universal.writeLock2(2,1);
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            Universal.writeLock2(2,0);
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'prison_light_on'){
        boardAddress = 3;
        if(req.query.param === 'true'){
            if(((global.boardsTable[3][0] >> 2) & 3) == 1) global.onSwitch2 = 2;
            else global.onSwitch2 = 1;
            global.boardsTable[boardAddress][0] |= 128;
            UartWrite(boardAddress);
        }
        else if(req.query.param === 'false'){
            if(((global.boardsTable[3][0] >> 2) & 3) == 1) global.onSwitch2 = 1;
            else global.onSwitch2 = 2;
            global.boardsTable[boardAddress][0] &= ~128;
            UartWrite(boardAddress);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'light_switch'){
        boardAddress = 3;

        global.switchLight = req.query.param;
        console.log(req.query.param);
        Universal.writeRelay1(boardToAddress('main_light'), 1);
        Universal.writeRelay2(boardToAddress('main_light'), 1);
        UArt.writePacket('main_light');
        res.send(req.query);
    }


    //Professor table
    else if(req.query.id === 'final_box_card_renew'){
        if(req.query.param === 'true'){
            global.changeKey = 1;
            console.log('Key waiting ...');
        }
        else if(req.query.param === 'false'){
            if(global.changeKey == 1) {
                global.changeKey = 0;
                console.log('Key is not waiting');
            }
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'final_box_card_active'){
        if(req.query.param === 'true'){
            global.professorTableActivate = 1;
            console.log('Professor table activated');
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_card_active',
                param: true
            }));
        }
        else if(req.query.param === 'false'){
            global.professorTableActivate = 0;
            console.log('Professor table deactivated');
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_card_active',
                param: false
            }));
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }

        res.send(req.query);
    }

    //Sounds
    else if(req.query.id === 'girl_escape_complete'){
        if(req.query.param === 'true'){

                global.girl_escape_complete_flag = 1;

                Play('girl_escape_complete_1');

                setTimeout(function(){
                    Play('girl_escape_complete_2');

                    setTimeout(function() {
                        boardAddress = 16;
                        Universal.writeLock1(boardAddress, 0);
                        UartWrite(boardAddress);
                    }, 12000);
                }, 12000);
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'process_wait_for_card'){
        if(req.query.param === 'true'){
            if(global.gprocess_wait_for_card_flag == 0){
                global.process_wait_for_card_flag = 1;

                setTimeout(function(){
                    Play('process_wait_for_card');
                }, 20000);

            }
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_ventilation_girl_frightened'){
        if(req.query.param === 'true'){
            Play('hint_ventilation_girl_frightened');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_ventilation_sounds'){
        if(req.query.param === 'true'){
            Play('hint_ventilation_sounds');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_new_email'){
        if(req.query.param === 'true'){
            Play('hint_new_email');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_stop_emailing'){
        if(req.query.param === 'true'){
                Play('hint_stop_emailing');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_do_not_use_force'){
        if(req.query.param === 'true'){
            Play('hint_do_not_use_force');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_sterilize_10_seconds'){
        if(req.query.param === 'true'){
            Play('hint_sterilize_10_seconds');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'hint_blow_the_lock'){
        if(req.query.param === 'true'){
            Play('hint_blow_the_lock');
        }
        else{
            console.log('ID: ' + req.query.id);
            console.log('Unknown param: ' + req.query.param);
        }
        res.send(req.query);
    }

    else if(req.query.id === 'play_sound'){
        Play(req.query.param);

        //else{
        //    console.log('ID: ' + req.query.id);
        //    console.log('Unknown param: ' + req.query.param);
        //}

        res.send(req.query);
    }

    else{
        console.log('Unknown id: ' + req.query.id);
    }

    /*
    else if (req.query.id && config.rules.server2rasp[ req.query.id ]) {
        var rules = config.rules.server2rasp[ req.query.id ];
        var k;



        for (var i = 0, len = rules.length; i < len; i++) {
            if (typeof req.query[rules[i].key] !== 'undefined') {
                if (req.query[rules[i].key] === rules[i].value) {

                    for(k = 0; k < 8; k++){
                        if(((rules[i].uart.mask >> k) & 1) == 1){
                            break;
                        }
                    }

                    console.log('Server');
                    console.log('   Address: ' + rules[i].uart.address);
                    console.log('   Previous package: ' +
                    (global.boardsTable[rules[i].uart.address][0].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][1].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][2].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][3].toString(2)).toUpperCase());

                    global.boardsTable[rules[i].uart.address][rules[i].uart.byte] =
                    (global.boardsTable[rules[i].uart.address][rules[i].uart.byte] &
                    ~rules[i].uart.mask) | (rules[i].uart.state << k);

                    console.log('   Current package: ' +
                    (global.boardsTable[rules[i].uart.address][0].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][1].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][2].toString(2) + ' ' +
                    global.boardsTable[rules[i].uart.address][3].toString(2)).toUpperCase());

                    for (k = 0; k < 4; k++) {
                        global.boardState[k] = global.boardsTable[rules[i].uart.address][k];
                    }

                    UArt.write(UArt.makePacket(
                        [global.boardState[0],
                         global.boardState[1],
                         global.boardState[2],
                         global.boardState[3]],
                        rules[i].uart.sizeBit,
                        rules[i].uart.address
                    ));
                    break;
                }
            }
        }
        res.send(req.query);
    }
    */

});

function boardToAddress(name){
    var len = config.board_list.length;
    for (var i = 0; i < len; i++) {
        if (config.board_list[i].name == name) {
            return(config.board_list[i].address);
        }
        else {
            if (i == (len - 1)) {
                console.log('Error: Unknown board name ' + name);
                return(100);
            }
        }
    }

}

module.exports = router;
