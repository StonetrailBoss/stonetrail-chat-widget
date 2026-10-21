/**
 * Agent-authored business identity for /llms.txt (RUBICON-365).
 *
 * The homepage Hotel/WebSite JSON-LD that the develop agent writes
 * (RUBICON-343) lives inline in React markup and is NOT readable by the
 * server at request time, so the /llms.txt handler reads name + summary from
 * here instead. The develop agent seeds these at site creation; empty values
 * are the "unseeded / thin site" signal that the handler falls back on.
 */
export interface SiteMeta {
	/** Business name — rendered as the llms.txt H1. */
	name: string;
	/** One-line business summary — rendered as the llms.txt blockquote. */
	summary: string;
}

export const siteMeta: SiteMeta = {
	name: "Stonetrail Villas",
	summary: "Stonetrail Villas is a boutique collection of private luxury villas in St. Vincent and the Grenadines, offering ocean views, tropical gardens, and personalised Caribbean hospitality from $155/night.",
};
