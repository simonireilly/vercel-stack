// Send secrets to vercel preview environment
//
// 1. Run describe stacks and get secrets
// 2. Post each secret to vercel using secure token

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

const https = require('https');
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

// For each env var, send to vercel

try {
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
} catch (e) {
  console.error('Failed to send stack outputs to Vercel', e);
}
