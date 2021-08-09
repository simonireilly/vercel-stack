const { execSync } = require('child_process');
const https = require('https');
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
const gitBranch = getBranchName(remoteBranchName.toSting());
console.info(`Branch name is '${gitBranch}'`);

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v8/projects/${String(process.env.VERCEL_PROJECT_ID)}/env`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${String(process.env.VERCEL_TOKEN)}`,
  },
};

const bodyTemplate = (key, value, gitBranch) => ({
  type: 'encrypted',
  key,
  value,
  target: ['preview'],
  gitBranch,
});

const setEnvVarInVercel = (key, value, gitBranch) => {
  const requestOptions = {
    ...options,
    ...bodyTemplate(key, value, gitBranch),
  };
  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
      process.stdout.write(d);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.end();
};

// For each env var, send to vercel
try {
  for (const key in allowedEnvVars) {
    console.info(`Sending ${key} to vercel environment API`);

    const value = keyValuePairs.find(
      (entry) => entry['OutputKey'] === key.replaceAll(/_/g, '')
    )['OutputValue'];
    setEnvVarInVercel(key, value, gitBranch);
  }
} catch (e) {
  console.error('Failed to send stack outputs to Vercel', e);
}

console.info('Completed sending');
