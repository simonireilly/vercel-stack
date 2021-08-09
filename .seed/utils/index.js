// Dependencies
const https = require('https');

/**
 * Given a remote branch, return the plain form of the branch name
 * @param {string} remoteBranchName
 * @param {string} remote
 */
const getBranchName = (remoteBranchName, remote = 'remotes/origin/') => {
  const regex = new RegExp(`^${remote}(?<branchName>.*)$`, 'gm');
  const {
    groups: { branchName },
  } = regex.exec(remoteBranchName);

  return branchName;
};

/**
 * Build POST request body for vercel secret setting
 * @param {string} key
 * @param {string} value
 * @param {string} gitBranch
 */
const requestBody = (key, value, gitBranch) => ({
  type: 'encrypted',
  key,
  value,
  target: ['preview'],
  gitBranch,
});

/**
 * Build the request options for vercel
 *
 * @param {string} projectId
 * @param {string} authToken
 */
const requestOptions = (
  projectId = process.env.VERCEL_PROJECT_ID,
  authToken = process.env.VERCEL_TOKEN
) => ({
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v8/projects/${String(projectId)}/env`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${String(authToken)}`,
  },
});

/**
 * Send POST request to vercel
 *
 * @param {string} key
 * @param {string} value
 * @param {string} gitBranch
 */
const writeSecret = (key, value, gitBranch) => {
  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions(), (res) => {
      res.on('data', (d) => {
        process.stdout.write(d);
      });

      res.on('end', () => {
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(error);
      reject(err);
    });

    const data = requestBody(key, value, gitBranch);
    console.info(`Sending ${key} to vercel environment API for ${gitBranch}`);

    req.write(JSON.stringify(data));

    req.end();
  });
};

/**
 * Takes a collection of allowed environment variables, finds their values in the
 * outputs and sends them to vercel
 *
 * @param {string[]} allowedEnvVars Strings of environment var names
 * @param {{OutputKey: string, OutputValue: string}[]} keyValuePairs Outputs from the stack as an object
 * @param {string} gitBranch
 */
const sendSecrets = async (allowedEnvVars, keyValuePairs, gitBranch) => {
  let promises = [];

  for (const key of allowedEnvVars) {
    console.info(`Look for outputs key ${key}`);
    const outputKey = key.replace(/_/g, '');
    console.info(`Look for outputs key ${outputKey}`);

    const output = keyValuePairs.find(
      (entry) => entry['OutputKey'] === outputKey
    );
    if (output) {
      const value = output['OutputValue'];
      promises.push(writeSecret(key, value, gitBranch));
    }
  }

  try {
    return Promise.all(promises);
  } catch (e) {
    console.error('Failed to send stack outputs to Vercel', e);
  }
};

module.exports = {
  getBranchName,
  sendSecrets,
  vercel: {
    writeSecret,
  },
};
