# Publish Assets Github Action

This action publishes assets to a GitHub release.

## Inputs

### `release`

The ID of the GitHub release to upload assets to. Defaults to `"latest"`.

### `assets`

A list of assets to upload. Defaults to `"[]"`.

## Outputs

### `download_urls`

A list of all the download URLs for the uploaded assets.

## Example usage

```yaml
uses: CycriLabs/publish-assets@v1
with:
  assets: ['fileA.exe']
```
