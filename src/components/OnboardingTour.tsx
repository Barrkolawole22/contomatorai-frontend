'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
  isNewUser: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({ isNewUser, onComplete }: OnboardingTourProps) {
  const router = useRouter();
  const driverRef = useRef<any>(null);

  useEffect(() => {
    if (!isNewUser) return;

    // Small delay so the DOM is fully painted before we start highlighting
    const timer = setTimeout(() => {
      driverRef.current = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        smoothScroll: true,
        allowClose: true,
        progressText: '{{current}} of {{total}}',

        popoverClass: 'contentai-tour-popover',

        onDestroyStarted: () => {
          // Fires when user clicks X or presses Escape
          driverRef.current?.destroy();
          onComplete();
        },

        steps: [
          {
            // Welcome — no element anchor, just a centred modal
            popover: {
              title: '👋 Welcome to ContentAI!',
              description:
                "Let's take a quick 60-second tour so you can start publishing AI-powered articles straight away. You can skip at any time.",
              side: 'over',
              align: 'center',
              nextBtnText: "Let's go →",
              showButtons: ['next', 'close'],
            },
          },
          {
            element: '[data-tour="nav-wordpress"]',
            popover: {
              title: '1. Connect your WordPress site',
              description:
                'Start here. Add your WordPress site credentials so ContentAI can publish articles directly to your blog — no copy-pasting needed.',
              side: 'right',
              align: 'start',
              onNextClick: () => {
                router.push('/dashboard/wordpress');
                driverRef.current?.moveNext();
              },
            },
          },
          {
            element: '[data-tour="nav-keywords"]',
            popover: {
              title: '2. Research your keywords',
              description:
                'Enter topics or seed keywords and ContentAI will generate a list of high-potential keywords with search intent data to target.',
              side: 'right',
              align: 'start',
              onNextClick: () => {
                router.push('/keywords');
                driverRef.current?.moveNext();
              },
            },
          },
          {
            element: '[data-tour="nav-articles"]',
            popover: {
              title: '3. Generate articles',
              description:
                'Pick a keyword and generate a fully structured, SEO-optimised article in seconds. Review it, tweak it, then publish straight to WordPress.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '[data-tour="nav-bulk-create"]',
            popover: {
              title: '4. Scale with Bulk Create',
              description:
                'Once you are comfortable, use Bulk Create to generate dozens of articles at once from your keyword list — great for filling out a content calendar fast.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '[data-tour="nav-scheduler"]',
            popover: {
              title: '5. Schedule publishing',
              description:
                'Set a publishing schedule and ContentAI will drip articles to your WordPress site automatically — so your blog stays active without any manual effort.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '[data-tour="credits-display"]',
            popover: {
              title: 'Your word credits',
              description:
                'This shows how many words you have left this billing period. Each article uses credits based on its length. Top up or upgrade under Billing anytime.',
              side: 'top',
              align: 'start',
            },
          },
          {
            // Final step — centred, no anchor
            popover: {
              title: "🚀 You're all set!",
              description:
                'Start by connecting your WordPress site, then add a few keywords. Your first article is just a few clicks away.',
              side: 'over',
              align: 'center',
              nextBtnText: 'Get started',
              showButtons: ['next'],
              onNextClick: () => {
                driverRef.current?.destroy();
                onComplete();
                router.push('/dashboard/wordpress');
              },
            },
          },
        ],
      });

      driverRef.current.drive();
    }, 600);

    return () => {
      clearTimeout(timer);
      driverRef.current?.destroy();
    };
  }, [isNewUser]);

  return null; // renders nothing — Driver.js injects its own overlay DOM
}
