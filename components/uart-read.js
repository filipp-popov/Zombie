var UArt = require('./../components/serialport');
var config = require('./../config.json');
var querystring = require("querystring");
var fs = require('fs');
var Play = require('./Player.js');
var Shell = require('shelljs/global');
var Universal = require('./universal.js');
var PostSend = require('./post-sender');
var send2server = require('./get-sender.js');
var moment = require('moment');

var date = function () {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS Z');
};

var building;
var floor;
var room;
var key = 0;
var lastLight = 0;
var lastGameState = null;

UArt.read(readPacket);

function taskRunDelay (task, callback, delay) {
    global.timeouts[task] = setTimeout(callback, delay);
}

function taskCancel(task){
    if (global.timeouts[task]) {
        clearTimeout(timeouts[task]);
        timeouts[task] = null;
    }
}

function writeAddress(num){
    if(num < 10) return (num).toString();
    else if(num == 10) return 'A';
    else if(num == 11) return 'B';
    else if(num == 12) return 'C';
    else if(num == 13) return 'D';
    else if(num == 15) return '_';
}

function readPacket(buff){
    if (!buff.length) {
        return;
    }

    var length = buff.length / 2,
        i, byte,
        bytes = [];

    if (length !== 8 && length !== 36) {
        console.error('Bad package. Length: ' + length);
        return;
    }

    for (i = 0, byte = 0; i < length; i++, byte += 2) {
        bytes.push(parseInt('0x' + buff.slice(byte, byte + 2)));
    }

    var size = bytes[3] >> 7 === 0 ? 4 : 32;
    var address = bytes[3] & 63;
    var values = [];

    for (i = 4; i < length; i++) {
        values.push(bytes[i]);
    }

    for(i = 0; i < size; i++){
        global.boardsTable[address][i] = values[i];
    }


    //Board state
    if(global.board_check.length == 0){
        global.board_check.push(address);
    }
    else {
        for (var l = 0; l < global.board_check.length; l++) {
            if (global.board_check[l] == address) {
                break;
            }
            else {
                if (l == (global.board_check.length - 1)) {
                    global.board_check.push(address);
                    break;
                }
            }
        }
    }

    var boardName = '';

    var len = config.board_list.length;
    for (var p = 0; p < len; p++) {
        if (config.board_list[p].address == address) {
            boardName = config.board_list[p].name;
            break;
        }
    }

    console.log('UART', date());
    console.log('   Address:', address, boardName);
    console.log('   Package: ' +
    global.boardsTable[address][0].toString(2) + ' ' +
    global.boardsTable[address][1].toString(2) + ' ' +
    global.boardsTable[address][2].toString(2) + ' ' +
    global.boardsTable[address][3].toString(2));

    //Main board
    if(boardName == 'main_board'){
        //exec('sudo shutdown -h now');
        global.gameState = (values[0] & 3);

        var gameStatusParam = null;
        if (global.gameState == 1) {
            gameStatusParam = 'maintenance';
        }
        else if (global.gameState == 3) {
            gameStatusParam = 'ready';
        }
        else if (global.gameState == 2) {
            gameStatusParam = 'game_started';
        }

        if (gameStatusParam && lastGameState !== global.gameState) {
            lastGameState = global.gameState;
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'game_status',
                param: gameStatusParam
            }));
        }
    }

    //Main light
    else if(boardName == 'main_light') {

        if(global.switchLight != 0) {
            if(Universal.readRelay2(address)) {
                setTimeout(function() {
                    Universal.writeRelay1(address, 0);
                    Universal.writeRelay2(address, 0);
                    UArt.writePacket('main_light');
                }, global.switchLight);
            }
            else{
                setTimeout(function() {
                    Universal.writeRelay1(address, 0);
                    Universal.writeRelay2(address, 1);
                    UArt.writePacket('main_light');
                }, global.switchLight);
            }
        }

        else{
            if (Universal.readRelay1(address)) {
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'main_light_on',
                    param: 'true'
                }));

                if (!global.start && !lastLight) {
                    Play('main_light_on_sound');
                }
                lastLight = 1;
            }
            else {
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'main_light_on',
                    param: 'false'
                }));
                lastLight = 0;
            }

            if (Universal.readRelay2(address)) {
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'prison_light_on',
                    param: 'true'
                }));

            }
            else {
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'prison_light_on',
                    param: 'false'
                }));
            }

            if ((((values[0] >> 2) & 3) == ((~global.onSwitch1) & 3)) && !Universal.readRelay2(address)) {
                taskCancel('light');
                Universal.writeRelay1(address, 0);
                Universal.writeRelay2(address, 1);
                UArt.writePacket('main_light');
            }
            else if ((((values[0] >> 2) & 3) == global.onSwitch1) && !Universal.readRelay1(address)) {
                Universal.writeRelay1(address, 1);
                Universal.writeRelay2(address, 0);
                UArt.writePacket('main_light');
                if(global.gameState == 2){
                    taskRunDelay('light', function () {
                        if(Universal.readRelay1(address)) {
                            Play('generator');

                            if (((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 2;
                            else global.onSwitch1 = 1;

                            Universal.writeRelay1(address, 0);
                            Universal.writeRelay2(address, 1);
                            UArt.writePacket('main_light');
                        }
                    }, 240000);
                }
            }
            else if (((values[0] >> 2) & 3) == 3) {
                taskCancel('light');
                Universal.writeRelay1(address, 0);
                Universal.writeRelay2(address, 0);
                UArt.writePacket('main_light');
            }
        }

        if(Universal.readLock2(address)){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'input_lock_on',
                param: 'true'
            }));

        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'input_lock_on',
                param: 'false'
            }));
        }

    }

    //Professor table
    else if(boardName == 'professor_table') {

        global.professorKey = parseInt(fs.readFileSync('professorKey.txt', 'utf8'));

        key = Universal.readRFID(address);

        if(global.changeKey == 1 && key != 0){
            global.changeKey = 0;
            fs.writeFile("professorKey.txt", key, function(err) {
                if(err) {
                    console.log(err);
                } else{
                    console.log("Key was saved.");
                }
            });
        }

        if(global.professorTableActivate == 1) {
            if (key == global.professorKey) {
                Play('prison_correct_input_sound');
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'final_box_identified',
                    param: 'true'
                }));
                console.log("Key is true.");
            }
            else if (key != 0) {
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'final_box_identified',
                    param: 'false'
                }));
                console.log("Key is false.");
            }
        }
        else{
            if (key == global.professorKey) {
                console.log("Key is true.");
            }
            else if (key != 0) {

                console.log("Key is false.");
            }
        }
    }

    //Final Box
    else if(boardName == 'final') {

        if ((values[0] >> 3) & 1 == 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_finished',
                param: 'true'
            }));

            if(global.final_box_finished_flag == 0){

                global.final_box_finished_flag = 1;

                taskRunDelay('play_final_box_finished_1', function () {
                    Play('final_box_finished_1');
                }, 500);

                taskRunDelay('play_final_box_finished_2', function () {
                    Play('final_box_finished_2');
                }, 4000);

                Universal.writeLock2(2, 0);
                UArt.writePacket('main_light');
            }
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_finished',
                param: 'false'
            }));
        }

        if ((values[0] >> 4) & 1 == 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_in_progress',
                param: 'true'
            }));
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_in_progress',
                param: 'false'
            }));
        }

        if ((values[0] >> 5) & 1 == 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_lock_on',
                param: 'true'
            }));
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_lock_on',
                param: 'false'
            }));
        }

        if ((values[0] >> 7) & 1 == 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_reagent_placed',
                param: 'true'
            }));
        }
        else {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_reagent_placed',
                param: 'false'
            }));
        }

        if ((values[0]  >> 6) & 1 == 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_catalyst_placed',
                param: 'true'
            }));
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'final_box_catalyst_placed',
                param: 'false'
            }));
        }
    }

    //Mail

    else if(boardName == 'air_mail') {
        //global.resNum++;
        //
        //console.log('errors: ' + (global.reqNum - global.resNum) + '/' + global.reqNum);

        if ((values[0] >> 5) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'girl_air_tube_lock_on',
                param: 'true'
            }));
        } else {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'girl_air_tube_lock_on',
                param: 'false'
            }));
        }
    }



    else if(boardName == 'mail') {

        building = writeAddress((values[1] >> 4) & 15);
        floor = writeAddress(values[1] & 15) + writeAddress((values[2] >> 4) & 15);
        room = writeAddress(values[2] & 15) + writeAddress((values[3] >> 4) & 15) + writeAddress(values[3] & 15);

        var trueAddr;

        if ((building == global.trueBuilding) &&
            (floor == global.trueFloor) &&
            (room == global.trueRoom)) {

            trueAddr = 1;
            console.log('Mail: Address is true');


            global.boardsTable[address][0] |= 1;
            UArt.writePacket('air_mail');
        } else {
            trueAddr = 0;
            console.log('Mail: Address is false');

            global.boardsTable[16][0] &= 0xFE;
            UArt.writePacket('air_mail');

        }

        if (((values[0] >> 3) & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_correct_input',
                param: 'true'
            }));

            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_wrong_item',
                param: 'false'
            }));
        } else if (((values[0] >> 3) & 3) == 2) {

            if (trueAddr) {

                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'key_air_tube_wrong_item',
                    param: 'true'
                }));
            }
            else{
                send2server(querystring.stringify({
                    area: 'zombie',
                    id: 'key_air_tube_wrong_item',
                    param: 'false'
                }));
            }


            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_correct_input',
                param: 'false'
            }));
        } else {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_correct_input',
                param: 'false'
            }));
        }

        if ((values[0] >> 1) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_button_pressed',
                param: 'true'
            }));
        }

        if ((values[0] >> 5) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_lock_on',
                param: 'true'
            }));
        } else {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_lock_on',
                param: 'false'
            }));
        }

        if (values[0] & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'key_air_tube_completed',
                param: 'true'
            }));

            if(global.key_air_tube_completed_flag == 0){
                global.key_air_tube_completed_flag = 1;

                taskRunDelay('play_key_air_tube_completed_sound', function () {
                    Play('key_air_tube_completed_sound');
                }, 15000);
            }
        }

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'key_air_tube_building_value',
            param: building
        }));

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'key_air_tube_floor_value',
            param: floor
        }));

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'key_air_tube_room_value',
            param: room
        }));
    }

    //Sterilizer
    else if(boardName == 'sterilizer'){

        if ((values[0] >> 7) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_max_temperature_reached',
                param: 'true'
            }));

            Play('sterilizer_max_temperature_reached');

        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_max_temperature_reached',
                param: 'false'
            }));
        }

        if ((values[0] >> 6) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_lock_on',
                param: 'true'
            }));
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_lock_on',
                param: 'false'
            }));
        }

        if ((values[0] >> 5) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_completed',
                param: 'true'
            }));
        }
        else{
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_completed',
                param: 'false'
            }));
        }

        if (((values[0] >> 3) & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_1_state',
                param: 'medium'
            }));
        }
        else if(((values[0] >> 3) & 3) == 2){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_1_state',
                param: 'high'
            }));
        }
        else if(((values[0] >> 3) & 3) == 1){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_1_state',
                param: 'off'
            }));
        }


        if (((values[1] >> 6) & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_2_state',
                param: 'medium'
            }));
        }
        else if(((values[1] >> 6) & 3) == 2){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_2_state',
                param: 'high'
            }));
        }
        else if(((values[1] >> 6) & 3) == 1){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_2_state',
                param: 'off'
            }));
        }

        if (((values[1] >> 4) & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_3_state',
                param: 'medium'
            }));
        }
        else if(((values[1] >> 4) & 3) == 2){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_3_state',
                param: 'high'
            }));
        }
        else if(((values[1] >> 4) & 3) == 1){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_3_state',
                param: 'off'
            }));
        }

        if (((values[1] >> 2) & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_4_state',
                param: 'medium'
            }));
        }
        else if(((values[1] >> 2) & 3) == 2){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_4_state',
                param: 'high'
            }));
        }
        else if(((values[1] >> 2) & 3) == 1){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_4_state',
                param: 'off'
            }));
        }

        if ((values[1] & 3) == 3) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_5_state',
                param: 'medium'
            }));
        }
        else if((values[1] & 3) == 2){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_5_state',
                param: 'high'
            }));
        }
        else if((values[1] & 3) == 1){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_switch_5_state',
                param: 'off'
            }));
        }

        global.autoclaveTemp = values[2];

        if (global.autoclaveTemp == 240){
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'sterilizer_max_temperature_reached',
                param: 'true'
            }));

            Play('sterilizer_max_temperature_reached');
        }
        send2server(querystring.stringify({
            area: 'zombie',
            id: 'sterilizer_panel_temperature',
            param: global.autoclaveTemp
        }));
    }

    //Door
    else if(boardName == 'door') {

        if(global.Step != ((values[0] >> 4) & 7)){

            Play('prison_lock_active_algo_number_sound');
        }

        global.leftStep = (values[1] >> 5) & 7;
        global.rightStep = (values[1] >> 2) & 7;
        global.Step = (values[0] >> 4) & 7;

        if (((values[0] >> 7) & 1)) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'prison_lock_on',
                param: 'true'
            }));
        }
        else if (!((values[0] >> 7) & 1)) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'prison_lock_on',
                param: 'false'
            }));
        }

        if ((values[0] >> 2) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'prison_correct_input',
                param: 'true'
            }));


            if(global.prison_correct_input_sound_flag == 0){
                global.prison_correct_input_sound_flag = 1;

                Play('prison_correct_input_sound');
            }
        }
        if ((values[0] >> 3) & 1) {
            send2server(querystring.stringify({
                area: 'zombie',
                id: 'prison_correct_input',
                param: 'false'
            }));
        }

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'prison_lock_active_algo_number',
            param: global.Step
        }));


        send2server(querystring.stringify({
            area: 'zombie',
            id: 'prison_left_valve_succeeded_action_number',
            param: global.leftStep
        }));

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'prison_right_valve_succeeded_action_number',
            param: global.rightStep
        }));

    }

    else{
        console.log('Error: Undefined address ' + address);
    }
}
