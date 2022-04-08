const core = require('@actions/core')
const github = require('@actions/github')

run()


async function run() {
  try {
    const title = github.context.payload.pull_request.title
    core.info(`The title of PR is ${title}`)
    const prNumber = github.context.payload.pull_request.number
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    const client = getOctokit()
    await addLabelForTitle(client, prNumber, owner, repo, title)
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getOctokit() {
  const gh_token = process.env.GITHUB_TOKEN
  const octokit = github.getOctokit(token=gh_token)
  return octokit
}

async function addLabelForTitle(client, prNumber, owner, repo, title) {
  let labelToAdd = 'UnrelatedToToken'
  let labelsToRemove = ["NewToken", "UpdateToken"]
  if (title.startsWith('feat[NewToken]:')) {
    labelToAdd = "NewToken"
    labelsToRemove = ["UpdateToken", "UnrelatedToToken"]
  } else if (title.startsWith('feat[UpdateToken]:')) {
    labelToAdd = "UpdateToken"
    labelsToRemove = ["NewToken", "UnrelatedToToken"]
  }

  try {
    await removeLabels(client, prNumber, owner, repo, labelsToRemove)
  } catch (e) {}
  await addLabel(client, prNumber, owner, repo, labelToAdd)
}

async function removeLabels(client, prNumber, owner, repo, labels) {
  await Promise.all(
    labels.map((label) =>
      client.rest.issues.removeLabel({
        owner: owner,
        repo: repo,
        issue_number: prNumber,
        name: label,
      })
    )
  );
}

async function addLabel(client, prNumber, owner, repo, label) {
  core.info(`Adding label (${label}) to PR...`);
  let resp = await client.rest.issues.addLabels({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
    labels: [label],
  });
  core.info(`Added label (${label}) to PR - ${resp.status}`)
  if (resp.status > 299) {
    throw new Error("add label failed")
  }
}