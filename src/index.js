const express = require("express");
const shortid = require("shortid");
const connectDB = require("./data/db.config");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");

const app = express();
const utils = require("./utils/utils");
const Url = require("./data/models/url");
const { endOfDay, parseISO, format, startOfDay } = require("date-fns");
connectDB();

app.listen(process.env.PORT || 3000, () => {
  console.log("API funcionando com sucesso!");
});
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors());

app.get("/", (req, res) => {
  return res.status(200).send({ message: "Bem vindo à API" });
});

app.post("/short", async (req, res) => {
  const { url } = req.body;
  const urlId = shortid.generate();
  if (utils.validateUrl(url)) {
    try {
      let exists = await Url.findOne({ seedUrl: url }).exec();
      if (exists) {
        return res.status(201).send({
          message: "URL já existente",
          urlId: exists.shortUrl,
        });
      } else {
        const shortUrl = `${urlId}`;
        exists = Url({
          seedUrl: url,
          shortUrl,
          urlId,
          createdAt: Date.now(),
        });
        await exists.save();
        return res.status(200).send({
          message: "URL creada com sucesso!!!",
          urlId: exists.urlId,
          shortUrl: shortUrl,
        });
      }
    } catch (e) {
      throw new Error(e);
    }
  }
});

app.get("/short/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let exists = await Url.findOne({ urlId: id }).exec();
    if (exists) {
      return res.status(200).send({
        message: "URL encontrada",
        shortUrl: exists.shortUrl,
        seedUrl: exists.seedUrl,
      });
    } else {
      return res.status(404).send({
        message: "URL não consta na base de dados",
      });
    }
  } catch (e) {
    throw new Error(e);
  }
});
app.get("/shortenedAt/:date", async (req, res) => {
  const { date } = req.params;
  try {
    let exists = await Url.find({
      createdAt: {
        $gte: startOfDay(parseISO(date)),
        $lte: endOfDay(parseISO(date)),
      },
    }).exec();
    if (exists) {
      return res.status(200).send({
        message: `URLs encurtado em ${date}`,
        urls: exists,
      });
    } else {
      return res.status(404).send({
        message: "URLs não encontrado no banco de dados",
      });
    }
  } catch (e) {
    throw new Error(e);
  }
});
