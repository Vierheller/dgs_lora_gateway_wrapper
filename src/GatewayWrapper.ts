import {GatewayClient} from "./socket/GatewayClient";
import {SocketServer} from "./socket/SocketServer";
import {PhotoDirectoryWatcher} from "./photo/PhotoDirectoryWatcher";
import {Base64Encoder} from "./photo/Base64Encoder";
import {ContinuousLogFileWatcher} from "./log/ContinuousLogFileWatcher";
import {Telemetry} from "./socket/TelemetryAdapter";
import {ImageAdapter} from "./photo/ImageAdpater";
import {LogAdapter} from "./log/LogAdapter";
import {ConfigHolder} from "./config/ConfigHolder";
import {Config} from "./config/Config";

export class GatewayWrapper{
    private static config: Config = ConfigHolder.config;

    gatewaySocket : GatewayClient;
    socketServer: SocketServer;
    photoWatcher:PhotoDirectoryWatcher;
    logWatcher:ContinuousLogFileWatcher;

    public static main(){
        const myWrapper = new GatewayWrapper();
        myWrapper.init();
        myWrapper.run()
    }

    //TODO update paths, hosts, urls
    private init(){
        this.gatewaySocket = new GatewayClient(GatewayWrapper.config.gateway_client_host, GatewayWrapper.config.gateway_client_port);
        this.socketServer = new SocketServer(GatewayWrapper.config.gateway_server_port);
        this.photoWatcher = new PhotoDirectoryWatcher(GatewayWrapper.config.photo_directory_path);
        this.logWatcher = new ContinuousLogFileWatcher(GatewayWrapper.config.log_file_path)
    }

    private run(){
        this.gatewaySocket.connect(err => {
            if(err){
                console.error(err);
                return;
            }
            console.log("Connected to raw Socket")
        });

        this.gatewaySocket.setDataListener((data:Telemetry) => {
            this.socketServer.sendOverSocket(data)
        });

        this.photoWatcher.setDownloadFinishedListener((path, fileName, photoTimestamp)=>{
            const base64Image = Base64Encoder.encode(path);
            const image = new ImageAdapter(fileName, base64Image);
            //TODO update args
            this.socketServer.sendOverSocket(image.getJSON())
        });

        this.logWatcher.setOnNewLineListener((line)=>{
            const log = new LogAdapter(line);
            this.socketServer.sendOverSocket(log.getJSON())
        });
        this.logWatcher.watch();
    }
}