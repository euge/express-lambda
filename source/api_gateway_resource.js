const aws = require("aws-sdk");
const async = require("async");
const awsResponse = require("./aws_response");
const integrationTemplate = require("./templates/integration");
const integrationResponses = require("./templates/integration_responses");
const selectionPatterns = require("./selection_patterns");
const log = require("./log");
const _ = require("underscore")._;

const statusCodesMap = {
  "200": {
    selectionPattern: null,
    responseTemplates: {
      "application/json": integrationResponses.standard
    }
  },
  "201": {
    selectionPattern: selectionPatterns.regex["201"],
    responseTemplates: {
      "application/json": ""
    }
  },
  "301": {
    selectionPattern: selectionPatterns.regex["301"],
    responseTemplates: {
      "application/json": ""
    }
  },
  "302": {
    selectionPattern: selectionPatterns.regex["302"],
    responseTemplates: {
      "application/json": ""
    }
  },
  "404": {
    selectionPattern: selectionPatterns.regex["404"],
    responseTemplates: {
      "application/json": integrationResponses.error
    }
  },
};

const methodResponsesParameters = {
  "200": null,
  "201": {
    "method.response.header.Location": true
  },
  "301": {
    "method.response.header.Location": true
  },
  "302": {
    "method.response.header.Location": true
  },
  "404": null
};

const integrationResponsesParameters = {
  "200": null,
  "201": {
    "method.response.header.Location": "integration.response.body.errorMessage"
  },
  "301": {
    "method.response.header.Location": "integration.response.body.errorMessage"
  },
  "302": {
    "method.response.header.Location": "integration.response.body.errorMessage"
  },
  "404": null
};

class ApiGatewayResource {
  constructor(apiGw, parentResourceId, methods, path, fullpath) {
    this._apiGw = apiGw;
    this._methods = methods;
    this._path = path;
    this._fullpath = fullpath;
    this._region = process.env.AWS_REGION;
    this._awsApiGw = new aws.APIGateway({ region: this._region });
    this._awsLambda = new aws.Lambda({ region: this._region });
    this.resourceId = null;
    this.parentResourceId = parentResourceId;
  }

  build(cb) {
    var tasks = [this._createResource.bind(this)];
    if (this._methods.length) {
      log.info(`Building ${this._methods.join(", ")} ${this._fullpath}`);
      var methodTasks = this._methods.map((m) => {
        return [
          this._createMethod.bind(this, m),
          this._createMethodResponses.bind(this, m)
        ];
      });
      tasks = tasks.concat(_.flatten(methodTasks));
    } else {
      tasks = tasks.concat((cb) => {
        awsResponse.log("Skipping method and method response creation");
        cb();
      })      
    }
    async.series(tasks, cb);
  }

  integrateToLambda(lambda, cb) {
    log.info(`Integrating ${this._methods.join(", ")} ${this._fullpath} to lambda ${lambda.name}`);
    var tasks = _.flatten(this._methods.map((m) => {
      return [
        this._createIntegration.bind(this, m, lambda),
        this._createIntegrationResponse.bind(this, m),
        this._authorizeLambdaInvocation.bind(this, m, lambda, process.env.AWS_ENVIRONMENT),
        this._authorizeLambdaInvocation.bind(this, m, lambda, "*")
      ]
    }));
    async.series(tasks, cb);
  }

  _createIntegration(method, lambda, cb) {
    // note: lambda functions must be called with a POST integrationHttpMethod
    this._awsApiGw.putIntegration({
      restApiId: this._apiGw.id,
      resourceId: this.resourceId,
      httpMethod: method,
      integrationHttpMethod: "POST",
      type: "AWS",
      uri: this._lambdaIntegrationUri(lambda),
      requestTemplates: {
        "application/json" : integrationTemplate
      }
    }, awsResponse.cb("putIntegration", cb));
  }

  _authorizeLambdaInvocation(method, lambda, stage, cb) {
    this._awsLambda.addPermission({
      Action: "lambda:InvokeFunction",
      FunctionName: lambda.name,
      Principal: "apigateway.amazonaws.com",
      StatementId: `apigateway-${this._apiGw.name}-${+ new Date}`,
      SourceArn: `arn:aws:execute-api:${this._region}:${this._apiGw.accountNum}:${this._apiGw.id}/${stage}/${method}${this._fullpath}`
    }, awsResponse.cb("addPermission", cb));
  }

  _createResource(cb) {
    if (this._path) {
      this._awsApiGw.createResource({
        restApiId: this._apiGw.id,
        parentId: this.parentResourceId,
        pathPart: this._path
      }, awsResponse.cb("createResource", cb, (data) => {
        this.resourceId = data.id;
      }));
    } else {
      // when no path is specified, we don't need to create a resource - using the top level
      awsResponse.log("Skipping resource creation");
      this.resourceId = this.parentResourceId;
      cb();
    }
  }

  _createMethod(method, cb) {
    this._awsApiGw.putMethod({
      restApiId: this._apiGw.id,
      resourceId: this.resourceId,
      httpMethod: method,
      authorizationType: "NONE"
    }, awsResponse.cb("putMethod", cb));
  }

  _createIntegrationResponse(method, cb) {
    var requests = Object.keys(statusCodesMap).map((code) => {
      return (cb) => {
        this._awsApiGw.putIntegrationResponse({
          restApiId: this._apiGw.id,
          resourceId: this.resourceId,
          httpMethod: method,
          statusCode: code,
          responseTemplates: statusCodesMap[code].responseTemplates,
          selectionPattern: statusCodesMap[code].selectionPattern,
          responseParameters: integrationResponsesParameters[code]
        }, awsResponse.cb("putIntegrationResponse-" + code, cb));
      };
    });
    async.series(requests, cb);
  }

  _createMethodResponses(method, cb) {
    var requests = Object.keys(statusCodesMap).map((code) => {
      return (cb) => {
        this._awsApiGw.putMethodResponse({
          restApiId: this._apiGw.id,
          resourceId: this.resourceId,
          httpMethod: method,
          statusCode: code,
          responseModels: {
            "application/json": "Empty"
          },
          responseParameters: methodResponsesParameters[code]
        }, awsResponse.cb("putMethodResponse-" + code, cb));
      };
    });
    async.series(requests, cb);
  }

  _lambdaIntegrationUri(lambda) {
    return `arn:aws:apigateway:${this._region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${this._region}:${this._apiGw.accountNum}:function:${lambda.name}/invocations`;
  }
}

module.exports = ApiGatewayResource;
