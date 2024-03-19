// API resquest to openai
const apiKeyStored = JSON.parse(localStorage.getItem("api-key"));
export default async function sendRequest(messages) {
  setLoading(true);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKeyStored,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: Number(localStorage.getItem("max-tokens")),
      temperature: Number(localStorage.getItem("temperature")),
      top_p: Number(localStorage.getItem("top-p")),
      // frequency_penalty: Number(localStorage.getItem("frequency_penalty")),
      // presence_penalty: Number(localStorage.getItem("presence_penalty")),
    }),
  })
    .then((res) => res.json())
    .then((res) => res.choices[0].message.content)
    .catch((error) => console.log(error));

  setResult(res);
  setLoading(false);
  setError(error);
}
