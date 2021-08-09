// Send secrets to vercel preview environment
//
// 1. Run describe stacks and get secrets
// 2. Post each secret to vercel using secure token

const allowedEnvVarMap = ['COGNITO_CLIENT_ID', 'COGNITO_DOMAIN'];
const https = require('https');
const stackOutputs = process.argv.slice(2);

console.debug('Raw stack outputs', {
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

const setEnvVarInVercel = (key, value) => {
  const requestOptions = {
    ...options,
    ...bodyTemplate(key, value),
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
    setEnvVarInVercel(key, value);
  }
} catch (e) {
  console.error('Failed to send stack outputs to Vercel', e);
}
