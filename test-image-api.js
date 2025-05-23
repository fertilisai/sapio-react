// Test script for image generation API
import fetch from "node-fetch";

async function testImageGeneration() {
  try {
    console.log("Testing OpenAI image generation API...");

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-2",
          prompt: "A test image of a simple red square",
          n: 1,
          size: "256x256",
          response_format: "b64_json",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return;
    }

    const data = await response.json();
    console.log("Success! Response structure:", {
      hasData: !!data.data,
      dataLength: data.data?.length,
      firstImageKeys: data.data?.[0] ? Object.keys(data.data[0]) : null,
      b64_jsonLength: data.data?.[0]?.b64_json?.length,
    });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testImageGeneration();
