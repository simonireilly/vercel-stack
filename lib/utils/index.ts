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
      `https://${vercelProjectName}-git-${getBranchName().replace(
        /\//g,
        '-'
      )}-simonireilly.vercel.app/api/auth/callback/cognito`,
    ],
    logoutUrls: [
      `https://${vercelProjectName}-git-${getBranchName().replace(
        /\//g,
        '-'
      )}-simonireilly.vercel.app`,
    ],
  };
};

const getBranchName = (): string =>
  execSync('git rev-parse --abbrev-ref HEAD').toString();
