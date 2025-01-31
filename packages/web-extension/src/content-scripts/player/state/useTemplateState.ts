import { ComputedRef } from 'vue';
import { RequestState } from 'vue-use-request-state';
import * as Api from '~api';
import { createProvideInject } from '~utils/createProvideInject';

interface TemplateState {
  /**
   * the template that is attached to the current episode being watched. `undefined` if there is no
   * template for the specific episode
   */
  episodeTemplate?: Omit<Api.Template, 'timestamps'>;
  timestamps?: Api.Timestamp[];
  requestState: RequestState;
}

const {
  provideValue: provideTemplateState,
  useValue: useTemplateState,
  useUpdate: useUpdateTemplateState,
} = createProvideInject<TemplateState>('template-state', {
  episodeTemplate: undefined,
  timestamps: undefined,
  requestState: RequestState.NOT_REQUESTED,
});

export { provideTemplateState, useTemplateState, useUpdateTemplateState };

export function useEpisodeTemplate(templateState = useTemplateState()) {
  return computed(() => templateState.episodeTemplate);
}

export function useUpdateEpisodeTemplate(updateTemplateState = useUpdateTemplateState()) {
  return (newTemplate?: TemplateState['episodeTemplate']) => {
    updateTemplateState({ episodeTemplate: newTemplate });
  };
}

export function useTemplateTimestamps(): ComputedRef<Api.Timestamp[] | undefined> {
  const value = useTemplateState();
  return computed(() => value.timestamps);
}

export function useUpdateTemplateTimestamps() {
  const update = useUpdateTemplateState();
  return (newTimestamps?: Api.Timestamp[]) => {
    update({ timestamps: newTimestamps });
  };
}

export function useTemplateRequestState() {
  const value = useTemplateState();
  return computed(() => value.requestState);
}

export function useUpdateTemplateRequestState() {
  const update = useUpdateTemplateState();
  return (newRequestState: RequestState) => {
    update({ requestState: newRequestState });
  };
}
