var UArt = require('./serialport');
var WatchJS = require('watchjs');
var watch = WatchJS.watch;
var config = require('./../config.json');
var Play = require('./Player.js');
var PostSend = require('./post-sender');
var send2server = require('./get-sender.js');
var querystring = require("querystring");
var Universal = require('./universal.js');
var main = require('./main_board.js');

global.timeouts = {};

function taskRunDelay (task, callback, delay) {
    global.timeouts[task] = setTimeout(callback, delay);
}

function taskCancel(task){
    if (global.timeouts[task]) {
        clearTimeout(global.timeouts[task]);
        global.timeouts[task] = null;
    }
}

global.reqNum = 0;
global.resNum = 0;

global.board_check = [];
var board_config = [];

global.boardState = {};

global.reset = 0;

global.trueBuilding = 'D';
global.trueFloor = '14';
global.trueRoom = '357';

global.boardsTable = {};
global.prevBoardsTable = {};

global.PeopleCoordinates = {};
global.leftStep = 0;
global.rightStep = 0;
global.Step = 1;

global.cameraCalibration = {};

global.professorKey = 0;
global.gameState = 0;
global.start = 0;

global.changeKey = 0; //

global.finalBoxPermission = 0;

global.girl_escape_complete_flag = 0;
global.final_box_finished_flag = 0;
global.gprocess_wait_for_card_flag = 0;
global.key_air_tube_completed_flag = 0;
global.hint_ventilation_sounds_flag = 0;
global.main_light_on_sound_flag = 0;
global.prison_correct_input_sound_flag = 0;
global.professorTableActivate = 0;
global.onSwitch1 = 1;
global.onSwitch2 = 2;
global.switchLight = 0;



// write nested objects
var row, col;

row = 0;
// 64, 4
do {
    global.prevBoardsTable[row] = {};
    col = 0;
    do {
        global.prevBoardsTable[row][col++] = 0;
    } while (col < 4);

    row++;
} while (row < 64);


row = 0;
do {
    global.boardsTable[row] = {};
    col = 0;
    do {
        global.boardsTable[row][col++] = 0;
    } while (col < 4);

    row++;
} while (row < 64);

// 4
col = 0;
do {
    global.boardState[col++] = 0;
} while (col < 4);

UArt.connect();

setTimeout(function(){
    checkGlobalState();
}, 5000);


