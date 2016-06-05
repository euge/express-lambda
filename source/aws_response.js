const util = require("util");
const log = require("./log");
const awsResponseLog = log.make("aws-response");

module.exports = {
  cb: (name, done, success) => {
    return (err, data) => {
      awsResponseLog("Response from %s", name);
      awsResponseLog("Error %s", util.inspect(err));
      awsResponseLog("Response %s", util.inspect(data));
      if (!err && success) {
        success(data);
      }
      done(err, data);
    };
  },
  log: (...args) => {
    awsResponseLog(...args);
  }
};
