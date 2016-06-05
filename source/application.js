const Node = require("./node");
const Resource = require("./resource");
const async = require("async");
const ApiGateway = require("./api_gateway");
const Lambda = require("./lambda");
const Table = require("cli-table");
const _ = require("underscore")._;

class Application extends Node {
  constructor() {
    super(null, "", "");
  }

  make(parent, fullpath, path) {
    return new Resource(parent, fullpath, path);
  }

  name(name) {
    this._name = name;
  }

  build(done) {
    async.series([
      this._buildApiGateway.bind(this),
      this._buildChildResources.bind(this),
      this._buildLambdas.bind(this),
      this._integrateLambdas.bind(this),
      this._deployApiGateway.bind(this),
      this.print.bind(this)
    ], done);
  }

  resourceId() {
    return this._apiGw.rootResourceId;
  }

  makeLambda(config) {
    return new Lambda(config);
  }

  print(done) {
    var table = new Table({
      head: ["Methods", "Path", "Lambda"]
    });

    for (var k in this.children) {
      this.children[k].print(table);
    }

    console.log("Deployed!");
    console.log(table.toString());
    done && done();
  }

  _buildApiGateway(done) {
    this._apiGw = new ApiGateway(this._name);
    this._apiGw.build(done);
  }

  _deployApiGateway(done) {
    this._apiGw.deploy(done);
  }

  _buildChildResources(done) {
    var tasks = _.values(this.children).map((c) => {
      return (done) => {
        c.build(this._apiGw, done);
      }
    });

    async.series(tasks, done);
  }

  _buildLambdas(done) {
    var tasks = _.values(this.children).map((c) => {
      return (done) => {
        c.buildLambda(done);
      }
    });

    async.series(tasks, done);
  }

  _integrateLambdas(done) {
    var tasks = _.values(this.children).map((c) => {
      return (done) => {
        c.integrateToLambda(done);
      }
    });

    async.series(tasks, done);
  }
}

module.exports = Application;
