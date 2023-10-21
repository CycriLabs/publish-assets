import core from '@actions/core';
import github from '@actions/github';
import fs from 'fs';
import mime from 'mime-types';
import { sep } from 'path';
import { readFilesRecursively } from './utils.js';

/**
 * Uploads a assets to a GitHub release.
 */
export async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const releaseTag = core.getInput('release_tag') || 'latest';
    const assetDir = core.getInput('asset_dir', { required: true });
    core.info(`Uploading assets from '${assetDir}' to tag '${releaseTag}'.`);

    // Load release data from the release specified by the tag
    const release = await getReleaseByTag(octokit, releaseTag);
    core.info(`Found release ${release.data.name} (${release.data.tag_name}).`);

    // Read assets from the given asset directory
    const assets = await readAssets(assetDir);

    // Upload each asset and wait for all uploads to complete
    const downloadUrls = await Promise.all(
      assets.map(asset => uploadAsset(octokit, release, asset))
    );

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.info(downloadUrls.map(url => `Download URL: ${url}`).join('\n'));
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
  return tag === 'latest'
    ? octokit.rest.repos.getLatestRelease({
        owner: repo.owner,
        repo: repo.repo,
      })
    : octokit.rest.repos.getReleaseByTag({
        owner: repo.owner,
        repo: repo.repo,
        tag,
      });
}

async function readAssets(assetDir) {
  const assets = await readFilesRecursively(assetDir);
  return assets.map(asset => ({
    path: asset,
    name: asset.substring(asset.lastIndexOf(sep) + 1),
  }));
}

/**
 * Uploads an asset to a GitHub release and returns the browser_download_url for the uploaded release asset.
 *
 * @param { import('@octokit/plugin-rest-endpoint-methods/dist-types/types').Api } octokit
 * @param { import('@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types').RestEndpointMethodTypes["repos"]["getReleaseByTag"]["response"] } release
 * @param { object } asset
 * @returns { Promise<string> } Returns the browser_download_url for the uploaded release asset
 */
async function uploadAsset(octokit, release, asset) {
  const { name, path } = asset;
  const headers = {
    'content-type': mime.lookup(asset.path) || 'application/octet-stream', // fallback if lookup fails
  };
  const url = release.data.upload_url;

  core.info(
    `Uploading asset '${name}' from '${path}' to '${url}' with type '${headers['content-type']}'.`
  );

  const uploadAssetResponse = await octokit.rest.repos.uploadReleaseAsset({
    url,
    headers,
    name,
    file: fs.readFileSync(path),
  });

  // Get the browser_download_url for the uploaded release asset from the response
  return uploadAssetResponse.data.browser_download_url;
}
