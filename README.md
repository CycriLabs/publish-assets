# Publish Assets Github Action

This action publishes assets to a GitHub release.

## Inputs

### `release_tag`

The tag of the GitHub release to upload assets to. Defaults to `"latest"`.

### `asset_dir`

The directory that contains all assets to upload. 

## Outputs

### `download_urls`

A list of all the download URLs for the uploaded assets.

## Example usage

```yaml
uses: CycriLabs/publish-assets@v1
with:
  release_tag: '1.0.0'
  asset_dir: 'target/distributions'
```
