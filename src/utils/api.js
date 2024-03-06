// API resquest to openai
export default async function sendRequest(messages) {
  // console.log(messages);
  // setLoading(true);
  const apiKeyStored = JSON.parse(localStorage.getItem("api-key"));

  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKeyStored,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 256,
      temperature: 0.7,
      top_p: 1,
      // frequency_penalty: frequence,
      // presence_penalty: presence,
    }),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));

  // console.log(response.choices[0].message.content);
  //console.log(response);

  const r = await handleResponse(response);
  // const r = await response.choices[0].message.content;
  // console.log(r);
  return r;
}

export function handleResponse(response) {
  // console.log(response);
  let answer = response.choices[0].message.content;
  return answer;
}
