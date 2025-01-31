import merge from 'lodash.merge';
import { readJsonFile } from 'vite-plugin-web-extension';
import { Manifest } from 'webextension-polyfill';
import {
  PAGE_ACTION_MATCHES,
  ParentHosts,
  PlayerHosts,
} from '../src/common/utils/compile-time-constants';
import { isDev, rootPath } from './utils';

interface GenerateManifestConfig {
  mode: ExtensionMode;
  browser: SupportedBrowser;
}

const suffixes: Record<ExtensionMode, string> = {
  prod: '',
  beta: ' (Beta)',
  staged: ' (Staged)',
  test: ' (Dev)',
  dev: ' (Dev)',
};

function removeLocalhostForProd(config: GenerateManifestConfig, matches: string[]): string[] {
  return matches.filter(match => isDev(config.mode) || !match.includes('localhost'));
}

function getContentScriptMatches(config: GenerateManifestConfig): string[] {
  return removeLocalhostForProd(
    config,
    Array.from(new Set([...Object.values(ParentHosts), ...Object.values(PlayerHosts)]))
  );
}

export function generateManifest(config: GenerateManifestConfig): Manifest.WebExtensionManifest {
  const manifestTemplate = readJsonFile(rootPath('src/manifest.template.json'));
  const pkg = readJsonFile(rootPath('package.json'));
  const name = pkg.displayName + suffixes[config.mode];
  const contentScriptMatches = getContentScriptMatches(config);

  return merge(manifestTemplate, {
    name,
    description: pkg.description,
    version: pkg.version,
    '{{chrome}}.action': {
      default_title: name,
    },
    '{{firefox}}.page_action': {
      default_title: name,
      show_matches: removeLocalhostForProd(config, PAGE_ACTION_MATCHES),
    },
    content_scripts: [
      {
        matches: contentScriptMatches,
      },
      {
        matches: removeLocalhostForProd(config, Object.values(PlayerHosts)),
      },
    ],
  });
}
