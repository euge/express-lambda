"use strict";

const selectionPatterns = require("./selection_patterns");

class Response {
  constructor() {
    this.statusCode = "200";
    this.data = null;
  }

  json(data) {
    this.data = data;
    return this;
  }

  status(statusCode) {
    this.statusCode = statusCode.toString();
    return this;
  }

  location(path) {
    this.data = path;
    return this;
  }

  send(data) {
    if (typeof data === "object") {
      this.json(data);
    } else {
      this.data = data;
    }
  }

  redirect(code, location) {
    if (typeof code === "number" || typeof code === "string") {
      this.statusCode = code.toString();
      this.location(location);
    } else {
      this.statusCode = "302";
      this.location(code);
    }
  }

  respondToLambda(context) {
    var method = (this.statusCode === "200" ? "succeed" : "fail");
    var response;
    if (["201", "301", "302"].indexOf(this.statusCode) !== -1) {
      // hacky special handling for redirects so that we can reference the location as a header
      // for redirects the regex matches on presences of http(s) and various amounts of padding
      var padding = selectionPatterns.padding[this.statusCode];
      response = padding + this.data;
    } else {
      response = [ "STATUS" + this.statusCode, JSON.stringify(this.data) ].join(selectionPatterns.responseDelimeter);
    }
    context[method](response);
  }
}

module.exports = {
  makeRequest: (event, context) => {
    var req = {
      query: event.query,
      params: event.params,
      body: event.body,
      context: event.context,
      method: event.method,
      get: (name) => {
        return event.headers[name];
      }
    };
    return req;
  },

  makeResponse: (event, context) => {
    return new Response();
  }
}

