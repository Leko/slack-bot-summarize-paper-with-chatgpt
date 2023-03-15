main();

async function main() {
  const today = new Date();
  const yesterday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1
  );
  const ids = await getPaperIDsOn(yesterday);
  const p = ids.map(async (id: string) => {
    const summary = await getPaperSummaryByID(id);
    const authors = summary.result[id].authors
      .filter((a: any) => a.authtype === "Author")
      .map((a: any) => a.name)
      .join(", ");
    const title = summary.result[id].title;
    const pubdate = summary.result[id].pubdate;
    const elocationid = summary.result[id].elocationid;
    const paperSummary = `${authors}. (${pubdate}). ${title} ${elocationid}`;
    const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${id}`;

    const res = await callChatGPT([
      {
        role: "user",
        content: process.env.PROMPT_PREFIX + "\n" + paperSummary,
      },
    ]);
    const paragraphs = res.choices.map((c: any) => c.message.content.trim());
    const text = `新着の論文です。\n要約：${paragraphs.join(
      "\n"
    )}\n\n論文：${paperSummary}\n${pubmedUrl}`;

    await fetch(process.env.SLACK_INCOMING_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }).then((res) => res.text());
  });

  await Promise.all(p);
}

function toYYYYMMDD(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("/");
}

async function getPaperIDsOn(date: Date) {
  const searchUrl = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
  );
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("sort", "pub_date");
  searchUrl.searchParams.set("term", process.env.PUBMED_QUERY!);
  searchUrl.searchParams.set("mindate", toYYYYMMDD(date));
  searchUrl.searchParams.set("maxdate", toYYYYMMDD(date));

  const res = await fetch(searchUrl).then((res) => res.json());
  return res.esearchresult.idlist;
}

async function getPaperSummaryByID(id: string) {
  const summaryUrl = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
  );
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("id", id);
  return fetch(summaryUrl).then((res) => res.json());
}

async function callChatGPT(messages: { role: string; content: string }[]) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
    }),
  }).then((res) => res.json());
}
