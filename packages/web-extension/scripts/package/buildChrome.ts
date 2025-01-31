import path from 'path';
import { zip } from 'zip-a-folder';
import { bash, CODE, RESET, rootPath, run, title } from '../utils';
import { PackageConfig } from './config';

/**
 * Just build a zip asset to be uploaded to github and the chrome web store
 */
export async function buildChrome(config: PackageConfig) {
  title('Chrome');
  const chromeZip = path.join(config.OUTPUT_DIR, `chrome-${config.PACKAGE_MODE}.zip`);
  const dist = rootPath('dist');

  await run(`Building ${CODE}dist/${RESET} for Chrome`, () =>
    bash(`pnpm vite build`, {
      BUILD_MODE: config.PACKAGE_MODE,
      BUILD_FOR: 'chrome',
    })
  );

  await run(`Creating ${CODE}${chromeZip}`, () => zip(dist, chromeZip));
}
