import React, { useEffect, useState } from 'react';

import LoginCard from './LoginCard';
import LoginHero from './LoginHero';
import { SignUpForm } from './SignUpForm';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Set page title
  useEffect(() => {
    document.title = isSignUp ? 'Sign Up — TryOn.AI' : 'Login — TryOn.AI';
  }, [isSignUp]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Left Side - Hero Slideshow (Fixed) */}
      <div className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:w-[55%] xl:w-[60%] 2xl:w-[60%] lg:h-screen lg:z-10">
        <LoginHero />
      </div>

      {/* Right Side - Login/SignUp Form (Scrollable) */}
      <div className="w-full lg:pl-[55%] xl:pl-[60%] 2xl:pl-[60%] min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 dark:bg-neutral-900">
        <div className="flex items-start justify-center min-h-screen p-4 lg:p-8 lg:pt-8">
          <div className="w-full max-w-md lg:mt-8">
            {isSignUp ? (
              <SignUpForm onSwitchToLogin={() => setIsSignUp(false)} />
            ) : (
              <LoginCard onSwitchToSignUp={() => setIsSignUp(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
