var SibApiV3Sdk = require("sib-api-v3-sdk");

var defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
var apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey =
  "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";

module.exports = new SibApiV3Sdk.TransactionalEmailsApi();
