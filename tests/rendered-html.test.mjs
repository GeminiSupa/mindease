import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the MindEase clinic landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MindEase Online Clinic<\/title>/i);
  assert.match(html, /Find a therapist who fits your concern/i);
  assert.match(html, /Message on WhatsApp/i);
  assert.match(html, /View therapist directory/i);
  assert.match(html, /Send private inquiry/i);
  assert.match(html, /hello@mindease\.example/i);
  assert.match(html, /Informational self-checks/i);
  assert.match(html, /Check anxiety patterns/i);
  assert.match(html, /self-tests#relationship-adjustment/i);
  assert.match(html, /Clinic CMS/i);
  assert.match(html, /MindEase is not an emergency service/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|SkeletonPreview/i);
});

test("removes starter preview code and metadata", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /MindEase Online Clinic/);
  assert.match(layout, /title:\s*"MindEase Online Clinic"/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|_sites-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("app/_sites-preview", templateRoot)));
});

test("includes protected, immediately refreshed admin-managed public content", async () => {
  const [page, directory, layout, settings, admin, route, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/therapists/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site-settings.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminConsole.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/site-settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/mindease-site-settings.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /getPublicContactSettings/);
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.doesNotMatch(page, /next:\s*\{\s*revalidate/);
  assert.match(directory, /getPublicContactSettings/);
  assert.match(directory, /dynamic = "force-dynamic"/);
  assert.match(layout, /dynamic = "force-dynamic"/);
  assert.match(settings, /SUPABASE_SERVICE_ROLE_KEY \?\? SUPABASE_ANON_KEY/);
  assert.match(admin, /Publish contact settings/);
  assert.match(admin, /Published and verified/);
  assert.match(route, /requireAdmin/);
  assert.match(route, /readPersistedSettings/);
  assert.match(route, /site_contact_settings_updated/);
  assert.match(migration, /site_settings_public_read/);
  assert.match(migration, /grant select \(/);
});

test("rejects unauthenticated public contact setting updates", async () => {
  const response = await render("/api/admin/site-settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      whatsappNumber: "923001234567",
      displayPhone: "+92 300 1234567",
      contactEmail: "hello@mindease.example",
      emailIsPlaceholder: true,
    }),
  });

  assert.equal(response.status, 403);
  assert.match(await response.text(), /Admin access required/i);
});

test("surfaces therapist credentials, dashboard access, availability, and device uploads", async () => {
  const [admin, therapistDashboard, therapistRoute, uploadRoute] = await Promise.all([
    readFile(new URL("../app/admin/AdminConsole.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/therapist/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/therapists/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/uploads/route.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(admin, /Sign in with the Supabase Auth admin account/);
  assert.match(admin, /Create therapist login/);
  assert.match(admin, /Therapist login email/);
  assert.match(admin, /Choose photo from device/);
  assert.match(admin, /Open therapist sign in/);
  assert.match(admin, /Edit profile/);
  assert.match(admin, /Save profile changes/);
  assert.match(therapistDashboard, /Submit availability/);
  assert.match(therapistDashboard, /Profile photo from device/);
  assert.match(therapistRoute, /loginUrl:\s*"\/therapist\/login"/);
  assert.match(therapistRoute, /action === "edit"/);
  assert.match(uploadRoute, /Image storage is not configured/);
});
