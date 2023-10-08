import core from '@actions/core';
import github from '@actions/github';

/**
 * Uploads a assets to a GitHub release.
 */
export async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    octokit.rest;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const releaseTag = core.getInput('release', { required: true });
    const assets = core.getInput('assets', { required: true });

    // Upload all assets
    const release = await getReleaseByTag(octokit, releaseTag);
    const downloadUrls = await Promise.all(
      assets.map(asset => uploadAsset(octokit, release, asset))
    );

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('download_urls', downloadUrls);
  } catch (error) {
    core.setFailed(error.message);
  }
}

/**
 * Return the release of a given ID.
 *
 * @param { import('@octokit/plugin-rest-endpoint-methods/dist-types/types').Api } octokit
 * @returns { Promise<import('@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types').RestEndpointMethodTypes["repos"]["getReleaseByTag"]["response"]> } Returns the browser_download_url for the uploaded release asset
 */
async function getReleaseByTag(octokit, tag) {
  const { repo } = github.context;
  return await octokit.rest.repos.getReleaseByTag({
    owner: repo.owner,
    repo: repo.repo,
    tag,
  });
}

/**
 * Uploads an asset to a GitHub release and returns the browser_download_url for the uploaded release asset.
 *
 * @param { import('@octokit/plugin-rest-endpoint-methods/dist-types/types').Api } octokit
 * @param { import('@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types').RestEndpointMethodTypes["repos"]["getReleaseByTag"]["response"] } release
 * @param { string } assetName
 * @returns { Promise<string> } Returns the browser_download_url for the uploaded release asset
 */
async function uploadAsset(octokit, release, assetName) {
  const uploadAssetResponse = await octokit.rest.repos.uploadReleaseAsset({
    url: release.data.upload_url,
    headers,
    name: assetName,
    file: fs.readFileSync(assetPath),
  });

  // Get the browser_download_url for the uploaded release asset from the response
  return uploadAssetResponse.data.browser_download_url;
}