watch(global, 'gameState', function (prop, action, value, oldValue) {

    global.boardsTable[0][0] = 0;
    global.boardsTable[0][1] = 0;
    global.boardsTable[0][2] = global.gameState;
    UArt.writePacket('main_board');

    // Door controller keeps its own gameState in byte1; sync it on every state change.
    // Also enforce lock bit by state:
    // maintenance/service (0/1) => unlocked, ready/game_started (3/2) => locked.
    global.boardsTable[18][1] = global.gameState;
    if (global.gameState == 0 || global.gameState == 1) {
        global.boardsTable[18][0] &= ~(1 << 7);
    } else {
        global.boardsTable[18][0] |= (1 << 7);
    }
    UArt.writePacket('door');

    global.start = 1;

    if(global.gameState == 0 || global.gameState == 1) {

        Play('demo_zombie', 'stop');
        Play('start', 'stop');
        taskCancel('main_sound');
        taskCancel('start');
        taskCancel('demo');
        taskCancel('play_game_status_1');
        taskCancel('play_game_status_2');
        taskCancel('play_game_status_3');
        taskCancel('play_game_status_4');


        global.finalBoxPermission = 0;
        global.professorTableActivate = 0;
        // In maintenance mode force bunker door unlocked.
        global.boardsTable[18][0] &= ~(1 << 7);
        UArt.writePacket('door');
        // In maintenance mode, mirror solved final-box snapshot:
        // finished=true, in_progress=false, lock=false, catalyst=true, reagent=false.
        global.boardsTable[5][0] &= ~((1 << 3) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 7));
        global.boardsTable[5][0] |= ((1 << 3) | (1 << 6));
        UArt.writePacket('final');

        console.log('Game State: Service');

        setTimeout(function(){
            Universal.writeLock1(16, 1);
            Universal.writeLock2(16, 1);
            UArt.writePacket('air_mail');
        }, 100);

        setTimeout(function() {
            if(((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 1;
            else global.onSwitch1 = 2;

            Universal.writeRelay1(2, 1);
            Universal.writeRelay2(2, 0);
            Universal.writeLock2(2, 0);
            UArt.writePacket('main_light');
        },200);


        send2server(querystring.stringify({
            area: 'zombie',
            id: 'game_status',
            param: 'maintenance'
        }));
    }
    else if(global.gameState == 2){

        //Clear Flags
        global.professorTableActivate = 0;
        global.girl_escape_complete_flag = 0;
        global.final_box_finished_flag = 0;
        global.gprocess_wait_for_card_flag = 0;
        global.key_air_tube_completed_flag = 0;
        global.hint_ventilation_sounds_flag = 0;
        global.main_light_on_sound_flag = 0;
        global.prison_correct_input_sound_flag = 0;
        global.finalBoxPermission = 0;
        global.switchLight = 0;

        taskRunDelay('main_sound', function () {
            Play('start', 'play');
        }, 600);

        taskRunDelay('start', function () {
            Universal.writeLock2(2, 1);
            UArt.writePacket('main_light');

            global.start = 0;

        }, 10000);

        taskRunDelay('demo', function () {
            Play('demo_zombie', 'play');
        }, 38000);

        taskRunDelay('play_game_status_1', function () {
            Play('game_status_1');
        }, 53000);

        taskRunDelay('play_game_status_2', function () {
            Play('game_status_2');
        }, 1800000);

        taskRunDelay('play_game_status_3', function () {
            Play('game_status_3');
        }, 3000000);

        taskRunDelay('play_game_status_4', function () {
            Play('game_status_4');
            Universal.writeLock2(2, 0);
            UArt.writePacket('main_light');
        }, 3600000);

        console.log('Game State: Game started');

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'game_status',
            param: 'game_started'
        }));

        setTimeout(function(){
            Universal.writeLock1(16, 1);
            Universal.writeLock2(16, 1);
            UArt.writePacket('air_mail');
        }, 100);


        setTimeout(function(){
            if(((global.boardsTable[2][0] >> 2) & 3) == 1) global.onSwitch1 = 2;
            else global.onSwitch1 = 1;

            Universal.writeRelay1(2, 0);
            Universal.writeRelay2(2, 1);
            UArt.writePacket('main_light');
        }, 500);


        console.log('OnSwitch1: ' + global.onSwitch1);
    }
    else if(global.gameState == 3){
        Play('demo_zombie', 'stop');
        Play('start', 'stop');
        taskCancel('main_sound');
        taskCancel('start');
        taskCancel('demo');
        taskCancel('play_game_status_1');
        taskCancel('play_game_status_2');
        taskCancel('play_game_status_3');
        taskCancel('play_game_status_4');

        global.finalBoxPermission = 0;
        global.professorTableActivate = 0;
        // In ready mode the final box lock must be ON.
        global.boardsTable[5][0] |= (1 << 5);
        UArt.writePacket('final');
        console.log('Game State: Ready');

        send2server(querystring.stringify({
            area: 'zombie',
            id: 'game_status',
            param: 'ready'
        }));

        setTimeout(function(){
            Universal.writeLock1(16, 1);
            Universal.writeLock2(16, 1);
            UArt.writePacket('air_mail');
        }, 100);

        setTimeout(function(){
            Universal.writeLock2(2, 0);
            UArt.writePacket('main_light');
        }, 500)

    }
});

function checkGlobalState(){
    global.boardsTable[0][0] = 0;
    global.boardsTable[0][1] = 1;
    global.boardsTable[0][2] = global.gameState;
    global.boardsTable[0][3] = 0;
    UArt.writePacket('main_board');

    setTimeout(function(){
        var len1 = global.board_check.length;
        var len2 = config.board_list.length;

        if (len1 != 0) {
            for (var j = 0; j < len1; j++) {
                for (var k = 0; k < len2; k++) {
                    if (config.board_list[k].address == global.board_check[j]) {
                        board_config.push({
                            "address": config.board_list[k].address,
                            "name": config.board_list[k].name,
                            "state": "success"
                        });
                        break;
                    }
                    else {
                        if (k == (len2 - 1)) {
                            board_config.push({
                                "address": global.board_check[j],
                                "name": "unknown",
                                "state": "success"
                            });
                        }
                    }
                }
            }

            for (k = 0; k < len2; k++) {
                for (j = 0; j < len1; j++) {
                    if (config.board_list[k].address == global.board_check[j]) {
                        break;
                    }
                    else {
                        if (j == (len1 - 1)) {
                            board_config.push({
                                "address": config.board_list[k].address,
                                "name": config.board_list[k].name,
                                "state": "failed"
                            });
                        }
                    }
                }
            }
        }
        else{
            for (var k = 0; k < len2; k++) {
                board_config.push({
                    "address": config.board_list[k].address,
                    "name": config.board_list[k].name,
                    "state": "failed"
                });
            }
        }

        PostSend(board_config, 'service_event?area=zombie&id=config');

        global.board_check = null;
        global.board_check = [];
        board_config = null;
        board_config = [];
    }, 2000);
}
