import { By, until } from "selenium-webdriver";

export async function waitForElements(driver, className, timeout = 5000) {
  await driver.wait(until.elementsLocated(By.className(className)), timeout);
}

export async function waitForPageLoad(driver, timeout = 10000) {
  await driver.wait(async function () {
    const readyState = await driver.executeScript("return document.readyState");
    return readyState === "complete";
  }, timeout);
}

export async function findElementInIframe(
  driver,
  iframeSelector,
  elementSelector
) {
  const iframe = await driver.findElement(By.css(iframeSelector));
  await driver.switchTo().frame(iframe);
  await waitForElements(driver, elementSelector);
  const elements = await driver.findElements(By.css(elementSelector));
  await driver.switchTo().defaultContent();
  return elements;
}
