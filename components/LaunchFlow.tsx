import { useState } from 'react';

import { LaunchScreen } from '@/components/LaunchScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';

type LaunchFlowProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

/** Shows the animated brand reveal once, then the signed-out welcome screen. */
export function LaunchFlow(props: LaunchFlowProps) {
  const [isLaunching, setIsLaunching] = useState(true);

  if (isLaunching) {
    return <LaunchScreen onFinish={() => setIsLaunching(false)} />;
  }

  return <WelcomeScreen {...props} />;
}
