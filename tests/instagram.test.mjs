import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { test } from "node:test";
import {
  buildAuthorizeUrl,
  classifyGraphError,
  collectInstagramMetrics,
  exchangeCodeForToken,
  InstagramApiError,
} from "../src/lib/instagram/graph.ts";
import { parseSignedRequest } from "../src/lib/instagram/signed-request.ts";
import { decryptToken, encryptToken, parseTokenKey } from "../src/lib/instagram/token-crypto.ts";
import {
  detectRecordingType,
  readRecordingDuration,
  recordingPathPattern,
} from "../src/lib/recordings/video.ts";

const token = "IGQVJ-segredo-de-teste";

test("token is sealed with AES-GCM and tampering is detected", () => {
  const key = randomBytes(32);
  const sealed = encryptToken(token, key);
  assert.ok(sealed.startsWith("v1."));
  assert.ok(!sealed.includes(token));
  assert.equal(decryptToken(sealed, key), token);

  const parts = sealed.split(".");
  parts[3] = Buffer.from("outro").toString("base64url");
  assert.throws(() => decryptToken(parts.join("."), key));
  assert.throws(() => decryptToken(sealed, randomBytes(32)));

  assert.equal(parseTokenKey(undefined), null);
  assert.equal(parseTokenKey(Buffer.alloc(16).toString("base64")), null);
  assert.equal(parseTokenKey(key.toString("base64"))?.length, 32);
});

test("Meta signed_request is accepted only with the app secret signature", () => {
  const secret = "segredo-do-app";
  const payload = Buffer.from(
    JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "9000000000001" }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");

  assert.deepEqual(parseSignedRequest(`${signature}.${payload}`, secret), {
    algorithm: "HMAC-SHA256",
    user_id: "9000000000001",
  });
  assert.equal(parseSignedRequest(`${signature}.${payload}`, "outro-segredo"), null);
  assert.equal(parseSignedRequest(`invalido.${payload}`, secret), null);
  assert.equal(parseSignedRequest("sem-ponto", secret), null);
});

test("authorization URL asks only for basic profile and insights permissions", () => {
  const url = new URL(
    buildAuthorizeUrl({ appId: "123", redirectUri: "https://vyrex.test/api/instagram/callback", state: "abc" }),
  );
  assert.equal(url.origin + url.pathname, "https://www.instagram.com/oauth/authorize");
  assert.equal(url.searchParams.get("scope"), "instagram_business_basic,instagram_business_manage_insights");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "abc");
});

test("Graph API errors are classified without exposing the message or token", () => {
  assert.equal(classifyGraphError(400, { error: { code: 190, error_subcode: 463 } }).kind, "token");
  assert.equal(
    classifyGraphError(400, { error: { code: 10, message: "(#10) Not enough viewers for the media to show insights" } }).kind,
    "not_enough_viewers",
  );
  assert.equal(classifyGraphError(400, { error: { code: 10, message: "Permission denied" } }).kind, "permission");
  assert.equal(classifyGraphError(400, { error: { code: 200 } }).kind, "permission");
  assert.equal(classifyGraphError(400, { error: { code: 4 } }).kind, "rate_limit");
  assert.equal(classifyGraphError(400, { error: { code: 100 } }).kind, "unsupported");
  const error = classifyGraphError(400, { error: { code: 190, message: `token ${token}` } });
  assert.ok(!error.message.includes(token));
});

function fakeGraph(routes) {
  const calls = [];
  const fetchImpl = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    const metric = url.searchParams.get("metric");
    const key = `${url.pathname}${metric ? `?${metric}` : ""}`;
    const route = routes[key];
    if (!route) return new Response(JSON.stringify({ error: { code: 100 } }), { status: 400 });
    const [status, body] = route;
    return new Response(JSON.stringify(body), { status });
  };
  return { fetchImpl, calls };
}

test("code exchange reads the token and granted permissions in the documented format", async () => {
  const { fetchImpl } = fakeGraph({
    "/oauth/access_token": [
      200,
      { data: [{ access_token: "curto", user_id: "1", permissions: "instagram_business_basic,instagram_business_manage_insights" }] },
    ],
  });
  const result = await exchangeCodeForToken(
    { appId: "1", appSecret: "s", redirectUri: "https://x.test/cb", code: "c" },
    fetchImpl,
  );
  assert.deepEqual(result, {
    accessToken: "curto",
    permissions: ["instagram_business_basic", "instagram_business_manage_insights"],
  });
});

