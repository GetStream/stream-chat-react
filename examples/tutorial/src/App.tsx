import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import ClientSetupStep from './2-client-setup/App';
import CoreComponentSetupStep from './3-core-component-setup/App';
import ChannelListStep from './4-channel-list/App';
import ThemingStep from './5-theming/App';
import CustomUiComponentsStep from './6-custom-ui-components/App';
import EmojiPickerStep from './7-emoji-picker/App';
import CustomAttachmentTypeStep from './optional-custom-attachment-type/App';
import LivestreamStep from './optional-livestream/App';
import './tutorial-main.css';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  Component: ComponentType;
};

// Titles and order mirror the published tutorial, so a step here maps 1:1 to a
// heading there: https://getstream.io/chat/sdk/react/tutorial/
//
// The tutorial's Step 0 (environment) and Step 1 (project + credentials) have no
// runnable counterpart, so this browser starts at Step 2.
const steps: TutorialStep[] = [
  {
    id: 'client-setup',
    title: 'Step 2. Connect the client',
    description:
      'Connect the SDK to your Stream app and verify the chat client is ready.',
    Component: ClientSetupStep,
  },
  {
    id: 'core-component-setup',
    title: 'Step 3. Get a working chat UI',
    description:
      'Render the first complete chat UI with Channel, MessageList, MessageComposer, and Thread.',
    Component: CoreComponentSetupStep,
  },
  {
    id: 'channel-list',
    title: 'Step 4. Add a channel list',
    description:
      'Add channel navigation so the tutorial app feels like a real messaging experience.',
    Component: ChannelListStep,
  },
  {
    id: 'theming',
    title: 'Step 5. Theme it',
    description:
      'Brand the default theme by overriding the SDK design tokens. Everything from here on carries the custom theme.',
    Component: ThemingStep,
  },
  {
    id: 'custom-ui-components',
    title: 'Step 6. Replace an SDK component',
    description:
      'Use WithComponents to replace SDK-owned UI surfaces without rebuilding the whole app.',
    Component: CustomUiComponentsStep,
  },
  {
    id: 'emoji-picker',
    title: 'Step 7. Emoji picker and autocomplete',
    description:
      'Wire the SDK EmojiPicker into MessageComposer with emoji-mart search support.',
    Component: EmojiPickerStep,
  },
  {
    id: 'custom-attachment-type',
    title: 'Optional. Custom attachment type',
    description:
      'Render a branded product attachment while keeping the default attachment fallbacks.',
    Component: CustomAttachmentTypeStep,
  },
  {
    id: 'livestream',
    title: 'Optional. Livestream-style chat',
    description:
      'Switch the layout to a livestream-style experience with VirtualizedMessageList.',
    Component: LivestreamStep,
  },
];

const getInitialStep = () => {
  const hash = window.location.hash.replace('#', '');
  return steps.find((step) => step.id === hash) ?? steps[0];
};

const App = () => {
  const [selectedStepId, setSelectedStepId] = useState(getInitialStep().id);

  useEffect(() => {
    const handleHashChange = () => {
      const nextStep = getInitialStep();
      setSelectedStepId(nextStep.id);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = selectedStepId;
  }, [selectedStepId]);

  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? steps[0];
  const SelectedComponent = selectedStep.Component;

  return (
    <div className='tutorial-browser'>
      <aside className='tutorial-browser__sidebar'>
        <div className='tutorial-browser__sidebar-copy'>
          <div className='tutorial-browser__title'>React Tutorial</div>
          <div className='tutorial-browser__subtitle'>
            Browse every tutorial milestone without restarting the app.
          </div>
        </div>

        <nav aria-label='Tutorial steps' className='tutorial-browser__nav'>
          {steps.map((step) => {
            const isActive = step.id === selectedStep.id;

            return (
              <button
                className={`tutorial-browser__step-button${
                  isActive ? ' tutorial-browser__step-button--active' : ''
                }`}
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                type='button'
              >
                <div className='tutorial-browser__step-title'>{step.title}</div>
                <div className='tutorial-browser__step-description'>
                  {step.description}
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className='tutorial-browser__main'>
        <header className='tutorial-browser__header'>
          <div className='tutorial-browser__eyebrow'>CURRENT STEP</div>
          <div className='tutorial-browser__header-title'>{selectedStep.title}</div>
          <div className='tutorial-browser__header-description'>
            {selectedStep.description}
          </div>
        </header>

        <section className='tutorial-browser__preview-card'>
          {/* The `step-<id>` class lets tutorial-main.css target an individual
              step's chrome. Only `step-client-setup` needs it today. */}
          <div
            className={`tutorial-browser__step-shell step-${selectedStep.id}`}
            key={selectedStep.id}
          >
            <SelectedComponent />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
