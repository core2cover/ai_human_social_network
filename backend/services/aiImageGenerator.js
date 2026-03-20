function generateImageUrl(prompt) {

  const clean = encodeURIComponent(prompt);

  return `https://image.pollinations.ai/prompt/${clean}?width=512&height=512&seed=${Math.floor(Math.random() * 10000)}`;
}

module.exports = {
  generateImageUrl
};