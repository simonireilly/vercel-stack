const { getBranchName, vercel } = require('.');
const nock = require('nock');

describe('utilities', () => {
  describe('getBranchName', () => {
    it('retrieves the end of the path string', () => {
      const branchName = getBranchName('remotes/origin/feat/auth-2');

      expect(branchName).toEqual('feat/auth-2');
    });
  });

  describe('vercel', () => {
    beforeEach(() => {
      nock.disableNetConnect();
      nock.cleanAll();
      process.env.VERCEL_PROJECT_ID = 'test_id';
    });

    it('writes a secret', async () => {
      const scope = nock('https://api.vercel.com')
        .post('/v8/projects/test_id/env', {
          type: 'encrypted',
          key: 'SECRET_NAME',
          value: 'secretValu3',
          target: ['preview'],
          gitBranch: 'simons/branch-1',
        })
        .reply(200, 'path using function matched');

      await vercel.writeSecret('SECRET_NAME', 'secretValu3', 'simons/branch-1');

      expect(scope.isDone()).toEqual(true);
    });
  });
});
