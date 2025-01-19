const _ = require('lodash');
const WebSocket = require ('ws');
const http = require('http');

const WorkerState = require('../core/WorkerState');//singleton
const WebWorker = require('../core/WebWorker');//singleton
const log = new (require('../core/AppLogger'))().log;//singleton
const utils = require('../core/utils');

const cleanPeriod = 1*60*1000;//1 минута
const closeSocketOnIdle = 5*60*1000;//5 минут
const waitIddleCicles=3; //если waitIddleCicles циклов cleanPeriod ни одного коннекта не появилось, то завершаем приложение

class WebSocketController {
    constructor(wss, webAccess, config) {
        this.config = config;
        this.isDevelopment = (config.branch == 'development');

        this.webAccess = webAccess;

        this.workerState = new WorkerState();
        this.webWorker = new WebWorker(config);

        this.wss = wss;

        this.iddleCounter=0;
        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                this.onMessage(ws, message.toString());
            });

            ws.on('error', (err) => {
                log(LM_ERR, err);
            });
        });
        log(`this.config.shutdownOnIddle: ` + this.config.shutdownOnIddle);

        this.periodicClean();//no await
    }

    async periodicClean() {
        while (1) {//eslint-disable-line no-constant-condition
            
            try {
                const now = Date.now();

                if ((this.wss.clients.size==0)&&(this.config.shutdownOnIddle=="true")){//если клиентов нет в течение waitIddleCicles срабатывания процедуры, то останавливаем сервер
                    this.iddleCounter++;
                    if (this.iddleCounter>waitIddleCicles){
                        await log(`No active clients found. Closing wss server.`); //await чтобы успели написать в лог до завершения приложения
                        process.exit(0);
                    }
                }
                else{//если в течение циклов ожидания клиенты появились, то обнуляем счетчик
                    this.iddleCounter=0;
                }
                
                //почистим неактивных ws-клиентов
                this.wss.clients.forEach((ws) => {
                    if (!ws.lastActivity || now - ws.lastActivity > closeSocketOnIdle - 50) {
                        ws.terminate();
                    }
                });
            } catch(e) {
                log(LM_ERR, `WebSocketController.periodicClean error: ${e.message}`);
            }
            
            await utils.sleep(cleanPeriod);
        }
    }

    async onMessage(ws, message) {
        let req = {};
        try {
            if (this.isDevelopment || this.config.logQueries) {
                log(`WebSocket-IN:  ${utils.cutString(message)}`);
            }

            req = JSON.parse(message);
            req.__startTime = Date.now();

            ws.lastActivity = Date.now();
            
            //pong for WebSocketConnection
            this.send({_rok: 1}, req, ws);

            //access
            if (!await this.webAccess.hasAccess(req.accessToken)) {
                await utils.sleep(500);
                const salt = this.webAccess.newToken();
                this.send({error: 'need_access_token', salt}, req, ws);
                return;
            }

            //api
            switch (req.action) {
                case 'test':
                    await this.test(req, ws); break;
                case 'logout':
                    await this.logout(req, ws); break;
                case 'get-config':
                    await this.getConfig(req, ws); break;
                case 'get-worker-state':
                    await this.getWorkerState(req, ws); break;
                case 'search':
                    await this.search(req, ws); break;
                case 'bookSearch':
                    await this.bookSearch(req, ws); break;
                case 'get-author-book-list':
                    await this.getAuthorBookList(req, ws); break;
                case 'get-author-series-list':
                    await this.getAuthorSeriesList(req, ws); break;
                case 'get-series-book-list':
                    await this.getSeriesBookList(req, ws); break;
                case 'get-genre-tree':
                    await this.getGenreTree(req, ws); break;
                case 'get-book-link':
                    await this.getBookLink(req, ws); break;
                case 'get-book-info':
                    await this.getBookInfo(req, ws); break;

                case 'get-inpx-file':
                    await this.getInpxFile(req, ws); break;

                default:
                    throw new Error(`Action not found: ${req.action}`);
            }
        } catch (e) {
            this.send({error: e.message}, req, ws);
        }
    }

    send(res, req, ws) {
        if (ws.readyState == WebSocket.OPEN) {
            ws.lastActivity = Date.now();
            let r = res;
            if (req.requestId)
                r = Object.assign({requestId: req.requestId}, r);

            const message = JSON.stringify(r);
            ws.send(message);

            if (this.isDevelopment || this.config.logQueries) {
                log(`WebSocket-OUT: ${utils.cutString(message)}`);
                log(`${Date.now() - req.__startTime}ms`);
            }

        }
    }

    //Actions ------------------------------------------------------------------
    async test(req, ws) {
        this.send({message: `${this.config.name} project is awesome`}, req, ws);
    }

    async logout(req, ws) {
        await this.webAccess.deleteAccess(req.accessToken);
        this.send({success: true}, req, ws);
    }

    async getConfig(req, ws) {
        const config = _.pick(this.config, this.config.webConfigParams);
        config.dbConfig = await this.webWorker.dbConfig();
        config.freeAccess = this.webAccess.freeAccess;

        this.send(config, req, ws);
    }

    async getWorkerState(req, ws) {
        if (!req.workerId)
            throw new Error(`key 'workerId' is empty`);

        const state = this.workerState.getState(req.workerId);
        this.send((state ? state : {}), req, ws);
    }

    async search(req, ws) {
        if (!req.query)
            throw new Error(`query is empty`);
        if (!req.from)
            throw new Error(`from is empty`);

        const result = await this.webWorker.search(req.from, req.query);

        this.send(result, req, ws);
    }

    async bookSearch(req, ws) {
        if (!this.config.extendedSearch)
            throw new Error('config.extendedSearch disabled');
        if (!req.query)
            throw new Error(`query is empty`);

        const result = await this.webWorker.bookSearch(req.query);

        this.send(result, req, ws);
    }

    async getAuthorBookList(req, ws) {
        const result = await this.webWorker.getAuthorBookList(req.authorId);

        this.send(result, req, ws);
    }

    async getAuthorSeriesList(req, ws) {
        const result = await this.webWorker.getAuthorSeriesList(req.authorId);

        this.send(result, req, ws);
    }

    async getSeriesBookList(req, ws) {
        const result = await this.webWorker.getSeriesBookList(req.series);

        this.send(result, req, ws);
    }

    async getGenreTree(req, ws) {
        const result = await this.webWorker.getGenreTree();

        this.send(result, req, ws);
    }

    async getBookLink(req, ws) {
        if (!utils.hasProp(req, 'bookUid'))
            throw new Error(`bookUid is empty`);

        const result = await this.webWorker.getBookLink(req.bookUid);

        this.send(result, req, ws);
    }

    async getBookInfo(req, ws) {
        if (!utils.hasProp(req, 'bookUid'))
            throw new Error(`bookUid is empty`);

        const result = await this.webWorker.getBookInfo(req.bookUid);

        this.send(result, req, ws);
    }

    async getInpxFile(req, ws) {
        if (!this.config.allowRemoteLib)
            throw new Error('Remote lib access disabled');

        const result = await this.webWorker.getInpxFile(req);

        this.send(result, req, ws);
    }

}

module.exports = WebSocketController;
