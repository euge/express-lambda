const selectionPatterns = require("../selection_patterns");

module.exports = {
  error: `
#set ($errorMessage = $input.path('$.errorMessage'))
#set ($response = $errorMessage.split("${selectionPatterns.responseDelimeter}"))
$response[1]
`,

  standard: `
#set ($message = $input.path('$'))
#set ($response = $message.split("${selectionPatterns.responseDelimeter}"))
$response[1]
`
};