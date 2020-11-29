import Vue from 'vue';
import Mappers from '../utils/Mappers';
import Utils from '../utils/Utils';

const EpisodeAutocompleteMixin = Vue.extend({
  data() {
    const episode: AutocompleteItem<Api.EpisodeSearchResult> = {
      title: '',
    };
    const episodeSearchResults: Api.EpisodeSearchResult[] = [];
    return {
      episode,
      episodeSearchResults,
    };
  },
  computed: {
    isExistingEpisode(): boolean {
      return this.episode.data != null;
    },
    episodeOptions(): AutocompleteItem<Api.EpisodeSearchResult>[] {
      return this.episodeSearchResults.map(Mappers.episodeSearchResultToAutocompleteItem);
    },
  },
  methods: {
    onSelectEpisode(item: AutocompleteItem<Api.EpisodeSearchResult>): void {
      this.episode = item;
    },
    async searchEpisodes(episode: string): Promise<void> {
      this.episodeSearchResults = await Utils.apiAction(
        this.$store,
        global.Api.searchEpisodes,
        episode,
        // @ts-ignore: Show is not defined in the mixin, but if it's available, use it
        this.show?.data?.id
      );
    },
  },
});

export default EpisodeAutocompleteMixin;
