const express = require("express");
const api = require("./api");
const fs = require("fs");

const app = express();
const port = 3333;

app.get("/partidos", async (req, res) => {
  try {
    const response = await api.get(
      "partidos?ordem=ASC&ordenarPor=sigla&pagina=1&itens=45"
    );
    res.send(response.data.dados);
  } catch (err) {
    res.send(err);
  }
});

app.get("/deputados", async (req, res) => {
  try {
    const response = await api.get("deputados");
    res.send(response.data.dados);
  } catch (err) {
    res.send(err);
  }
});

function getGastos(idDeputado) {
  return new Promise(async (res, rej) => {
    callFunc(idDeputado);
    async function callFunc(id) {
      try {
        const response = await api.get(`deputados/${id}/despesas`);
        for(let i = 0; i < response.data.dados.length; i ++) {
          response.data.dados[i].idDeputado = id;                             
        }
        res(response);
      } catch (err) {
        console.log(err);
        callFunc(id);
      }
    }
  });
}

app.get("/gastosPorDeputado", async (req, res) => {
  try {
    const gastos = { dados: [] };
    const promises = [];
    const deputados = await api.get("deputados");
    for (let i = 0; i < deputados.data.dados.length; i++) {
      const gastoDeputado = await getGastos(deputados.data.dados[i].id);
      console.log(`${i + 1} de ${deputados.data.dados.length}`);
      gastos.dados = gastos.dados.concat(gastoDeputado.data.dados);
      if (i === deputados.data.dados.length - 1) {
        Promise.all(promises).then(() => {
          const date = new Date();
          const dateFormatted = `${date.getDate()}_${
            date.getMonth() + 1
          }_${date.getFullYear()}`;
          fs.writeFile(
            `json_gastos_${dateFormatted}.json`,
            JSON.stringify(gastos),
            function (err) {
              if (err) throw err;
              const file = `json_gastos_${dateFormatted}.json`;
              res.download(file);
              console.log("Saved!");
            }
          );
        });
      }
    }
  } catch (err) {
    res.send(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
