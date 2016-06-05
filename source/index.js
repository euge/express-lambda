const Application = require("./application");
const dotenv = require("dotenv");
const log = require("./log");

dotenv.load();

if (!process.env.AWS_ROLE_ARN) {
  log.error("AWS_ROLE_ARN is missing. Please configure it in .env");
  process.exit(1);
}

module.exports = {
  load: (src) => {
    var app = new Application();
    require(src)(app);
    return app;
  }
}