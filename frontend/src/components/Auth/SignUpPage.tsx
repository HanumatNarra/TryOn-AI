import React, { useEffect } from 'react';

import LoginHero from './LoginHero';
import { SignUpForm } from './SignUpForm';
import { useNavigate } from 'react-router-dom';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  // Set page title
  useEffect(() => {
    document.title = 'Sign Up — TryOn.AI';
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Left Side - Hero Slideshow (Fixed) */}
      <div className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:w-[55%] xl:w-[60%] 2xl:w-[60%] lg:h-screen lg:z-10">
        <LoginHero />
      </div>

      {/* Right Side - SignUp Form (Scrollable) */}
      <div className="w-full lg:pl-[55%] xl:pl-[60%] 2xl:pl-[60%] min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 dark:bg-neutral-900">
        <div className="flex items-start justify-center min-h-screen p-4 lg:p-8 lg:pt-8">
          <div className="w-full max-w-md lg:mt-8">
            <SignUpForm onSwitchToLogin={() => navigate('/login')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
