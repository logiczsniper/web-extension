import { persistedKeys } from '@/common/utils/Constants';
import Browser from '@/common/utils/Browser';
import Vue from 'vue';
import { Mutation } from 'vuex';
import types from './mutationTypes';
import { as } from '../utils/GlobalUtils';
import RequestState from '../utils/RequestState';

// Helpers /////////////////////////////////////////////////////////////////////

async function persistAccount(state: VuexState): Promise<void> {
  for (const key of persistedKeys) {
    await Browser.storage.setItem(key, state[key]);
  }
}

function loginRequestState(state: VuexState, loginRequestState: RequestState): void {
  state.loginRequestState = loginRequestState;
  Browser.storage.setItem('loginRequestState', loginRequestState);
}

function changePlaybackRate(state: VuexState, playbackRate: RequestState): void {
  state.playbackRate = playbackRate;
  Browser.storage.getItem('playbackRate').then(storedRate => {
    if (storedRate !== playbackRate) {
      Browser.storage.setItem('playbackRate', playbackRate);
    }
  });

  const video = global.getVideo();
  if (video) {
    video.playbackRate = playbackRate || 1;
  }
}

// Mutations ///////////////////////////////////////////////////////////////////

export default as<
  {
    [type in ValueOf<typeof types>]: Mutation<VuexState>;
  }
>({
  // General
  [types.activeDialog](state, dialogName: string | undefined) {
    state.activeDialog = dialogName;
  },
  [types.changePlaybackRate]: changePlaybackRate,
  [types.toggleEditMode](state, isEditing: boolean) {
    state.isEditing = isEditing;
  },

  // Storage
  [types.restoreState](
    state,
    { changes, callback }: { changes: Partial<VuexState>; callback?: () => void }
  ) {
    for (const field in changes) {
      if (state.hasOwnProperty(field)) {
        if (field === 'playbackRate') {
          const playbackRate = (changes[field] as number) || 1;
          changePlaybackRate(state, playbackRate);
        } else {
          // @ts-ignore
          Vue.set(state, field, changes[field]);
        }
      }
    }
    if (callback) callback();
  },
  [types.persistPreferences](state, payload: Api.Preferences) {
    if (!state.account) {
      console.warn('updatePreference() called without account in the store');
      return;
    }
    Vue.set(state.account, 'preferences', payload);
    persistAccount(state);
  },

  // Login
  [types.login](state, loginPayload: Api.LoginResponse) {
    state.token = loginPayload.authToken;
    state.tokenExpiresAt = Date.now() + 43200000; // 12 hours
    state.refreshToken = loginPayload.refreshToken;
    state.refreshTokenExpiresAt = Date.now() + 604800000; // 7 days
    state.account = loginPayload.account;
    loginRequestState(state, RequestState.SUCCESS);
    persistAccount(state);
  },
  [types.logOut](state) {
    state.token = undefined;
    state.tokenExpiresAt = undefined;
    state.refreshToken = undefined;
    state.refreshTokenExpiresAt = undefined;
    state.account = undefined;
    loginRequestState(state, RequestState.NOT_REQUESTED);
    persistAccount(state);
  },
  [types.loginRequestState](state, requestState: RequestState) {
    loginRequestState(state, requestState);
  },

  // Preferences
  [types.togglePref](state, change: { pref: keyof Api.Preferences; value: any }) {
    if (!state.account) {
      console.warn('togglePref() called without account in the store');
      return;
    }
    Vue.set(state.account.preferences, change.pref, change.value);
  },
  [types.preferencesRequestState](state, requestState: RequestState) {
    state.preferencesRequestState = requestState;
  },

  // Shows
  [types.searchShowsResult](state, shows: Api.ShowSearchResult[] = []) {
    state.searchShowsResult = shows;
  },
  [types.searchShowsRequestState](state, requestState: RequestState) {
    state.searchShowsRequestState = requestState;
  },

  // Episodes
  [types.searchEpisodesResult](state, episodes: Api.EpisodeSearchResult[] = []) {
    state.searchEpisodesResult = episodes;
  },
  [types.searchEpisodesRequestState](state, requestState: RequestState) {
    state.searchEpisodesRequestState = requestState;
  },
  [types.setEpisodeInfo](state, episode: Api.EpisodeUrl) {
    state.episodeUrl = episode;
  },
  [types.episodeRequestState](state, requestState: RequestState) {
    state.episodeRequestState = requestState;
  },
});
