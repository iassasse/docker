const express = require("express");
const app = express();
const port = 4000;

app.use(express.json());

// كنجيبو الداتا من JSON
let equipes = require("./equipe.json");


// =======================
// ✅ GET ALL
// =======================
app.get("/equipe", (req, res) => {
    res.json(equipes);
});


// =======================
// ✅ GET BY ID
// =======================
app.get("/equipe/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const foundEquipe = equipes.find(e => e.id === id);

    if (!foundEquipe) {
        return res.status(404).json({ message: "Equipe not found" });
    }

    res.json(foundEquipe);
});


// =======================
// ✅ POST
// =======================
app.post("/equipe", (req, res) => {
    const newEquipe = {
        id: equipes.length + 1,
        name: req.body.name,
        country: req.body.country
    };

    equipes.push(newEquipe);

    res.status(201).json(newEquipe);
});


// =======================
// ✅ PUT
// =======================
app.put("/equipe/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const foundEquipe = equipes.find(e => e.id === id);

    if (!foundEquipe) {
        return res.status(404).json({ message: "Equipe not found" });
    }

    foundEquipe.name = req.body.name || foundEquipe.name;
    foundEquipe.country = req.body.country || foundEquipe.country;

    res.json(foundEquipe);
});


// =======================
// ✅ DELETE
// =======================
app.delete("/equipe/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const index = equipes.findIndex(e => e.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Equipe not found" });
    }

    const deletedEquipe = equipes.splice(index, 1);

    res.json(deletedEquipe);
});


// =======================
// 🚀 START SERVER
// =======================
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});