<template>
  <BasicDialog
    name="ConnectEpisodeDialog"
    gravity-x="center"
    gravity-y="center"
    @show="onShow"
    @hide="onHide"
  >
    <LoadingOverlay class="as-min-h-6" :is-loading="isLoading || !prefill">
      <div
        v-if="!isLoggedIn"
        class="as-px-16 as-py-8 as-text-center as-self-center as-justify-self-center"
      >
        <LoginWarning before="connecting this episode to Anime Skip" />
      </div>
      <template v-else>
        <div class="as-flex as-flex-row as-mx-2">
          <p class="as-tab" :class="{ 'as-active': tab == 0 }" @click="onClickFindExisting">
            Find an existing episode
          </p>
          <p class="as-tab" :class="{ 'as-active': tab == 1 }" @click="onClickCreateNew">
            Create a new episode
          </p>
        </div>
        <template v-if="prefill">
          <FindExisting
            v-if="shouldShowFindExisting"
            @createNew="enableCreateNew"
            :prefill="prefill"
            :suggestions="suggestions"
          />
          <CreateNew v-if="shouldShowCreateNew" :prefill="prefill" />
        </template>
      </template>
    </LoadingOverlay>
  </BasicDialog>
</template>

<script lang="ts" setup>
import useRequestState, { RequestState } from 'vue-use-request-state';
import { CreateEpisodePrefill } from '~/@types';
import { useApiClient } from '~/common/hooks/useApiClient';
import { useIsLoggedIn } from '~/common/state/useAuth';
import { debug, log, warn } from '~/common/utils/log';
import * as Api from '~api';
import * as Mappers from '~utils/mappers';
import { useEpisodeRequestState } from '../../state/useEpisodeState';
import { useInferredEpisode } from '../../state/useInferredEpisodeState';
import { deref } from '../../utils/deref';

const prefill = ref<CreateEpisodePrefill>({
  show: { title: '' },
  episode: { title: '' },
});
const showing = ref(false);
const inferredEpisode = useInferredEpisode();

// Data Fetching

const api = useApiClient();

const { wrapRequest: wrapFetchSuggestionsByName, isLoading: isLoadingSuggestions } =
  useRequestState();
const fetchSuggestionsByName = wrapFetchSuggestionsByName(
  async (episodeName: string, showName: string): Promise<Api.ThirdPartyEpisode[]> => {
    try {
      const res = await api.findEpisodeByName(Api.THIRD_PARTY_EPISODE_DATA, {
        name: episodeName,
      });
      return (res as Api.ThirdPartyEpisode[]).filter(
        episode => episode.show.name.toLowerCase() === showName.toLowerCase()
      );
    } catch (err) {
      warn('failed to fetch suggestions:', { episodeName, showName }, err);
      return [];
    }
  }
);

const { wrapRequest: wrapLoadDefaultShowOption, isLoading: isLoadingDefaultShow } =
  useRequestState();
const loadDefaultShowOption = wrapLoadDefaultShowOption(async (): Promise<void> => {
  const showName = inferredEpisode.value?.show;
  if (showName == null) {
    debug('Not fetching default show, name could not be inferred');
    return;
  }

  const searchResults: Api.ShowSearchResult[] = await api.searchShows(Api.SHOW_SEARCH_RESULT_DATA, {
    search: showName,
  });

  let showResult: Api.ShowSearchResult | undefined = searchResults.filter(
    result => result.name.toLowerCase() === showName.toLowerCase()
  )[0];

  // If we found a show, try and find the episode
  if (showResult != null) {
    const episodeResult = await loadDefaultEpisodeOption(showResult.id);
    const newShow = Mappers.showSearchResultToAutocompleteItem(showResult);

    if (episodeResult == null) {
      prefill.value = {
        ...prefill.value,
        show: newShow,
      };
    } else {
      prefill.value = {
        ...prefill.value,
        show: newShow,
        episode: Mappers.episodeSearchResultToAutocompleteItem(episodeResult),
      };
    }
  }
});

