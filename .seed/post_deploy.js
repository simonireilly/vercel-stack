// Send secrets to vercel preview environment
//
// 1. Run describe stacks and get secrets
// 2. Post each secret to vercel using secure token

const https = require('https');
const { getBranchName } = require('./utils');

const allowedEnvVars = ['COGNITO_CLIENT_ID', 'COGNITO_DOMAIN'];
const stackOutputs = process.argv.slice(2);
const remoteBranchName = execSync(
  `git name-rev --name-only --exclude=tags/ ${String(
    process.env.SEED_BUILD_SERVICE_SHA
  )}`
);

const gitBranch = getBranchName(remoteBranchName.toSting());

console.debug(`Assigning Stack outputs to branch '${gitBranch}'`, {
  stackOutputs,
});

let keyValuePairs;

try {
  keyValuePairs = JSON.parse(stackOutputs.join(''));
} catch (e) {
  console.error('Stack inputs were not valid JSON', e);
}

console.debug('Passed arguments', {
  keyValuePairs,
});

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
    const value = keyValuePairs.find(
      (entry) => entry['OutputKey'] === key.replaceAll('_', '')
    )['OutputValue'];
    setEnvVarInVercel(key, value, gitBranch);
  }
} catch (e) {
  console.error('Failed to send stack outputs to Vercel', e);
}
