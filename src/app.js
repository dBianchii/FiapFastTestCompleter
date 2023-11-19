import { Builder, By, Key, until } from "selenium-webdriver";
import "chromedriver";
import { waitForPageLoad } from "./helpers.js";
import { CallOpenAI } from "./openai.js";
import "dotenv/config";
import promptSync from "prompt-sync";

let driver = await new Builder().forBrowser("chrome").build();

async function IrParaPagina(pagina) {
  await driver.get(pagina);

  await waitForPageLoad(driver);
  //wait until the iframe is in view
  await driver.wait(until.elementLocated(By.css("#iframecontent")));
  const iframeElement = await driver.findElement(By.css("#iframecontent"));
  await driver.switchTo().frame(iframeElement);

  await driver.wait(until.elementLocated(By.css(".on-fast-test-item")));
}

(async function main() {
  await login();
  await IrParaPagina(
    "https://on.fiap.com.br/mod/conteudoshtml/view.php?id=355329&c=9935&sesskey=wENCEJlh15"
  );

  EnviarResposts();
  //TentarNovamente();
})();

async function AnalizarEEnviarRespostas() {
  const elements = await driver.findElements(By.css(".on-fast-test-item"));
  if (!elements) throw new Error("No elements found");
  const selectedAnswers = [];

  console.log("Found", elements.length, "questions. Continue? (y/n)");
  const prompt = promptSync();
  const answer = prompt("> ");
  if (answer !== "y") return;
  console.log("Continuing...");

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    const [questionText, optionA, optionB, optionC, optionD, optionE] =
      await getOptionsAndQuestionText(element);

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

  console.log("Quer enviar estes resultados? (y/n)");
  const prompt2 = promptSync();
  const answer2 = prompt2("> ");
  if (answer2 !== "y") return;

  console.log(
    "Você tem certeza? Isso vai enviar as respostas para a FIAP. (y/n)"
  );
  const prompt3 = promptSync();
  const answer3 = prompt3("> ");
  if (answer3 !== "y") return;

  await driver.findElement(By.css(".on-button-finish-fast-test")).click(); //ENVIAR RESULTADOS

  //wait until on-fast-test-result-circle-position is visible
  await driver.wait(
    until.elementLocated(By.css(".on-fast-test-result-circle-color-blue"))
  );

  //get the on-fast-test-question-division
  const scoreString = await driver
    .findElement(By.css(".on-fast-test-question-division"))
    .getAttribute("innerHTML");

  // Split the cleaned string into two parts based on '/'
  const parts = scoreString.replace(/\s+/g, "").split("/");
  const leftPart = parseInt(parts[0], 10);
  const rightPart = parseFloat(parts[1]);
  const allRight = leftPart === rightPart;

  console.log("Score:", `${parts[0]}/${parts[1]}`);
  if (allRight)
    return console.log("All right! No need to analyze wrong answers.");

  console.log(
    "Você quer que o ChatGPT tente novamente? Ele vai analizar as suas respostas erradas, e selecionar de novo as que você já acertou. (y/n)"
  );
  const prompt4 = promptSync();
  const answer4 = prompt4("> ");
  if (answer4 !== "y") return;

  TentarNovamente();
}

async function TentarNovamente() {
  const elements = await driver.findElements(By.css(".on-fast-test-item"));

  const idsCorretos = await pegarIdsCorretos();
  const idsIncorretosJuntoComExplicacao =
    await pegarIdsIncorretosJuntoComExplicacao(elements);

  console.log(idsCorretos);
  console.log(idsIncorretosJuntoComExplicacao);

  await driver.findElement(By.css(".on-button-try-again-fast-test")).click();

  await driver.wait(
    until.elementLocated(By.css(".on-button-finish-fast-test"))
  );
  //INICIAR TENTAR NOVAMENTE

  const onFastTestItems = await driver.findElements(
    By.css(".on-fast-test-item")
  );

  for (let i = 0; i < onFastTestItems.length; i++) {
    const fastTestItem = onFastTestItems[i];

    const [questionText, optionA, optionB, optionC, optionD, optionE] =
      await getOptionsAndQuestionText(fastTestItem);

    idsCorretos.forEach((answerId) => {
      //get the .on-fast-test-question-container with the data-answer-id
      const questionContainer = fastTestItem
        .findElement(
          By.css(`[data-answer-id="${answerId}"] .on-fast-test-question-box`)
        )
        .click();
    });
    // const prefix =
    //   "Apenas responda a pergunta com uma letra maíuscula, como 'D', ou 'C'. Não explique sua resposta.";
    // const prompt =
    //   prefix +
    //   "\n" +
    //   questionText +
    //   "\n" +
    //   optionA +
    //   "\n" +
    //   optionB +
    //   "\n" +
    //   optionC +
    //   "\n" +
    //   optionD +
    //   "\n" +
    //   optionE;

    // const chatgptResult = await CallOpenAI(prompt);

    // const result = chatgptResult.content[chatgptResult.content.length - 1];

    // const questionContainers = await fastTestItem.findElements(
    //   By.css(".on-fast-test-question-container")
    // );
  }
}

async function getOptionsAndQuestionText(parentElement) {
  const answerBoxes = await parentElement.findElements(
    By.css(".on-fast-test-question-box")
  );

  const questionContainer = await parentElement.findElement(
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

  if (answerBoxes.length !== 5)
    throw new Error(
      `There should be 5 answer boxes, but there are ${answerBoxes.length}.`
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
  return [questionText, optionA, optionB, optionC, optionD, optionE];
}

async function pegarIdsCorretos() {
  //pegar ids que acertou
  const elements = await driver.findElements(
    By.css(".on-fast-test-question-container.on-fast-test-question-right")
  );

  const answers = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    const answerId = await element.getAttribute("data-answer-id");
    answers.push(answerId);
  }
  return answers;
}

async function pegarIdsIncorretosJuntoComExplicacao(elements) {
  let answers = [];
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    const wrongAnswer = await element.findElements(
      By.css(".on-fast-test-question-wrong")
    );
    if (wrongAnswer.length === 0) continue;

    const answerId = await wrongAnswer[0].getAttribute("data-answer-id");

    //get the p tag inside it
    //get on-fast-test-question-text
    const pergunta = await element
      .findElement(By.css(".on-fast-test-question-text"))
      .getAttribute("innerHTML");

    //pegar o on-fast-test-feedback
    //pegar o h3 que tem a explicação no innerHTML
    const explanation = await element
      .findElement(By.css(".on-fast-test-feedback"))
      .findElement(By.css("p"))
      .getAttribute("innerHTML");

    //pegar o on-fast-test-answer-text
    const respostaData = await element
      .findElement(By.css(".on-fast-test-question-box-selected"))
      .findElement(By.css(".on-fast-test-answer-text"))
      .getAttribute("innerHTML");

    answers.push({
      answerId,
      pergunta: pergunta.trim(),
      respostaData: respostaData.trim(),
      explanation: explanation.trim(),
    });
  }
  return answers;
}

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
