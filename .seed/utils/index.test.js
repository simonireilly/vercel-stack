const { getBranchName } = require('.');

describe('getBranchName', () => {
  it('retrieves teh end of the path string', () => {
    const branchName = getBranchName('remotes/origin/feat/auth-2');

    expect(branchName).toEqual('feat/auth-2');
  });
});
