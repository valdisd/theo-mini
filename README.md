# Business Information Extractor

A full-stack Next.js 15 app that scrapes a company website, extracts structured business context using GPT-4o, and allows the user to query the results in natural language.

It focuses on extracting 3 key fields:

- **Company Mission/Vision**
- **Product Description**
- **Unique Value Proposition**

---

## ✨ Features

- 🔍 Scrapes website content with Playwright
- 🧠 Uses GPT-4o to extract 3 business data points
- 💬 Lets user query results with Strict or Open modes
- 🔗 Automatically includes the “About Us” page if found
- 🧱 Architecture designed to scale to 100+ data points

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommend LTS)
- pnpm (or npm)
- OpenAI API key

### Setup

```bash
git clone https://github.com/valdisd/theo
cd theo
pnpm install
cp .env.local.example .env.local  # Then edit and add your OpenAI key
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Usage

1. Paste a company website URL (e.g. `https://stripe.com`)
2. Choose **Strict** or **Open** query mode:
   - **Strict**: Answers based only on scraped content
   - **Open**: Allows LLM to bring in general knowledge
3. Click **Extract**
4. View structured data points in the UI
5. Ask follow-up questions in the query input

---

## ⚙️ Project Structure

- `src/app/api/extract/route.ts` – Scrapes + extracts using GPT
- `src/app/api/query/route.ts` – Handles follow-up questions
- `src/lib/scraper.ts` – Playwright scraping logic
- `src/config/constants.ts` – Config & prompts

---

## 🔧 Developer Commands

| Command              | Description                  |
|----------------------|------------------------------|
| `pnpm dev`           | Start local dev server        |
| `pnpm build`         | Build for production          |
| `pnpm start`         | Start production server       |
| `pnpm lint`          | Run ESLint                    |
| `pnpm type-check`    | Run TypeScript type checker   |

---

## 🌍 Example Company URLs

Try the extractor on:

- https://stripe.com
- https://notion.so
- https://shopify.com

---

## 🔐 Environment Variables

```env
OPENAI_API_KEY=your-api-key-here
```

Add this to `.env.local`.

---

## 📘 Notes

- This project was built as a timed 2-day technical task.
- Design emphasizes a working demo with scalable architecture.
- More details: [`notes.md`](./notes.md)

---

## 🧠 Credits

Made by [Valdis Dravnieks](https://github.com/valdisd) for THEO's backend engineer challenge.
