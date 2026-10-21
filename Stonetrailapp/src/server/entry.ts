import express, { type NextFunction, type Request, type Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, extname, join } from "node:path";
import { readFileSync } from "node:fs";


// <api-imports>
import admin__employees__get from "./api/admin/employees/GET";
import admin__roles__get from "./api/admin/roles/GET";
import admin__roles__post from "./api/admin/roles/POST";
import admin__roles__id__delete from "./api/admin/roles/[id]/DELETE";
import admin__roles__id__put from "./api/admin/roles/[id]/PUT";
import admin__staff__get from "./api/admin/staff/GET";
import admin__staff__post from "./api/admin/staff/POST";
import admin__staff__id__delete from "./api/admin/staff/[id]/DELETE";
import admin__staff__id__patch from "./api/admin/staff/[id]/PATCH";
import auth__reset_password__post from "./api/auth/reset-password/POST";
import auth__action__get from "./api/auth/[action]/GET";
import auth__action__post from "./api/auth/[action]/POST";
import auth__action__detail__get from "./api/auth/[action]/[detail]/GET";
import auth__action__detail__post from "./api/auth/[action]/[detail]/POST";
import chat__post from "./api/chat/POST";
import employee_deductions__get from "./api/employee-deductions/GET";
import employee_deductions__post from "./api/employee-deductions/POST";
import employee_deductions__ytd__get from "./api/employee-deductions/ytd/GET";
import employee_deductions__id__delete from "./api/employee-deductions/[id]/DELETE";
import employee_deductions__id__put from "./api/employee-deductions/[id]/PUT";
import employee_rates__get from "./api/employee-rates/GET";
import employee_rates__post from "./api/employee-rates/POST";
import employee_rates__archived__get from "./api/employee-rates/archived/GET";
import employee_rates__id__delete from "./api/employee-rates/[id]/DELETE";
import employee_rates__id__put from "./api/employee-rates/[id]/PUT";
import employee_rates__id__archive__patch from "./api/employee-rates/[id]/archive/PATCH";
import google_reviews__get from "./api/google-reviews/GET";
import health__get from "./api/health/GET";
import inventory__get from "./api/inventory/GET";
import inventory__post from "./api/inventory/POST";
import inventory__audit__get from "./api/inventory/audit/GET";
import inventory__bulk_delete__post from "./api/inventory/bulk-delete/POST";
import inventory__bulk_edit__post from "./api/inventory/bulk-edit/POST";
import inventory__import__post from "./api/inventory/import/POST";
import inventory__id__delete from "./api/inventory/[id]/DELETE";
import inventory__id__put from "./api/inventory/[id]/PUT";
import inventory__id__image__post from "./api/inventory/[id]/image/POST";
import me__permissions__get from "./api/me/permissions/GET";
import nis_rates__get from "./api/nis-rates/GET";
import nis_rates__post from "./api/nis-rates/POST";
import nis_rates__id__delete from "./api/nis-rates/[id]/DELETE";
import nis_rates__id__put from "./api/nis-rates/[id]/PUT";
import payables__get from "./api/payables/GET";
import payables__post from "./api/payables/POST";
import payables__id__delete from "./api/payables/[id]/DELETE";
import payables__id__put from "./api/payables/[id]/PUT";
import payables__id__payments__get from "./api/payables/[id]/payments/GET";
import payables__id__payments__post from "./api/payables/[id]/payments/POST";
import payables__id__payments__paymentId__delete from "./api/payables/[id]/payments/[paymentId]/DELETE";
import payables__id__payments__paymentId__put from "./api/payables/[id]/payments/[paymentId]/PUT";
import payables__id__payments__paymentId__receipt__post from "./api/payables/[id]/payments/[paymentId]/receipt/POST";
import payables__id__receipt__post from "./api/payables/[id]/receipt/POST";
import payables__id__reconcile__patch from "./api/payables/[id]/reconcile/PATCH";
import petty_cash__accounts__get from "./api/petty-cash/accounts/GET";
import petty_cash__accounts__post from "./api/petty-cash/accounts/POST";
import petty_cash__accounts__id__delete from "./api/petty-cash/accounts/[id]/DELETE";
import petty_cash__accounts__id__put from "./api/petty-cash/accounts/[id]/PUT";
import petty_cash__entries__get from "./api/petty-cash/entries/GET";
import petty_cash__entries__post from "./api/petty-cash/entries/POST";
import petty_cash__entries__archive__post from "./api/petty-cash/entries/archive/POST";
import petty_cash__entries__id__delete from "./api/petty-cash/entries/[id]/DELETE";
import reviews_agent__post from "./api/reviews-agent/POST";
import timeclock__get from "./api/timeclock/GET";
import timeclock__post from "./api/timeclock/POST";
import timeclock__import__post from "./api/timeclock/import/POST";
import timeclock__ytd__get from "./api/timeclock/ytd/GET";
import timeclock__id__delete from "./api/timeclock/[id]/DELETE";
import timeclock__id__get from "./api/timeclock/[id]/GET";
import timeclock__id__put from "./api/timeclock/[id]/PUT";
import timeclock__id__payslip__get from "./api/timeclock/[id]/payslip/GET";
// </api-imports>
import { portalAccess } from "./portal-access";
import { seoRoutes } from "../lib/seo-routes";
import { isSystemHost } from "./seo-host";

