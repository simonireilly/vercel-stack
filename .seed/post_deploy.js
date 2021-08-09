const { execSync } = require('child_process');
const { getBranchName } = require('./utils');

console.info('Booting...');

console.info('Looking for stack outputs');
const allowedEnvVars = ['COGNITO_CLIENT_ID', 'COGNITO_DOMAIN'];
let keyValuePairs;
const stackOutputs = process.argv.slice(2);
try {
  keyValuePairs = JSON.parse(stackOutputs.join(''));
} catch (e) {
  console.error('Stack inputs were not valid JSON', e);
}
console.info('Outputs from described stack', { keyValuePairs });

console.info('Getting branch name');
const remoteBranchName = execSync(
  `git name-rev --name-only --exclude=tags/ ${String(
    process.env.SEED_BUILD_SERVICE_SHA
  )}`
);
console.info(`Remote branch is '${remoteBranchName.toString()}'`);
const gitBranch = getBranchName(remoteBranchName.toString());
console.info(`Branch name is '${gitBranch}'`);

// Write secrets
const sendSecrets = async () => {
  let promises = [];

  for (const key in allowedEnvVars) {
    const outputKey = key.replace(/_/g, '')
    console.info(`Look for outputs key ${outputKey}`)

    const value = keyValuePairs.find(
      (entry) => entry['OutputKey'] ===
    )['OutputValue'];
    promises.push(writeSecret(key, value, gitBranch));
  }

  try {
    Promise.all(promises);
  } catch (e) {
    console.error('Failed to send stack outputs to Vercel', e);
  }
};

console.info('Sending secrets');
sendSecrets();
console.info('Completed sending');
