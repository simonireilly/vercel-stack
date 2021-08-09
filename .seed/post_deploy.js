console.info('Booting...');
const { execSync } = require('child_process');
const { getBranchName, sendSecrets } = require('./utils');
const allowedEnvVars = ['COGNITO_CLIENT_ID', 'COGNITO_DOMAIN'];
let keyValuePairs;

//
// Get formatted outputs from Stack
//
console.info('Preparing to forward the following outputs', { allowedEnvVars });
console.info('Looking for stack outputs');
const stackOutputs = process.argv.slice(2);
try {
  keyValuePairs = JSON.parse(stackOutputs.join(''));
} catch (e) {
  console.error('Stack inputs were not valid JSON', e);
}
console.info('Outputs from described stack', { keyValuePairs });

//
// Get branch name
//
console.info('Getting branch name');
const remoteBranchName = execSync(
  `git name-rev --name-only --exclude=tags/ ${String(
    process.env.SEED_BUILD_SERVICE_SHA
  )}`
);
console.info(`Remote branch is '${remoteBranchName.toString()}'`);
const gitBranch = getBranchName(remoteBranchName.toString());
console.info(`Branch name is '${gitBranch}'`);

//
// Send secrets
//
console.info('Sending secrets');
sendSecrets(allowedEnvVars, keyValuePairs, gitBranch);
console.info('Completed sending');

module.exports = {
  sendSecrets,
};
