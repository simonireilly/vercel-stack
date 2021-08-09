const getBranchName = (remoteBranchName, remote = 'remotes/origin/') => {
  const regex = new RegExp(`^${remote}(?<branchName>.*)$`);
  const {
    groups: { branchName },
  } = regex.exec(remoteBranchName);

  return branchName;
};

module.exports = {
  getBranchName,
};