// Schema migrations run separately through npm run db:migrate.
function normalizeCommerceApiBaseUrlEnv() {
	if (process.env.GODADDY_API_BASE_URL) return;
	const hostOnly = process.env.VITE_GODADDY_API_HOST;
	if (!hostOnly) return;
	const normalizedHost = hostOnly.replace(/^https?:\/\//, "").trim();
	if (!normalizedHost) return;
	process.env.GODADDY_API_BASE_URL = `https://${normalizedHost}`;
}

normalizeCommerceApiBaseUrlEnv();

const app = express();

// Honour x-forwarded-* from the load balancer so req.protocol/req.hostname
// reflect the public-facing values. Express-maintained parsing respects the
// existing trust-proxy config; direct header reads would let a client spoof
// the sitemap origin in robots.txt.
app.set("trust proxy", true);

// ── www → non-www redirect (301) ─────────────────────────────────────────────
// Must run before any other middleware so www traffic is redirected immediately.
app.use((req, res, next) => {
  const host = req.headers['x-forwarded-host'] as string || req.hostname;
  if (host && host.startsWith('www.')) {
    const nonWww = host.slice(4);
    return res.redirect(301, `https://${nonWww}${req.originalUrl}`);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(portalAccess);
app.use("/api/uploads", express.static(process.env.UPLOAD_ROOT || "./var/uploads", {
  dotfiles: "deny", index: false,
}));


// <api-registrations>
app.get("/api/admin/employees", admin__employees__get);
app.get("/api/admin/roles", admin__roles__get);
app.post("/api/admin/roles", admin__roles__post);
app.delete("/api/admin/roles/:id", admin__roles__id__delete);
app.put("/api/admin/roles/:id", admin__roles__id__put);
app.get("/api/admin/staff", admin__staff__get);
app.post("/api/admin/staff", admin__staff__post);
app.delete("/api/admin/staff/:id", admin__staff__id__delete);
app.patch("/api/admin/staff/:id", admin__staff__id__patch);
app.post("/api/auth/reset-password", auth__reset_password__post);
app.get("/api/auth/:action", auth__action__get);
app.post("/api/auth/:action", auth__action__post);
app.get("/api/auth/:action/:detail", auth__action__detail__get);
app.post("/api/auth/:action/:detail", auth__action__detail__post);
app.post("/api/chat", chat__post);
app.get("/api/employee-deductions", employee_deductions__get);
app.post("/api/employee-deductions", employee_deductions__post);
app.get("/api/employee-deductions/ytd", employee_deductions__ytd__get);
app.delete("/api/employee-deductions/:id", employee_deductions__id__delete);
app.put("/api/employee-deductions/:id", employee_deductions__id__put);
app.get("/api/employee-rates", employee_rates__get);
app.post("/api/employee-rates", employee_rates__post);
app.get("/api/employee-rates/archived", employee_rates__archived__get);
app.delete("/api/employee-rates/:id", employee_rates__id__delete);
app.put("/api/employee-rates/:id", employee_rates__id__put);
app.patch("/api/employee-rates/:id/archive", employee_rates__id__archive__patch);
app.get("/api/google-reviews", google_reviews__get);
app.get("/api/health", health__get);
app.get("/api/inventory", inventory__get);
app.post("/api/inventory", inventory__post);
app.get("/api/inventory/audit", inventory__audit__get);
app.post("/api/inventory/bulk-delete", inventory__bulk_delete__post);
app.post("/api/inventory/bulk-edit", inventory__bulk_edit__post);
app.post("/api/inventory/import", inventory__import__post);
app.delete("/api/inventory/:id", inventory__id__delete);
app.put("/api/inventory/:id", inventory__id__put);
app.post("/api/inventory/:id/image", inventory__id__image__post);
app.get("/api/me/permissions", me__permissions__get);
app.get("/api/nis-rates", nis_rates__get);
app.post("/api/nis-rates", nis_rates__post);
app.delete("/api/nis-rates/:id", nis_rates__id__delete);
app.put("/api/nis-rates/:id", nis_rates__id__put);
app.get("/api/payables", payables__get);
app.post("/api/payables", payables__post);
app.delete("/api/payables/:id", payables__id__delete);
app.put("/api/payables/:id", payables__id__put);
app.get("/api/payables/:id/payments", payables__id__payments__get);
app.post("/api/payables/:id/payments", payables__id__payments__post);
app.delete("/api/payables/:id/payments/:paymentId", payables__id__payments__paymentId__delete);
app.put("/api/payables/:id/payments/:paymentId", payables__id__payments__paymentId__put);
app.post("/api/payables/:id/payments/:paymentId/receipt", payables__id__payments__paymentId__receipt__post);
app.post("/api/payables/:id/receipt", payables__id__receipt__post);
app.patch("/api/payables/:id/reconcile", payables__id__reconcile__patch);
app.get("/api/petty-cash/accounts", petty_cash__accounts__get);
app.post("/api/petty-cash/accounts", petty_cash__accounts__post);
app.delete("/api/petty-cash/accounts/:id", petty_cash__accounts__id__delete);
app.put("/api/petty-cash/accounts/:id", petty_cash__accounts__id__put);
app.get("/api/petty-cash/entries", petty_cash__entries__get);
app.post("/api/petty-cash/entries", petty_cash__entries__post);
app.post("/api/petty-cash/entries/archive", petty_cash__entries__archive__post);
app.delete("/api/petty-cash/entries/:id", petty_cash__entries__id__delete);
app.post("/api/reviews-agent", reviews_agent__post);
app.get("/api/timeclock", timeclock__get);
app.post("/api/timeclock", timeclock__post);
app.post("/api/timeclock/import", timeclock__import__post);
app.get("/api/timeclock/ytd", timeclock__ytd__get);
app.delete("/api/timeclock/:id", timeclock__id__delete);
app.get("/api/timeclock/:id", timeclock__id__get);
app.put("/api/timeclock/:id", timeclock__id__put);
app.get("/api/timeclock/:id/payslip", timeclock__id__payslip__get);
// </api-registrations>

// Error middleware must be registered AFTER the routes it protects; Express
// only passes errors to middleware defined later in the stack.
app.use("/api", (err: unknown, req: Request, res: Response, _next: NextFunction) => {
	// Always respond JSON on /api so clients parsing response.json() don't
	// receive Express's default HTML error page for non-Error throws.
	console.error("ssr.api.error", {
		url: req.url,
		error: err instanceof Error ? err.stack : String(err),
	});
	res.status(500).json({ error: "Internal server error" });
});

function baseUrl(req: Request): string {
	const env = process.env.PUBLIC_URL || process.env.SITE_URL;
	if (env) return env.replace(/\/+$/, "");
	return `${req.protocol}://${req.hostname}`;
}

function escapeXml(s: string): string {
	return s.replace(/[&<>"']/g, (c) =>
		({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!,
	);
}

app.get("/robots.txt", (req, res) => {
  if (isSystemHost(req)) {
    res.type("text/plain").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send("User-agent: *\nDisallow: /\n");
    return;
  }
  const base = baseUrl(req);
  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${base}/sitemap.xml`, ""].join("\n");
  res.type("text/plain").set("Cache-Control", "public, max-age=60, must-revalidate").set("Vary", "Host").send(body);
});

app.get("/sitemap.xml", (req, res) => {
	const base = baseUrl(req);
	const urls = seoRoutes
		.filter((r) => typeof r.path === "string" && r.path.startsWith("/"))
		.map((r) => {
			const loc = `${base}${r.path}`;
			const parts = [`    <loc>${escapeXml(loc)}</loc>`];
			if (r.lastmod) parts.push(`    <lastmod>${escapeXml(r.lastmod)}</lastmod>`);
			if (r.changefreq) parts.push(`    <changefreq>${r.changefreq}</changefreq>`);
			if (r.priority !== undefined)
				parts.push(`    <priority>${r.priority.toFixed(1)}</priority>`);
			return `  <url>\n${parts.join("\n")}\n  </url>`;
		})
		.join("\n");
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(body);
});

if (import.meta.env.PROD) {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const clientDir = join(__dirname, "../client");

	app.use(
		express.static(clientDir, {
			index: false,
			setHeaders(res, filePath) {
				res.set(
					"Cache-Control",
					filePath.includes("/assets/")
						? "public, max-age=31536000, immutable"
						: "no-cache",
				);
			},
		}),
	);

	app.use((_req, res, next) => {
		res.set("Cache-Control", "no-cache");
		next();
	});

	let template: string;
	try {
		template = readFileSync(join(clientDir, "index.html"), "utf-8");
	} catch (err) {
		console.error("ssr.template.load-failed", {
			path: join(clientDir, "index.html"),
			error: err instanceof Error ? err.message : String(err),
		});
		process.exit(1);
	}
	if (!template.includes("<!--app-head-->") || !template.includes("<!--app-html-->")) {
		// Fail fast at boot, same as a template load failure above: without
		// markers, every .replace() call on the render path is a no-op and we
		// would serve a shell with no <head> content and no rendered body on
		// every request. Preferring process.exit over a degraded mode ensures
		// an operator notices and fixes the build rather than serving broken
		// SEO-invisible pages indefinitely.
		console.error("ssr.template.markers-missing", {
			hasHead: template.includes("<!--app-head-->"),
			hasHtml: template.includes("<!--app-html-->"),
		});
		process.exit(1);
	}
	const fallbackShell = template
		.replace("<!--app-head-->", "")
		.replace("<!--app-html-->", "");

	// Resolve the SSR module once into a stable render function. A failed
	// load is unrecoverable at runtime - exiting lets the container
	// scheduler restart with a clean slate rather than leaving the server
	// to serve silent 503s indefinitely against a single startup log.
	type RenderResult = {
		html: string;
		head: string;
		status: number;
		redirect?: string;
	};
	let renderFn: ((url: string) => Promise<RenderResult>) | null = null;
	const SSR_MODULE_LOAD_TIMEOUT_MS = 30_000;
	const loadTimeout = setTimeout(() => {
		if (renderFn !== null) return;
		console.error("ssr.module.load-timeout", {
			timeoutMs: SSR_MODULE_LOAD_TIMEOUT_MS,
		});
		process.exit(1);
	}, SSR_MODULE_LOAD_TIMEOUT_MS);
	loadTimeout.unref();
	import("../entry-server").then(
		(mod) => {
			clearTimeout(loadTimeout);
			renderFn = mod.render;
		},
		(err) => {
			clearTimeout(loadTimeout);
			console.error("ssr.module.load-failed", {
				error: err instanceof Error ? err.stack : String(err),
			});
			process.exit(1);
		},
	);

	app.get(/.*/, async (req, res, next) => {
		if (req.method !== "GET") return next();
		if (req.path.startsWith("/api")) return next();
		if (extname(req.path)) return next();
		const sendFallback = () =>
			res
				.status(503)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-store")
				.send(fallbackShell);
		if (renderFn === null) {
			// Module not yet resolved; fall back without logging to avoid startup
			// noise before the first render is even possible. A terminal load
			// failure (import reject or 30s timeout) process.exit(1)s from the
			// loader above, so this branch is only the brief warmup window.
			return sendFallback();
		}
		try {
			const result = await renderFn(req.url);
			if (result.redirect) {
				// Redirect thrown from a loader/action surfaces as a Response.
				// Forward it so the browser actually navigates to the new URL
				// instead of seeing an empty shell with a stale status.
				res.redirect(result.status, result.redirect);
				return;
			}
			if (!result.html) {
				// A non-redirect Response was thrown from a loader (e.g.
				// `throw new Response(null, { status: 404 })`). renderToString
				// produced no markup, so we have a real status but no body.
				// Log so the case is observable in ops dashboards, and mark
				// no-store so CDNs don't cache an empty page as a valid hit.
				// User-visible 404 / error pages should come from a route
				// errorElement, not from this fallback path.
				console.error("ssr.render.error-response", {
					url: req.url,
					status: result.status,
				});
				res
					.status(result.status)
					.set("Content-Type", "text/html; charset=utf-8")
					.set("Cache-Control", "no-store")
					.send(fallbackShell);
				return;
			}
			// Function replacements disable String.replace's $-special sequences
			// ($&, $', $`, $$) so user-authored titles / JSON-LD like
			// "Save $& today" insert literally instead of being interpolated.
			const out = template
				.replace("<!--app-head-->", () => result.head)
				.replace("<!--app-html-->", () => result.html);
			res
				.status(result.status)
				.set("Content-Type", "text/html; charset=utf-8")
				.set("Cache-Control", "no-cache")
				.send(out);
		} catch (err) {
			// 503 surfaces the failure in CDN/monitoring without caching a broken
			// page as success. console.error (not warn) puts it at the right log
			// level for the observability pipeline to alert on.
			console.error("ssr.render.failed", {
				url: req.url,
				// Log the full stack — React's renderToString annotates it with
				// the failing component's call tree, which the message alone
				// discards.
				error: err instanceof Error ? err.stack : String(err),
			});
			sendFallback();
		}
	});

	const shutdown = async (signal: string) => {
		console.log(`Got ${signal}, shutting down gracefully...`);
		// Scope the ERR_MODULE_NOT_FOUND suppression to the import() only.
		// A closeConnection() failure that happens to carry the same code
		// (unlikely but possible for wrapped errors) must not be silently
		// swallowed - it indicates a real db-close failure worth logging.
		let mod: { closeConnection?: () => Promise<void> | void } | null = null;
		try {
			const dbClient = "./db/client" + ".js";
			// Source-literal optional module path; no request, environment, or user input reaches import().
			// eslint-disable-next-line no-unsanitized/method
			mod = await import(/* @vite-ignore */ dbClient);
		} catch (error: unknown) {
			const code = (error as { code?: string } | null)?.code;
			if (code !== "ERR_MODULE_NOT_FOUND") {
				console.error("ssr.shutdown.db-import-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		if (mod && typeof mod.closeConnection === "function") {
			try {
				await mod.closeConnection();
				console.log("Database connections closed");
			} catch (error: unknown) {
				console.error("ssr.shutdown.db-close-failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		process.exit(0);
	};

	(["SIGTERM", "SIGINT"] as const).forEach((signal) => {
		process.once(signal, () => {
			void shutdown(signal);
		});
	});

	const rawPort = process.env.PORT || "3000";
	const port = parseInt(rawPort, 10);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		// parseInt("abc") returns NaN; passing that to app.listen throws
		// synchronously before the server.on("error") handler below can catch
		// it. Fail fast with an actionable log rather than a cryptic crash.
		console.error("ssr.server.invalid-port", { rawPort });
		process.exit(1);
	}
	const host = process.env.HOST || "0.0.0.0";

	const server = app.listen(port, host, () => {
		console.log(`Server listening on http://${host}:${port}`);
	});
	server.on("error", (err: NodeJS.ErrnoException) => {
		console.error("ssr.server.listen-failed", {
			port,
			host,
			code: err.code,
			error: err.message,
		});
		process.exit(1);
	});
}

export default app;

// ─── Exported helpers (used by tests) ────────────────────────────────────────

export interface AdSenseConfig {
  publisherId?: string | null;
  scriptHtml?: string;
  adsTxt?: string | null;
  appAdsTxt?: string | null;
}

export function registerAdSenseTextRoutes(
  expressApp: import('express').Express,
  config: AdSenseConfig,
) {
  expressApp.get('/ads.txt', (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'no-cache');
    if (config.adsTxt) {
      res.status(200).send(config.adsTxt);
    } else {
      res.status(404).send('');
    }
  });
  expressApp.get('/app-ads.txt', (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.set('Cache-Control', 'no-cache');
    if (config.appAdsTxt) {
      res.status(200).send(config.appAdsTxt);
    } else {
      res.status(404).send('');
    }
  });
}

export function renderSsrDocument(
  template: string,
  result: { head: string; html: string },
  adsense: { scriptHtml?: string },
): string {
  const headContent = adsense.scriptHtml
    ? `${result.head}\n${adsense.scriptHtml}`
    : result.head;
  return template
    .replace('<!--app-head-->', () => headContent)
    .replace('<!--app-html-->', () => result.html);
}
