import { execSync } from 'child_process';
import { OAuthSettings } from '@aws-cdk/aws-cognito';

export const callbackUrls = (
  vercelProjectName: string
): Pick<OAuthSettings, 'callbackUrls' | 'logoutUrls'> => {
  if (process.env.IS_LOCAL) {
    return {
      callbackUrls: [`http://localhost:3000/api/auth/callback/cognito`],
      logoutUrls: [`http://localhost:3000`],
    };
  }

  return {
    callbackUrls: [
      `https://${vercelProjectName}-git-${branchName().replace(
        /\//g,
        '-'
      )}-simonireilly.vercel.app/api/auth/callback/cognito`,
    ],
    logoutUrls: [
      `https://${vercelProjectName}-git-${branchName().replace(
        /\//g,
        '-'
      )}-simonireilly.vercel.app`,
    ],
  };
};

/**
 * Given a remote branch, return the plain form of the branch name
 * @param {string} remoteBranchName
 * @param {string} remote
 */
const getBranchName = (
  remoteBranchName: string,
  remote = 'remotes/origin/'
): string => {
  const regex = new RegExp(`^${remote}(?<branchName>.*)$`, 'gm');
  const {
    //@ts-ignore
    groups: { branchName },
  } = regex.exec(remoteBranchName);

  return branchName;
};

const branchName = (): string => {
  const fullBranchName = execSync(
    `git name-rev --name-only --exclude=tags/ ${String(
      process.env.SEED_BUILD_SERVICE_SHA
    )}`
  );

  return getBranchName(fullBranchName.toString());
};
