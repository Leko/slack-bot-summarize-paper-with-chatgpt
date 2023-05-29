# Slack bot to summarize PubMed articles

A Slack bot that summarizes newly published articles matching specific PubMed search terms you specify using ChatGPT and posts them to Slack.

## Getting started

- Fork this repository
- Generate an API key for OpenAI
- Set it to the repository secret with the name OPENAI_API_KEY
- Generate the Incoming Webhook URL for Slack
- Register it in the repository secret with the name SLACK_INCOMING_WEBHOOK_URL
- Edit `PROMPT_PREFIX` and `PUBMED_QUERY` accordingly
