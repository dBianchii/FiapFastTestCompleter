import { Builder, By, Key, until } from "selenium-webdriver";
import "chromedriver";
import { waitForPageLoad } from "./helpers.js";
import { CallOpenAI } from "./openai.js";
import "dotenv/config";
(async function main() {
  let driver = await new Builder().forBrowser("chrome").build();

  await login();
  const fastTestPage =
    "https://on.fiap.com.br/mod/conteudoshtml/view.php?id=326083&c=9190&sesskey=HctkMv4GmL";
  await driver.get(fastTestPage);

  await waitForPageLoad(driver);
  //wait until the iframe is in view
  await driver.wait(until.elementLocated(By.css("#iframecontent")));
  const iframeElement = await driver.findElement(By.css("#iframecontent"));
  await driver.switchTo().frame(iframeElement);

  const elements = await driver.findElements(By.css(".on-fast-test-item"));

  if (!elements) throw new Error("No elements found");
  let selectedAnswers = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const text = await element.getText();
    const parts = text.split("\n");

    const questionText = parts[1];
    const options = parts.slice(2);

    const optionA = options[0] + " - " + options[1];
    const optionB = options[2] + " - " + options[3];
    const optionC = options[4] + " - " + options[5];
    const optionD = options[6] + " - " + options[7];
    const optionE = options[8] + " - " + options[9];

    const prefix =
      "Apenas responda a pergunta com uma letra maíuscula, como 'D', ou 'C'. Não explique sua resposta.";
    const prompt =
      prefix +
      "\n" +
      questionText +
      "\n" +
      optionA +
      "\n" +
      optionB +
      "\n" +
      optionC +
      "\n" +
      optionD +
      "\n" +
      optionE;
    const chatgptResult = await CallOpenAI(prompt);

    const result = chatgptResult.content[chatgptResult.content.length - 1];

    //get all labels with on-fast-test-question-container inside the element
    const questionContainer = await element.findElements(
      By.css(".on-fast-test-question-container")
    );
    for (let j = 0; j < questionContainer.length; j++) {
      const dataAnswerId = await questionContainer[j].getAttribute(
        "data-answer-id"
      );

      //get the li element inside it
      const answer = (
        await questionContainer[j]
          .findElement(By.css(`li`))
          .getAttribute("innerHTML")
      ).toUpperCase();
      if (answer === result) {
        await driver.executeScript(
          `document.querySelector('[data-answer-id="${dataAnswerId}"] .on-fast-test-question-box').click()`
        );

        selectedAnswers.push({
          questionId: await element.getAttribute("data-question-id"),
          dataAnswerId,
        });
      }
    }
  }
  console.log(selectedAnswers);

  async function login() {
    await driver.get("https://on.fiap.com.br/index.php");
    await driver
      .findElement(By.id("username"))
      .sendKeys(process.env.FIAP_USERNAME);
    await driver
      .findElement(By.id("password"))
      .sendKeys(process.env.FIAP_PASSWORD);
    await driver.findElement(By.id("loginbtn")).click();
  }
})();
