# CrakMax Question Paper Data Format

Add or update question papers in `script.js` inside the `questionPapers` object.

Use this structure:

```js
const questionPapers = {
  "2025": {
    title: "Andhra Pradesh EAMCET 2025",
    questions: [
      {
        id: 1,
        question: "Your question text",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 2
      }
    ]
  }
};
```

Rules:
1. `id` must be unique in one year.
2. `correctOptionIndex` starts from `0`.
3. For 4 choices: A=0, B=1, C=2, D=3.
4. Keep questions in original paper order.
