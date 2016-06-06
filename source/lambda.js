const shell = require("shelljs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const tmp = require("tmp");
const log = require("./log");

class Lambda {
  constructor(config) {
    var id = crypto.randomBytes(4).toString("hex").slice(0, 6);
    this.config = config;
    this.built = false;
    this._folder = `${tmp.dirSync().name}/${path.parse(this.config.src).name}-${id}`;
    this.name = `${path.parse(this.config.src).name}-${id}-${process.env.AWS_ENVIRONMENT}`;
  }

  build() {
    if (this.built) {
      log.info(`Skipping building lambda ${this.name}...already built.`);
      return this;
    }

    log.info(`Building lambda ${this.name}`)
    shell.exec(`mkdir ${this._folder}`);
    this._writeWrapper();
    shell.exec(`cp ${this.config.src}* ${this._folder}`);
    shell.exec(`cp .env ${this._folder}`);
    // create package.json and copy dependencies over
    shell.exec(`cd ${this._folder}; npm init -y`, { silent: true });
    var depsMain = JSON.parse(fs.readFileSync(process.cwd() + "/" + "package.json"));
    var depsModule = JSON.parse(fs.readFileSync(`${this._folder}/package.json`));
    depsModule.dependencies = depsMain.dependencies;
    fs.writeFileSync(`${this._folder}/package.json`, JSON.stringify(depsModule, null, 2), "utf8");

    // copy node modules
    shell.exec(`cp -r ${process.cwd()}/node_modules ${this._folder}`)
    this.built = true;
    log.info(`Built lambda ${this.name}`);
    return this;
  }

  deploy() {
    if (this.deployed) {
      log.info(`Skipping deploying lambda ${this.name}...already deployed.`);
      return this;
    }

    log.info(`Deploying lambda ${this.name}`)
    var nodeLambdaPath = require.resolve("node-lambda/bin/node-lambda");
    shell.exec(`cd ${this._folder}; ${nodeLambdaPath} deploy`, { silent: true });
    this.deployed = true;
    log.info(`Deployed lambda ${this.name}`);
    return this;
  }

  _writeWrapper() {
    var wrapper = `
      var utils = require("express-lambda/dist/utils");

      exports.handler = function(event, context) {
        var req = utils.makeRequest(event, context);
        var res = utils.makeResponse(event, context);
        require("./${path.basename(this.config.src)}")(req, res);
        res.respondToLambda(context);
      };`;

     fs.writeFileSync(`${this._folder}/index.js`, wrapper);
  }
}

module.exports = Lambda;