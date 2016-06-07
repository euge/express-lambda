const selectionPatterns = require("./selection_patterns");

class Response {
  constructor(request, context) {
    this.request = request;
    this.status("200");
    this.data = null;
    this.context = context;
  }

  status(statusCode) {
    this.statusCode = statusCode.toString();
    return this;
  }

  location(path) {
    this.data = path;
    return this;
  }

  send(...args) {
    if (args.length === 2) {
      this.status(args[0]);
      this.data = args[1];
    } else {
      this.data = args[0];
    }
    this.end();
  }

  redirect(code, location) {
    if (typeof code === "number" || typeof code === "string") {
      this.status(code);
      this.location(location);
    } else {
      this.status("302");
      this.location(code);
    }
    this.end();
  }

  end() {
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
    this.context[method](response);
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

  makeResponse: (event, context, req) => {
    return new Response(req, context);
  }
}

