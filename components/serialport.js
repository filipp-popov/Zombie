var serialport = require('serialport');
var moment = require('moment');
var extend = require('node.extend');
var config = require('./../config.json');

var UArtSerialPort = {
    connected: false
};

var date = function () {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS Z');
};

UArtSerialPort.connect = function () {
    console.log('[UArtSerialPort]', date(), 'start connect...');

    var options = {
        baudRate: 115200,
        // END
        parser: serialport.parsers.readline('454e44', 'hex')
    };

    UArtSerialPort.connection = new serialport.SerialPort("/dev/ttyAMA0", options);

    UArtSerialPort.connection.on('open', function () {
        console.log('[UArtSerialPort]', date(), 'connected!');
        UArtSerialPort.connected = true;
    });

    UArtSerialPort.connection.on('close', function () {
        console.log('[UArtSerialPort]', date(), 'connection closed!');
        UArtSerialPort.connected = false;
        UArtSerialPort.connect();
    });

    UArtSerialPort.connection.on('error', function () {
        console.error('[UArtSerialPort]', date(), 'error:', arguments);
    });
};

/**
 * @param data
 * @param resultCallback
 */
UArtSerialPort.write = function (data, resultCallback) {
    //UArtSerialPort.connection.on('open', function () {
        UArtSerialPort.connection.write(data, resultCallback);
    //});
};

/**
 * @param callback
 * @returns {boolean}
 */
UArtSerialPort.read = function (callback) {
    UArtSerialPort.connection.on('open', function () {
        UArtSerialPort.connection.on('data', callback);
    });
};

UArtSerialPort.makePacket = function (data, sizeBit, address) {
    var size = sizeBit ? 32 : 4,
        sizeSystem = 7,
        packetSize = size + sizeSystem;

    var i = 0, packet = new Buffer(packetSize);

    packet[i++] = 76; //'L';
    packet[i++] = 79; //'O';
    packet[i++] = 76; //'L';

    packet[i++] = ((sizeBit << 7) | address) & 0xBF;

    var k, len;

    for (k = 0, len = data.length; k < len; k++) {
        packet[i++] = data[k];
    }

    for (; i < packetSize;) {
        packet[i++] = global.boardsTable[address][++k]; //0 ????
    }

    packet[packetSize - 3] = 69; //'E';
    packet[packetSize - 2] = 78; //'N';
    packet[packetSize - 1] = 68; //'D';

    return packet;
};


UArtSerialPort.writePacket = function (address) {

    var board_address = 55;
    var board_name = 'unknown';
    var len = config.board_list.length;
    var p = 0;
    if(typeof(address) == "number"){
        for (p = 0; p < len; p++) {
            if (config.board_list[p].address === address) {
                board_name = config.board_list[p].name;
                board_address = address;
                break;
            }
            else {
                if (p == (len - 1)) {
                    console.log('   Unknown address:', address);
                    board_address = address;
                    board_name = 'unknown';
                    break;
                }
            }
        }
    }
    else{
        for (p = 0; p < len; p++) {
            if (config.board_list[p].name === address) {
                board_address = config.board_list[p].address;
                board_name = address;
                break;
            }
            else {
                if (p == (len - 1)) {
                    console.log('   Unknown name:', address);
                    break;
                }
            }
        }
    }


    var data = [global.boardsTable[board_address][0],
        global.boardsTable[board_address][1],
        global.boardsTable[board_address][2],
        global.boardsTable[board_address][3]];

    console.log('UART Send', date());
    console.log('   Address:', board_address, board_name);
    /*
     console.log('   Previous package: ',
     global.prevBoardsTable[address][0].toString(2),
     global.prevBoardsTable[address][1].toString(2),
     global.prevBoardsTable[address][2].toString(2),
     global.prevBoardsTable[address][3].toString(2));

     */
    var pack = UArtSerialPort.makePacket(data, 0, board_address);
    UArtSerialPort.write(pack);

    setTimeout(function(){
        UArtSerialPort.write(pack);
    }, 20);

    console.log('   Current package:',
        pack[4].toString(2),
        pack[5].toString(2),
        pack[6].toString(2),
        pack[7].toString(2));

    var i = 0;
    for(i = 0; i < 4; i++){
        global.prevBoardsTable[board_address][i] = pack[i + 4];
    }
};

module.exports = UArtSerialPort;