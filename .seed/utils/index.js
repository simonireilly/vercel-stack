// Dependencies
const https = require('https');

const getBranchName = (remoteBranchName, remote = 'remotes/origin/') => {
  const regex = new RegExp(`^${remote}(?<branchName>.*)$`);
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

const requestOptions = () => ({
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v8/projects/${String(process.env.VERCEL_PROJECT_ID)}/env`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${String(process.env.VERCEL_TOKEN)}`,
  },
});

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

module.exports = {
  getBranchName,
  vercel: {
    writeSecret,
  },
};
