const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');

const branchFilename = __dirname + '/application_env';

const propsToSave = [
    'dataDir',
    'tempDir',
    'logDir',
    'libDir',
    'inpx',
    'inpxFilterFile',
    'allowConfigRewrite',
    'allowUnsafeFilter',
    'accessPassword',
    'accessTimeout',
    'extendedSearch',
    'bookReadLink',
    'loggingEnabled',
    'logServerStats',
    'logQueries',
    'multyArchiveStorage',
    'shutdownOnIddle',
    'dbCacheSize',
    'maxFilesDirSize',
    'queryCacheEnabled',
    'queryCacheMemSize',
    'queryCacheDiskSize',
    'cacheCleanInterval',
    'inpxCheckInterval',
    'lowMemoryMode',
    'fullOptimization',
    'allowRemoteLib',
    'remoteLib',
    'server',
    'opds',
    'latestReleaseLink',
    'checkReleaseLink',
    'uiDefaults',
];

let instance = null;

//singleton
class ConfigManager {
    constructor() {    
        if (!instance) {
            this.inited = false;

            instance = this;
        }

        return instance;
    }

    async init(defaultDataDir, configFile) {
        if (this.inited)
            throw new Error('already inited');

        this.branch = 'production';
        try {
            await fs.access(branchFilename);
            this.branch = (await fs.readFile(branchFilename, 'utf8')).trim();
        } catch (err) {
            //
        }

        process.env.NODE_ENV = this.branch;

        this.branchConfigFile = __dirname + `/${this.branch}.js`;
        const config = require(this.branchConfigFile);

        if (!defaultDataDir) {
            defaultDataDir = `${config.execDir}/.${config.name}`;
        }

        if (configFile) {
            config.configFile = path.resolve(configFile);
        } else {
            await fs.ensureDir(defaultDataDir);
            config.configFile = `${defaultDataDir}/config.json`;
        }

        this._config = config;

        this.inited = true;
    }

    get config() {
        if (!this.inited)
            throw new Error('not inited');
        return _.cloneDeep(this._config);
    }

    set config(value) {
        Object.assign(this._config, value);
    }

    async load() {
        try {
            if (!this.inited)
                throw new Error('not inited');

            if (await fs.pathExists(this._config.configFile)) {
                const data = JSON.parse(await fs.readFile(this._config.configFile, 'utf8'));
                const config = _.pick(data, propsToSave);

                this.config = config;

                //сохраним конфиг, если не все атрибуты присутствуют в файле конфига
                if (config.allowConfigRewrite) {
                    for (const prop of propsToSave) {
                        if (!Object.prototype.hasOwnProperty.call(config, prop)) {
                            await this.save();
                            break;                        
                        }
                    }
                }
            } else {
                await this.save();
            }
        } catch(e) {
            throw new Error(`Error while loading "${this._config.configFile}": ${e.message}`);
        }
    }

    async save() {
        if (!this.inited)
            throw new Error('not inited');

        const dataToSave = _.pick(this._config, propsToSave);
        await fs.writeFile(this._config.configFile, JSON.stringify(dataToSave, null, 4));
    }
}

module.exports = ConfigManager;