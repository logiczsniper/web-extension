import ui from '@anime-skip/ui';
import { createApp } from 'vue';
import 'vue-global-api';
import FakeRouterLink from '~/common/components/FakeRouterLink.vue';
import '~/common/styles';
import { debug, loadedLog, log, warn } from '~/common/utils/log';
import Container from './Container.vue';

// TODO git mv to player-ui
export function loadPlayerUi() {
  loadedLog('content-scripts/player-ui/index.ts');

  // Setup Globals

  window.onVideoChanged(video => {
    video.controls = false;
    // video.autoplay = true;
  });

  // Clean DOM

  const existingPlayers = document.querySelectorAll('#AnimeSkipPlayer');
  if (existingPlayers.length > 0) {
    debug('Player already added, removing');
    existingPlayers.forEach(player => {
      player.remove();
    });
  }

  async function sleep(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  // Inject DOM

  async function injectPlayer() {
    const rootQuery = window.getRootQuery();
    const waitBeforePlayerInjection =
      window.waitBeforePlayerInjection ?? (() => document.querySelector(rootQuery) != null);
    debug(`Adding player to ${rootQuery}`);

    while (!waitBeforePlayerInjection()) {
      debug("Player's wait for node not found, trying again");
      await sleep(100);
    }

    try {
      const container = document.createElement('div');

      const app = createApp(Container).use(ui).component('RouterLink', FakeRouterLink);
      const mountedApp = app.mount(container);

      document.querySelector(rootQuery)?.appendChild(mountedApp.$el);

      setInterval(() => {
        if (!document.getElementById('AnimeSkipPlayer')) {
          const root = document.querySelector(rootQuery);
          root?.appendChild(mountedApp.$el);
          root?.classList.add('hide-for-anime-skip');
        }
      }, 1000);

      debug(`Added player to ${rootQuery}`);
    } catch (err) {
      warn('Failed to inject player UI', err);
    }
  }

  if (window.doNotReplacePlayer?.()) {
    log('Did not inject Anime Skip on purpose');
  } else {
    injectPlayer();
  }
}
