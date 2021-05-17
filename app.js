require("dotenv/config");

const express = require("express");
const morgan = require("morgan");

const mongoose = require("mongoose");

const app = express();

const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan("dev"));

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.men9r.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    }

    console.log("DB Connected");
  }
);

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
