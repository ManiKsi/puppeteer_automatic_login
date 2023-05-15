const express = require("express");
const { hrPunch } = require("./punch");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/punch", (req, res) => {
  hrPunch();
});


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
