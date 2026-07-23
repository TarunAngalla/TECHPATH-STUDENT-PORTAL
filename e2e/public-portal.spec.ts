import { expect, test } from "@playwright/test";

test("public login and request access pages render", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();

  await page.goto("/request-access");
  await expect(page.getByRole("heading", { name: "Request portal access" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
});

test("protected portals redirect anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("health endpoints expose no secrets", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(JSON.stringify(body)).not.toContain("SESSION_SECRET");
});
