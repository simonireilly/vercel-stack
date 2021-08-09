import * as sst from '@serverless-stack/resources';
import { StackProps } from '@serverless-stack/resources';
import { AuthStack } from './AuthStack';

export default function main(app: sst.App): void {
  // Set default runtime for all functions
  app.setDefaultFunctionProps({
    runtime: 'nodejs12.x',
  });

  new AuthStack(app, 'auth-stack');
}
