const Lambda = require("./lambda");

class Node {
  constructor(parent, fullpath, path) {
    this.parent = parent;
    this.fullpath = fullpath;
    this.path = path;
    this.children = {};
    this.methods = [];
    this.lambda = null;    
    ["get", "put", "post", "delete", "head", "patch", "options"].forEach((verb) => {
      this[verb] = this.add.bind(this, verb.toUpperCase());
    });
  }

  add(method, path, lambda) {
    var node = this.use(path);
    node.methods.push(method);
    if (lambda) {
      node.lambda = lambda instanceof Lambda ? lambda : new Lambda({ src: lambda });
    }
  }

  use(path, cb) {
    path = path.replace(/^\//, "");
    var segments = path.split("/"), part = segments.shift(), node = this, fullpath = this.fullpath;
    while (part) {
      fullpath = fullpath + "/" + part;
      if (!node.children[part]) {
        node.children[part] = this.make(node, fullpath, part);
      }
      node = node.children[part];
      part = segments.shift();
    }
    cb && cb(node);
    return node;
  }
}

module.exports = Node;
