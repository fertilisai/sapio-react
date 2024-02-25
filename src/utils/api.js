// API resquest to openai (chat)
let sendRequestChat = async function (convo) {
  const msgs = JSON.parse(convo);

  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + openai_api_key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: chat_model,
      messages: msgs,
      max_tokens: max_tokens,
      temperature: temperature,
      top_p: top_p,
    }),
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));

  // console.log(response.choices[0].message.content);
  // console.log(response);

  const r = await handleResponseChat(response);
};