const { wrapRequest: wrapLoadDefaultEpisodeOption, isLoading: isLoadingDefaultEpisode } =
  useRequestState();
const loadDefaultEpisodeOption = wrapLoadDefaultEpisodeOption(
  async (showId: string): Promise<Api.EpisodeSearchResult | undefined> => {
    const episodeName = inferredEpisode.value?.name;
    if (episodeName == null) {
      debug('Not fetching default episode, name could not be inferred');
      return undefined;
    }

    const searchResults = await api.searchEpisodes(Api.EPISODE_SEARCH_RESULT_DATA, {
      search: episodeName,
      showId,
    });

    const episodeResult: Api.EpisodeSearchResult | undefined = searchResults.filter(
      result => result.name?.toLowerCase() === episodeName.toLowerCase()
    )[0];

    return episodeResult;
  }
);

// Tab state

enum Tab {
  FIND_EXISTING,
  CREATE_NEW,
}
const tab = ref(Tab.FIND_EXISTING);

// don't show it while it's still loading so it properly fills the default show and episode values
const shouldShowTabs = computed(
  () => !isLoadingDefaultShow.value && !isLoadingDefaultEpisode.value
);
const shouldShowFindExisting = computed(
  () => shouldShowTabs.value && tab.value === Tab.FIND_EXISTING
);
const shouldShowCreateNew = computed(() => shouldShowTabs.value && tab.value === Tab.CREATE_NEW);

function onClickFindExisting(): void {
  tab.value = Tab.FIND_EXISTING;
}

function onClickCreateNew(): void {
  tab.value = Tab.CREATE_NEW;
}

function enableCreateNew(newPrefill: CreateEpisodePrefill): void {
  prefill.value = newPrefill;
  onClickCreateNew();
}

// Loading

const isLoggedIn = useIsLoggedIn();
watch(isLoggedIn, (newIsLoggedIn, oldIsLoggedIn) => {
  if (showing.value && newIsLoggedIn && !oldIsLoggedIn) {
    loadData();
  }
});
const episodeRequestState = useEpisodeRequestState();
const isLoading = computed(
  () =>
    episodeRequestState.value === RequestState.LOADING ||
    isLoadingSuggestions.value ||
    isLoadingDefaultShow.value ||
    isLoadingDefaultEpisode.value
);

// Suggestions

const suggestions = ref<Api.ThirdPartyEpisode[]>([]);

function loadData() {
  loadSuggestions();
  loadDefaultShowOption();
}

async function loadSuggestions() {
  if (inferredEpisode.value?.name == null || inferredEpisode.value.show == null) {
    log(
      'Not fetching suggestions, episode or show name could not be inferred',
      deref(inferredEpisode)
    );
    return;
  }
  suggestions.value = await fetchSuggestionsByName(
    inferredEpisode.value.name,
    inferredEpisode.value.show
  );

  if (suggestions.value.length === 0) onClickCreateNew();
}

// Dialog lifecycle

function onShow() {
  tab.value = Tab.FIND_EXISTING;
  prefill.value = {
    show: {
      title: inferredEpisode.value?.show || '',
    },
    episode: {
      title: inferredEpisode.value?.name || '',
    },
    season: inferredEpisode.value?.season,
    number: inferredEpisode.value?.number,
    absoluteNumber: inferredEpisode.value?.absoluteNumber,
  };
  suggestions.value = [];

  if (isLoggedIn) loadData();
  showing.value = true;
}

function onHide() {
  showing.value = false;
}
</script>

<style>
/* TODO: This style should be scoped... */
* {
  padding: 0;
  margin: 0;
}

#ConnectEpisodeDialog .as-dialog-root-container {
  width: 480px;
  overflow: visible;
}

.as-tab {
  @apply as-mx-2 as-pt-4 as-cursor-pointer as-border-b-2 as-text-on-surface as-border-primary as-border-opacity-0 as-text-opacity-medium as-font-bold as-transition-all;
}

.as-tab.as-active {
  @apply as-text-primary as-border-opacity-100;
}

.as-min-h-6 {
  min-height: 6rem; /* 96px */
}
</style>
