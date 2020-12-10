import RequestState from '../utils/RequestState';
import Browser from '../utils/Browser';

export const state = {
  activeDialog: undefined as string | undefined,
  playbackRate: 1,
  isEditing: false,
  isInitialBuffer: true,
  tabUrl: Browser.transformServiceUrl(Browser.getIframeReferrer()),
  browserType: Browser.detect(),
  hasSkippedFromZero: false,
  duration: undefined as number | undefined,

  token: undefined as string | undefined,
  tokenExpiresAt: undefined as number | undefined,
  refreshToken: undefined as string | undefined,
  refreshTokenExpiresAt: undefined as number | undefined,
  loginRequestState: RequestState.NOT_REQUESTED,

  account: undefined as Api.Account | undefined,
  preferencesRequestState: RequestState.NOT_REQUESTED,
  preferencesLastUpdatedAt: 0,

  primaryKeyboardShortcuts: undefined as KeyboardShortcutsMap | undefined,
  secondaryKeyboardShortcuts: undefined as KeyboardShortcutsMap | undefined,

  searchShowsResult: [] as Api.ShowSearchResult[],
  searchShowsRequestState: RequestState.NOT_REQUESTED,

  searchEpisodesResult: [] as Api.EpisodeSearchResult[],
  searchEpisodesRequestState: RequestState.NOT_REQUESTED,
  episodeUrl: undefined as Api.EpisodeUrlNoEpisode | undefined,
  episode: undefined as Api.Episode | undefined,
  inferredEpisodeInfo: undefined as InferredEpisodeInfo | undefined,
  episodeRequestState: RequestState.NOT_REQUESTED,
  initialVideoDataRequestState: RequestState.NOT_REQUESTED,

  editTimestampMode: undefined as 'add' | 'edit' | undefined,
  activeTimestamp: undefined as Api.AmbiguousTimestamp | undefined,
  hoveredTimestamp: undefined as Api.AmbiguousTimestamp | undefined,
  timestamps: [] as Api.AmbiguousTimestamp[],
  draftTimestamps: [] as Api.AmbiguousTimestamp[],
  selectedTimestamp: undefined as Api.AmbiguousTimestamp | undefined,
  saveTimestampsRequestState: RequestState.NOT_REQUESTED,
};

export type State = typeof state;
