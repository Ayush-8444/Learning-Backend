import express from 'express'

const app = express()

app.get("/", (req,res) => {
    res.send("hello")
})

app.get("/userlist", (req, res) => {
    const users = [{
        id:1,
        user: "ayush",
        password: "ayush2"
    }, {
        id:2,
        user: "ayush friend",
        password: "ayushfriend2"
    }, {
        id: 3,
        user: "ayush third friend",
        password: "ayushthirdfriend3"
    }
    ]

    res.send(users)
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`serve at http://localhost:${port}`)
})