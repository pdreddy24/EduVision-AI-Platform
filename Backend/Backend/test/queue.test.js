import assert from "node:assert/strict";
import test from "node:test";
import { redisConnectionOptions } from "../services/redisConnection.js";

test("builds local Redis connection options", () => {
  assert.deepEqual(redisConnectionOptions("redis://localhost:6380/2"), {
    host: "localhost", port: 6380, db: 2, maxRetriesPerRequest: null,
  });
});

test("builds authenticated TLS Redis connection options", () => {
  const options = redisConnectionOptions("rediss://app:secret@cache.example.com:6379");
  assert.equal(options.username, "app");
  assert.equal(options.password, "secret");
  assert.deepEqual(options.tls, {});
});
