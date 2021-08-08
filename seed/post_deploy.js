// Send secrets to vercel preview environment
//
// 1. Run describe stacks and get secrets
// 2. Post each secret to vercel using secure token

const AWS = require('aws-sdk');
