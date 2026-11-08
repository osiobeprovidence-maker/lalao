import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import parsePhoneNumberFromString from 'libphonenumber-js';

export const PhoneSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const updatePhoneSetup = useMutation(api.users.updatePhoneSetup);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    
    // Attempt to parse phone number (default NG if no country code provided, but user might enter international)
    let parsedNumber = parsePhoneNumberFromString(phoneNumber, 'NG');
    if (!parsedNumber || !parsedNumber.isValid()) {
       // try parsing with a strict format
       parsedNumber = parsePhoneNumberFromString('+' + phoneNumber.replace(/\D/g, ''));
       if (!parsedNumber || !parsedNumber.isValid()) {
         setError('Please enter a valid phone number.');
         return;
       }
    }

    setError('');
    setIsLoading(true);
    try {
      const formattedNumber = parsedNumber.format('E.164');
      const countryCode = parsedNumber.country || 'UNKNOWN';
      const phoneCountryCode = parsedNumber.countryCallingCode.toString();
      
      const accessStatus = await updatePhoneSetup({
        phoneNumber: formattedNumber,
        countryCode: countryCode,
        countryName: countryCode, 
        phoneCountryCode: phoneCountryCode,
      });

      if (accessStatus === 'available') {
        if (currentUser?.onboardingStep === 'complete') {
          navigate('/app');
        } else {
          navigate('/onboarding/name');
        }
      } else {
        navigate('/country-restricted');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout 
      step={0} 
      totalSteps={6} 
      title="Enter your phone number" 
      subtitle="Your phone number is used to connect you with your local Lalao community."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-theme-tertiary tracking-wider uppercase">Phone Number</label>
          <div className="flex gap-2">
            <div className="px-4 py-3.5 rounded-xl border-2 border-theme-divider bg-theme-base text-base text-theme-primary flex items-center justify-center font-semibold select-none">
              +234
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 08012345678"
              className="flex-1 px-4 py-3.5 rounded-xl border-2 border-theme-divider bg-theme-surface text-base text-theme-primary placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mt-4"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </OnboardingLayout>
  );
};
