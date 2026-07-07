import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import OnboardingWizard from './onboarding/OnboardingWizard';

interface ProfileOnboardingProps {
  user: User;
  db: Firestore;
  initialData?: Parameters<typeof OnboardingWizard>[0]['initialData'];
}

/** @deprecated Use OnboardingWizard directly */
export default function ProfileOnboarding(props: ProfileOnboardingProps) {
  return <OnboardingWizard {...props} />;
}
