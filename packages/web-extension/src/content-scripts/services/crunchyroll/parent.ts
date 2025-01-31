import { loadedLog, log } from '~/common/utils/log';
import setupParent from '~/common/utils/setupParent';
import { waitUntil } from '~utils/time';

async function getEpisodeInfo() {
  const pageHasLoaded = () =>
    Promise.resolve(
      document.querySelector('.erc-current-media-info') != null ||
        document.querySelector('#showmedia_about_media') != null
    );
  log('Waiting for page to load...');
  await waitUntil(pageHasLoaded, 10 * 1000, 1, 200);
  log('Page has loaded!');

  // X - 06/2021 (Crunchyroll Classic)
  if (document.querySelector('#showmedia_about_media a') != null) {
    const show = document.querySelector('#showmedia_about_media a')?.textContent?.trim();
    const number = /([0-9]+)/.exec(
      document.querySelectorAll('#showmedia_about_media h4')?.[1]?.textContent ?? ''
    )?.[1];
    const dirtyName = document.querySelector('#showmedia_about_name')?.textContent?.trim();
    const name = !dirtyName ? undefined : dirtyName.substring(1, dirtyName.length - 1);

    return {
      show,
      name,
      number,
    };
  }

  // 06/2021 - Current
  if (document.querySelector('.erc-current-media-info .show-title-link') != null) {
    const show = document.querySelector('.erc-current-media-info .show-title-link')?.textContent;
    const episodeAndNumber =
      document.querySelector('.erc-current-media-info .title')?.textContent ?? '';
    const groups = /([0-9]+)\s*-\s*(.+)$/.exec(episodeAndNumber);
    const episode = groups?.[2];
    const number = groups?.[1];

    return {
      show: show || undefined,
      name: episode || undefined,
      number: number || undefined,
    };
  }

  return {};
}

export function initCrunchyrollParent() {
  loadedLog('content-scripts/services/crunchyroll/parent.ts');
  setupParent('crunchyroll', { getEpisodeInfo });
}
