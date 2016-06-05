"use strict";

const async = require("async");
const ApiGatewayResource = require("./api_gateway_resource");
const Node = require("./node");
const _ = require("underscore")._;

class Resource extends Node {
  make(parent, fullpath, path) {
    return new Resource(parent, fullpath, path);
  }

  build(apiGw, done) {
    this._apiGw = apiGw;
    var tasks = _.values(this.children).map((c) => {
      return (done) => {
        c.build(apiGw, done);
      };
    });

    tasks.unshift((done) => {
      this.apiGwResource = new ApiGatewayResource(apiGw, this.parent.resourceId(), this.methods, this.path, this.fullpath);
      this.apiGwResource.build(done);
    });

    async.series(tasks, done);
  }

  resourceId() {
    return this.apiGwResource.resourceId;
  }

  print(table) {
    if (this.methods.length) {
      table.push([
        this.methods.join(", ") || "-", 
        this._apiGw.url() + this.fullpath, 
        this.lambda && this.lambda.name || "-"
      ]);
    }
    for (var k in this.children) {
      this.children[k].print(table);
    }
  }

  buildLambda(done) {
    var tasks = _.values(this.children).map((c) => {
      return (done) => { c.buildLambda(done); };
    });

    tasks.unshift((done) => {
      this.lambda && this.lambda.build().deploy();
      done();
    });

    async.series(tasks, done);
  }

  integrateToLambda(done) {
    var tasks = _.values(this.children).map((c) => {
      return (done) => { c.integrateToLambda(done); };
    });

    tasks.unshift((done) => {
      if (this.lambda) {
        this.apiGwResource.integrateToLambda(this.lambda, done);
      } else {
        done();
      }
    });

    async.series(tasks, done);
  }
}

module.exports = Resource;
