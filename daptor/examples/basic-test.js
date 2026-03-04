const { remote } = require('webdriverio');

/**
 * Example: Running a simple test on a DAPTOR-managed instance.
 * You can loop this across the devices returned by Orchestrator.run().
 */
async function runTest(deviceId, appiumPort) {
  const opts = {
    path: '/',
    port: appiumPort,
    capabilities: {
      platformName: "Android",
      "appium:deviceName": deviceId,
      "appium:automationName": "UiAutomator2",
      "appium:app": "/path/to/your/app.apk", // Replace with real APK
      "appium:ensureWebviewsHavePages": true,
      "appium:nativeWebScreenshot": true,
      "appium:newCommandTimeout": 3600,
      "appium:connectHardwareKeyboard": true
    }
  };

  const driver = await remote(opts);
  
  try {
    console.log(`[Test] Started on ${deviceId}`);
    // Your test logic here...
    // await driver.$('~login').click();
    
  } finally {
    await driver.deleteSession();
    console.log(`[Test] Finished on ${deviceId}`);
  }
}

module.exports = { runTest };
