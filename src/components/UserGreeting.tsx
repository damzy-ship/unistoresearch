import WelcomeMessage from './WelcomeMessage';

interface UserGreetingProps {
  university?: string;
  className?: string;
}

export default function UserGreeting({ className = '' }: UserGreetingProps) {
  return (
    <div className={`${className}`}>
      <WelcomeMessage className="text-lg font-medium" />
    </div>
  );
}