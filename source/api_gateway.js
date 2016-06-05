const aws = require("aws-sdk");
const async = require("async");
const awsResponse = require("./aws_response");
const log = require("./log");

class ApiGateway {
  constructor(name) {
    this.name = name;
    this.id = null;
    this.rootResourceId = null;
    this.accountNum = null;
    this._region = process.env.AWS_REGION;
    this._awsApiGw = new aws.APIGateway({ region: this._region });
    this._iam = new aws.IAM({ region: this._region });
  }

  build(done) {
    async.series([
      this._createGateway.bind(this),
      this._discoverRootResource.bind(this),
      this._discoverAccountNumber.bind(this)
    ], done);
  }

  deploy(done) {
    log.info("Creating API Gateway deployment");
    this._awsApiGw.createDeployment({
      restApiId: this.id,
      stageName: process.env.AWS_ENVIRONMENT
    }, awsResponse.cb("createDeployment", done));
  }

  url() {
    return `https://${this.id}.execute-api.${this._region}.amazonaws.com/${process.env.AWS_ENVIRONMENT}`;
  }

  _createGateway(done) {
    log.info("Creating API Gateway");
    this._awsApiGw.createRestApi({ 
      name: this.name
    }, awsResponse.cb("createRestApi", done, (data) => {
      this.id = data.id;
    }));
  }

  _discoverRootResource(done) {
    log.info("Discovering root resource");
    this._awsApiGw.getResources({ 
      restApiId: this.id 
    }, awsResponse.cb("getResources", done, (data) => {
      this.rootResourceId = data.items[0].id;
    }));
  }

  _discoverAccountNumber(done) {
    log.info("Discovering account number");
    this._iam.getUser({
    }, awsResponse.cb("getUser", done, (data) => {
      this.accountNum = data.User.UserId;
    }));
  }
}

module.exports = ApiGateway;
