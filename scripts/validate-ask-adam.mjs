const baseUrl = process.env.ASK_ADAM_TEST_URL ?? "http://localhost:3000";

const questions = [
  "Who is Adam Wisher?",
  "Tell me about Adam's professional background.",
  "How many years of experience does Adam have?",
  "What are Adam's strongest skills?",
  "What industries has Adam worked in?",
  "What leadership experience does Adam have?",
  "Show me Adam's AI experience.",
  "Does Adam have practical experience with AWS Bedrock?",
  "What AI product has Adam worked on?",
  "Tell me about Adam's AI-powered Product Assistant.",
  "What Generative AI training has Adam completed?",
  "Does Adam have an AWS certification?",
  "What AWS training has Adam completed?",
  "What is Adam's technical background?",
  "Does Adam know Python?",
  "What Python training has Adam completed?",
  "What CRM and ERP systems has Adam worked with?",
  "What is Adam's Salesforce experience?",
  "What is Adam's experience with CPQ?",
  "Has Adam worked with OpenBOM and SOLIDWORKS?",
  "What automation experience does Adam have?",
  "What Product Management experience does Adam have?",
  "What is Adam's product leadership experience?",
  "What is Adam's Product Operations experience?",
  "What product strategy experience does Adam have?",
  "What is Adam's product discovery experience?",
  "What experience does Adam have with product analytics?",
  "What experience does Adam have with A/B testing?",
  "Has Adam managed cross-functional teams?",
  "What product lifecycle experience does Adam have?",
  "What is Adam's experience with product-data architecture?",
  "Which projects should I look at?",
  "Tell me about Adam's strongest projects.",
  "Tell me about the INNOVA Product Assistant.",
  "Tell me about INNOVA's unified product-data ecosystem.",
  "Tell me about the Check2Go project.",
  "Tell me about the Clean Cup digital ecosystem.",
  "Did Adam build mobile applications?",
  "What e-commerce products has Adam launched?",
  "Tell me about the online car-sales platform.",
  "What enterprise automation projects has Adam delivered?",
  "What measurable results has Adam achieved?",
  "How did Adam reduce operational costs?",
  "How much did Adam reduce operational costs at Clean Cup?",
  "Did Adam increase B2C revenue?",
  "How did Adam grow online retail revenue?",
  "How quickly did Adam launch the Clean Cup e-commerce platform?",
  "What results did Adam achieve at Clean Cup?",
  "What did Adam achieve at INNOVA?",
  "What did Adam accomplish at Atlant-M?",
  "What business-process improvements did Adam deliver at Belagro?",
  "Where does Adam work now?",
  "What does Adam do at INNOVA?",
  "What was Adam's role at Check2Go?",
  "What did Adam do at Clean Cup?",
  "What was Adam's role at Atlant-M?",
  "What did Adam accomplish at Belagro?",
  "What was Adam responsible for at ZIKO?",
  "Where did Adam start his career?",
  "Tell me about Adam's career progression.",
  "Has Adam founded a startup?",
  "What is Adam's education?",
  "Where did Adam study Product Management?",
  "Tell me about Adam's Yandex Practicum education.",
  "What Product Management education does Adam have?",
  "What degree does Adam have?",
  "Where did Adam study economics?",
  "What did Adam study at Minsk Innovation University?",
  "What AI-related courses has Adam completed?",
  "What Product Management courses has Adam completed?",
  "What Agile and Scrum training has Adam completed?",
  "What Jira training has Adam completed?",
  "What Salesforce training has Adam completed?",
  "What UX Research training has Adam completed?",
  "What analytics and A/B testing courses has Adam completed?",
  "What communication training has Adam completed?",
  "Has Adam completed public-speaking training?",
  "Has Adam studied negotiation?",
  "What presentation training has Adam completed?",
  "What SAP training has Adam completed?",
];

const failures = [];
for (const question of questions) {
  try {
    const response = await fetch(`${baseUrl}/api/ask-adam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const body = await response.json();
    const answer = typeof body.answer === "string" ? body.answer : "";
    const insufficient = answer.toLowerCase().includes("don't have enough verified information");
    if (!response.ok || !answer || insufficient) failures.push({ question, status: response.status, answer });
  } catch (error) {
    failures.push({ question, status: 0, answer: error instanceof Error ? error.message : String(error) });
  }
}

console.log(`Checked ${questions.length} questions: ${questions.length - failures.length} passed, ${failures.length} failed.`);
for (const failure of failures) console.log(`FAIL: ${failure.question}\n  ${failure.status}: ${failure.answer}`);
if (failures.length) process.exitCode = 1;
