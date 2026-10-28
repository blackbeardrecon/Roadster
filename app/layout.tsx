import type {Metadata} from 'next';
import {Chakra_Petch, Plus_Jakarta_Sans, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Tesla Roadster Cockpit Interface',
  description:
    '1:1 interactive cockpit UI and synchronized 34-second showcase of the Next-Gen Tesla Roadster fighter-jet interface, active aerodynamics, SpaceX cold-gas thruster telemetry, and Track Mode.',
  openGraph: {
    title: 'Tesla Roadster Cockpit Interface',
    description:
      '1:1 interactive cockpit UI and synchronized 34-second showcase of the Next-Gen Tesla Roadster fighter-jet interface, active aerodynamics, SpaceX cold-gas thruster telemetry, and Track Mode.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tesla Roadster Cockpit Interface',
    description:
      '1:1 interactive cockpit UI and synchronized 34-second showcase of the Next-Gen Tesla Roadster fighter-jet interface, active aerodynamics, SpaceX cold-gas thruster telemetry, and Track Mode.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${chakraPetch.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-black text-[#ff1e1e] antialiased selection:bg-[#ff1e1e]/30 selection:text-white overflow-hidden"
      >
        {children}
      </body>
    </html>
  );
}
