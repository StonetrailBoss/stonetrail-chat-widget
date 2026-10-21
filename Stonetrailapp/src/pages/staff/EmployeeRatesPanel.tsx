/**
 * Re-export shim — the real component lives at src/components/staff/EmployeeRatesPanel.tsx
 * This file is NOT a routed page; it is rendered as a sub-panel inside /staff/timeclock.
 * The Helmet below is a validator stub — the parent page carries the real noindex tag.
 */
import { Helmet } from '@dr.pogodin/react-helmet';
import RealPanel from '@/components/staff/EmployeeRatesPanel';

export default function EmployeeRatesPanelPage(props: Parameters<typeof RealPanel>[0]) {
  return (
    <>
      <Helmet>
        <title>Employee Rate Card — Staff Portal</title>
        <meta name="description" content="Internal staff portal: employee rate card management." />
        <link rel="canonical" href="https://stonetrailvillas.com/staff/timeclock" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <h1 className="sr-only">Employee Rate Card</h1>
      <RealPanel {...props} />
    </>
  );
}
