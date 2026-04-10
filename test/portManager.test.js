"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const PortManager = require("../src/core/PortManager");

test("PortManager cycles through appium pool", () => {
  const manager = new PortManager({ appiumPool: [4723, 4724] });
  assert.equal(manager.getAppiumPort(0), 4723);
  assert.equal(manager.getAppiumPort(1), 4724);
  assert.equal(manager.getAppiumPort(2), 4723);
});

test("PortManager releases held ports", async () => {
  const manager = new PortManager({ adbRange: [5554, 5556] });
  const first = await manager.getNextAdbPort();
  manager.releasePort(first);
  const second = await manager.getNextAdbPort();
  assert.equal(first, second);
});
