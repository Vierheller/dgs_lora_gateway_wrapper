"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GatewayClient_1 = require("./GatewayClient");
var SocketServer_1 = require("./SocketServer");
var PhotoDirectoryWatcher_1 = require("./PhotoDirectoryWatcher");
var Base64Encoder_1 = require("./Base64Encoder");
var ContinuousLogFileWatcher_1 = require("./ContinuousLogFileWatcher");
var Image_1 = require("./Image");
var Log_1 = require("./Log");
var ConfigHolder_1 = require("./config/ConfigHolder");
var GatewayWrapper = /** @class */ (function () {
    function GatewayWrapper() {
    }
    GatewayWrapper.main = function () {
        var myWrapper = new GatewayWrapper();
        myWrapper.init();
        myWrapper.run();
    };
    //TODO update paths, hosts, urls
    GatewayWrapper.prototype.init = function () {
        this.gatewaySocket = new GatewayClient_1.GatewayClient(GatewayWrapper.config.gateway_client_host, GatewayWrapper.config.gateway_client_port);
        this.socketServer = new SocketServer_1.SocketServer(GatewayWrapper.config.gateway_server_port);
        this.photoWatcher = new PhotoDirectoryWatcher_1.PhotoDirectoryWatcher(GatewayWrapper.config.photo_directory_path);
        this.logWatcher = new ContinuousLogFileWatcher_1.ContinuousLogFileWatcher(GatewayWrapper.config.log_file_path);
    };
    GatewayWrapper.prototype.run = function () {
        var _this = this;
        this.gatewaySocket.connect(function (err) {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Connected to raw Socket");
        });
        this.gatewaySocket.setDataListener(function (data) {
            _this.socketServer.sendTelemetry(data);
        });
        this.photoWatcher.setDownloadFinishedListener(function (path, fileName, photoTimestamp) {
            var base64Image = Base64Encoder_1.Base64Encoder.encode(path);
            var image = new Image_1.Image(fileName, base64Image);
            //TODO update args
            _this.socketServer.sendImage(image);
        });
        this.logWatcher.setOnNewLineListener(function (line) {
            var log = new Log_1.Log(line);
            _this.socketServer.sendLog(log);
        });
        this.logWatcher.watch();
    };
    GatewayWrapper.config = ConfigHolder_1.ConfigHolder.config;
    return GatewayWrapper;
}());
exports.GatewayWrapper = GatewayWrapper;