test("metrics the API does not return stay empty with a reason, never zero", async () => {
  const id = "17841400000000001";
  const { fetchImpl, calls } = fakeGraph({
    "/v26.0/me": [200, { id: "900", user_id: id, username: "criadora", account_type: "MEDIA_CREATOR", followers_count: 4200, media_count: 80 }],
    [`/v26.0/${id}/insights?views`]: [200, { data: [{ name: "views", total_value: { value: 15000 } }] }],
    [`/v26.0/${id}/insights?reach`]: [400, { error: { code: 10, message: "Permission denied" } }],
    [`/v26.0/${id}/stories`]: [200, { data: [{ id: "111", timestamp: "2026-10-30T12:00:00+0000", permalink: "https://www.instagram.com/stories/x/111" }, { id: "222" }] }],
    "/v26.0/111/insights?reach": [200, { data: [{ name: "reach", values: [{ value: 1300 }] }] }],
    "/v26.0/111/insights?views": [200, { data: [{ name: "views", values: [{ value: 1800 }] }] }],
    "/v26.0/222/insights?reach": [400, { error: { code: 10, message: "(#10) Not enough viewers for the media to show insights" } }],
    "/v26.0/222/insights?views": [200, { data: [] }],
  });

  const metrics = await collectInstagramMetrics(
    {
      accessToken: token,
      grantedScopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      now: new Date("2026-10-31T00:00:00Z"),
    },
    fetchImpl,
  );
  assert.equal(metrics.followersCount, 4200);
  assert.equal(metrics.accountViews, 15000);
  assert.equal(metrics.accountReach, null);
  assert.equal(metrics.unavailable.account_reach, "permission_missing");
  assert.deepEqual(metrics.stories[0], {
    mediaId: "111",
    postedAt: "2026-10-30T12:00:00+0000",
    permalink: "https://www.instagram.com/stories/x/111",
    views: 1800,
    reach: 1300,
    unavailable: {},
  });
  assert.equal(metrics.stories[1].reach, null);
  assert.equal(metrics.stories[1].views, null);
  assert.deepEqual(metrics.stories[1].unavailable, { reach: "not_enough_viewers", views: "no_data" });
  // O período das métricas da conta é de 28 dias.
  const insightCall = calls.find((url) => url.searchParams.get("metric") === "views" && url.pathname.includes(id));
  assert.equal(
    Number(insightCall.searchParams.get("until")) - Number(insightCall.searchParams.get("since")),
    28 * 24 * 60 * 60,
  );
});

test("without the insights permission only the profile is read", async () => {
  const { fetchImpl, calls } = fakeGraph({
    "/v26.0/me": [200, { id: "900", user_id: "5", username: "loja", followers_count: 10 }],
  });
  const metrics = await collectInstagramMetrics(
    { accessToken: token, grantedScopes: ["instagram_business_basic"] },
    fetchImpl,
  );
  assert.equal(calls.length, 1);
  assert.equal(metrics.accountViews, null);
  assert.equal(metrics.unavailable.account_views, "permission_missing");
  assert.equal(metrics.unavailable.stories, "permission_missing");
});

test("an expired or revoked token stops the collection so the creator reconnects", async () => {
  const { fetchImpl } = fakeGraph({
    "/v26.0/me": [400, { error: { code: 190, message: "Error validating access token" } }],
  });
  await assert.rejects(
    collectInstagramMetrics({ accessToken: token, grantedScopes: [] }, fetchImpl),
    (error) => error instanceof InstagramApiError && error.kind === "token",
  );
});

function box(type, body) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length);
  header.write(type, 4, "latin1");
  return Buffer.concat([header, body]);
}

function mvhd(timescale, duration) {
  const body = Buffer.alloc(100);
  body.writeUInt8(0, 0); // versão 0
  body.writeUInt32BE(timescale, 12);
  body.writeUInt32BE(duration, 16);
  return box("mvhd", body);
}

test("recording duration and type are read from the MP4/MOV boxes", () => {
  const ftyp = box("ftyp", Buffer.from("isom\0\0\0\0isomiso2", "latin1"));
  const file = new Uint8Array(
    Buffer.concat([ftyp, box("mdat", Buffer.alloc(32)), box("moov", mvhd(600, 600 * 45))]),
  );
  assert.equal(detectRecordingType(file), "video/mp4");
  assert.equal(readRecordingDuration(file), 45);

  const mov = new Uint8Array(Buffer.concat([box("ftyp", Buffer.from("qt  \0\0\0\0", "latin1")), box("moov", mvhd(1000, 12500))]));
  assert.equal(detectRecordingType(mov), "video/quicktime");
  assert.equal(readRecordingDuration(mov), 12.5);

  const png = new Uint8Array(Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"));
  assert.equal(detectRecordingType(png), null);
  assert.equal(readRecordingDuration(new Uint8Array(ftyp)), null);
});

test("recording path must be the user's folder with a random file name", () => {
  const user = "10000000-0000-4000-8000-000000000001";
  assert.ok(recordingPathPattern.test(`${user}/11111111-1111-4111-8111-111111111111.mp4`));
  assert.ok(!recordingPathPattern.test(`${user}/../outro.mp4`));
  assert.ok(!recordingPathPattern.test(`${user}/11111111-1111-4111-8111-111111111111.exe`));
});
