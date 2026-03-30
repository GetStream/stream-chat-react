import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

import ClientSetupStep from './1-client-setup/App';
import CoreComponentSetupStep from './2-core-component-setup/App';
import ChannelListStep from './3-channel-list/App';
import CustomUiComponentsStep from './4-custom-ui-components/App';
import CustomAttachmentTypeStep from './5-custom-attachment-type/App';
import EmojiPickerStep from './6-emoji-picker/App';
import LivestreamStep from './7-livestream/App';
import './tutorial-main.css';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  Component: ComponentType;
};

const steps: TutorialStep[] = [
  {
    id: 'client-setup',
    title: '1. Client Setup',
    description:
      'Connect the SDK to your Stream app and verify the chat client is ready.',
    Component: ClientSetupStep,
  },
  {
    id: 'core-component-setup',
    title: '2. Core Components',
    description:
      'Render the first complete chat UI with Channel, MessageList, MessageComposer, and Thread.',
    Component: CoreComponentSetupStep,
  },
  {
    id: 'channel-list',
    title: '3. Channel List',
    description:
      'Add channel navigation so the tutorial app feels like a real messaging experience.',
    Component: ChannelListStep,
  },
  {
    id: 'custom-ui-components',
    title: '4. Custom UI Components',
    description:
      'Use WithComponents to replace SDK-owned UI surfaces without rebuilding the whole app.',
    Component: CustomUiComponentsStep,
  },
  {
    id: 'custom-attachment-type',
    title: '5. Custom Attachment Type',
    description:
      'Render a branded product attachment while keeping the default attachment fallbacks.',
    Component: CustomAttachmentTypeStep,
  },
  {
    id: 'emoji-picker',
    title: '6. Emoji Picker',
    description:
      'Wire a custom EmojiPicker into MessageComposer with emoji-mart search support.',
    Component: EmojiPickerStep,
  },
  {
    id: 'livestream',
    title: '7. Livestream',
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
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`tutorial-browser__step-button${
                  isActive ? ' tutorial-browser__step-button--active' : ''
                }`}
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
          <div className='tutorial-browser__step-shell' key={selectedStep.id}>
            <SelectedComponent />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
