import * as sst from '@serverless-stack/resources';
import * as cdk from '@aws-cdk/core';
import { PrincipalTagAttributeMap } from './custom-resources/SetPrincipalIdentityAttributesCognito';
import {
  OAuthScope,
  StringAttribute,
  UserPoolOperation,
} from '@aws-cdk/aws-cognito';
import { Policy, PolicyStatement } from '@aws-cdk/aws-iam';

export class AuthStack extends sst.Stack {
  public readonly auth: sst.Auth;

  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);

    // Add cognito auth
    this.auth = new sst.Auth(this, 'BaseAuth', {
      cognito: {
        userPool: {
          // Users will login using their email and password
          signInAliases: { email: true, phone: true },
          customAttributes: {
            // Require a uuidV4 for the org id
            org: new StringAttribute({
              minLen: 36,
              maxLen: 36,
              mutable: true,
            }),
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        },
        userPoolClient: {
          oAuth: {
            flows: {
              authorizationCodeGrant: true,
            },
            scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
            callbackUrls: [
              `${process.env.WEBSITE_URL}/api/auth/callback/cognito`,
            ],
            logoutUrls: [String(process.env.WEBSITE_URL)],
          },
        },
      },
    });

    const domain = this.auth?.cognitoUserPool?.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `${process.env.COGNITO_DOMAIN}-${this.stackName}-${this.stage}`,
      },
    });

    const postConfirmationFunction = new sst.Function(
      this,
      'PostConfirmationFunction',
      {
        handler: 'src/lambda.postConfirmation',
      }
    );

    this.auth.cognitoUserPool?.addTrigger(
      UserPoolOperation.POST_CONFIRMATION,
      postConfirmationFunction
    );

    postConfirmationFunction.role?.attachInlinePolicy(
      new Policy(this, 'UserPoolPolicy', {
        statements: [
          new PolicyStatement({
            sid: 'AllowPostConfirmationToModifyAttributes',
            actions: ['cognito-idp:AdminUpdateUserAttributes'],
            resources: [this.auth.cognitoUserPool?.userPoolArn || ''],
          }),
        ],
      })
    );

    /**
     * Take custom:org from the cognito id token, and forward it to the cognito
     * federated identity
     */
    new PrincipalTagAttributeMap(this, 'MultiTenancyCognitoConfig', {
      cognitoIdentityPoolRef: this.auth.cognitoCfnIdentityPool.ref,
      userPoolId: this.auth.cognitoUserPool?.userPoolId || '',
      principalTags: {
        org: 'custom:org',
        username: 'sub',
        client: 'aud',
      },
    });

    this.addOutputs({
      COGNITO_IDENTITY_POOL_ID: this.auth.cognitoCfnIdentityPool.ref,
      COGNITO_USER_POOL_ID: this.auth.cognitoUserPool?.userPoolId || '',
      COGNITO_CLIENT_ID:
        this.auth.cognitoUserPoolClient?.userPoolClientId || '',
      COGNITO_DOMAIN: `${domain?.domainName}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
