// Google Analytics 4
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Google Tag Manager
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

// Yandex Metrica
export const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';

// Google Analytics pageview
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Google Analytics event
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Yandex Metrica reachGoal
export const reachGoal = (goal: string) => {
  if (typeof window !== 'undefined' && window.ym) {
    window.ym(YANDEX_METRICA_ID, 'reachGoal', goal);
  }
};

// Track page views
export const trackPageView = (url: string) => {
  pageview(url);
  reachGoal('page_view');
};

// Track conversions
export const trackRegistration = () => {
  event({
    action: 'register',
    category: 'engagement',
    label: 'user_registration',
  });
  reachGoal('registration');
};

export const trackCargoAdd = () => {
  event({
    action: 'add_cargo',
    category: 'engagement',
    label: 'cargo_added',
  });
  reachGoal('cargo_add');
};

export const trackTransportAdd = () => {
  event({
    action: 'add_transport',
    category: 'engagement',
    label: 'transport_added',
  });
  reachGoal('transport_add');
};

// Declare global types
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    ym: (id: string, method: string, goal: string) => void;
  }
}
