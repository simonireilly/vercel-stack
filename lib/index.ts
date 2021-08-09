import * as sst from '@serverless-stack/resources';
import { StackProps } from '@serverless-stack/resources';
import { AuthStack } from './AuthStack';

export interface VercelStackProps extends StackProps {
  vercel: {
    projectName: string;
  };
}

const vercelProps: VercelStackProps['vercel'] = {
  projectName: 'vercel-stack',
};

export default function main(app: sst.App): void {
  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs12.x',
  });

  const auth = new AuthStack(app, 'auth-stack');
}
