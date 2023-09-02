import { Builder, By, Key, until } from "selenium-webdriver";
import "chromedriver";
import { waitForPageLoad } from "./helpers.js";
import { CallOpenAI } from "./openai.js";
import "dotenv/config";
import promptSync from "prompt-sync";
(async function main() {
  let driver = await new Builder().forBrowser("chrome").build();

  await login();
  const fastTestPage =
    "https://on.fiap.com.br/mod/conteudoshtml/view.php?id=326087&c=9190&sesskey=HctkMv4GmL";
  await driver.get(fastTestPage);

  await waitForPageLoad(driver);
  //wait until the iframe is in view
  await driver.wait(until.elementLocated(By.css("#iframecontent")));
  const iframeElement = await driver.findElement(By.css("#iframecontent"));
  await driver.switchTo().frame(iframeElement);

  const elements = await driver.findElements(By.css(".on-fast-test-item"));

  if (!elements) throw new Error("No elements found");
  let selectedAnswers = [];

  console.log("Found", elements.length, "questions. Continue? (y/n)");
  const prompt = promptSync();
  const answer = prompt("> ");
  if (answer !== "y") return;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    const questionContainer = await element.findElement(
      By.css(".on-fast-test-question")
    );
    let questionText = "";
    const numberOfElementsInsideQuestionContainer =
      await questionContainer.findElements(By.css("*"));
    if (
      numberOfElementsInsideQuestionContainer &&
      numberOfElementsInsideQuestionContainer.length === 2
    ) {
      //normal question.
      questionText = await questionContainer.findElement(By.css("p")).getText();
    } else {
      //question with more stuff in it
      questionText = await questionContainer.getAttribute("innerHTML");
    }
    questionText = questionText.trim();

    //get innerHTML of p tag that is inside each on-fast-test-question-box
    //get all on-fast-test-question-box
    const answerBoxes = await element.findElements(
      By.css(".on-fast-test-question-box")
    );

    async function getOptionText(answerBox) {
      const numberOfElementsInsideAnswerBox = await answerBox.findElements(
        By.css("*")
      );
      if (numberOfElementsInsideAnswerBox.length === 6) {
        return (
          await answerBox.findElement(By.css("p")).getAttribute("innerHTML")
        ).trim();
      } else {
        return await answerBox.getAttribute("innerHTML");
      }
    }

    const optionA = "A - " + (await getOptionText(answerBoxes[0]));
    const optionB = "B - " + (await getOptionText(answerBoxes[1]));
    const optionC = "C - " + (await getOptionText(answerBoxes[2]));
    const optionD = "D - " + (await getOptionText(answerBoxes[3]));
    const optionE = "E - " + (await getOptionText(answerBoxes[4]));

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

    const questionContainers = await element.findElements(
      By.css(".on-fast-test-question-container")
    );
    for (let j = 0; j < questionContainers.length; j++) {
      const dataAnswerId = await questionContainers[j].getAttribute(
        "data-answer-id"
      );
      //get the li element inside it
      const answer = (
        await questionContainers[j]
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
  console.log("Done!", selectedAnswers.length, "answers selected.");

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
