export interface Joke {
    type: "textual" | "image";
    content: string;
}

const jokes: Joke[] = [
    {
        type: "textual",
        content: "Kotak, kotak apa yang masuk neraka? Kotak-sembahyang!",
    },
    {
        type: "textual",
        content:
            "Kenapa gajah nggak pernah lupa? Karena dia pakai memori internal!",
    },
    {
        type: "textual",
        content: "Penyakit apa yang lebih dari dua? Tumor!",
    },
    {
        type: "textual",
        content:
            "Kenapa manusia punya dua ginjal? Karena kalau satu artinya ganjil",
    },
    {
        type: "textual",
        content:
            "Kenapa main basket ga boleh basah? Karena harus dimasukin ke-ring!",
    },
    {
        type: "textual",
        content:
            "Kenapa tukang cukur selalu menang balapan? Karena pakai teknik short-cut",
    },
    {
        type: "textual",
        content: "How do you call a Spanish guy who lost his car? CARLOS!",
    },
    {
        type: "textual",
        content:
            "Kenapa atlit boxxing juga bisa jadi tukang cukur? Karena bisa upper-cut",
    },
    {
        type: "textual",
        content:
            "Kenapa bakteri selalu bikin orang sakitnya belakangan? Karena kalau didepan artinya front-teri",
    },
    {
        type: "textual",
        content: "Merek sepatu apa yang jago nyanyi? Nike Ardilla",
    },
    {
        type: "textual",
        content: "Penyanyi mana yang mau jatuh? Iwan Fals",
    },
    {
        type: "textual",
        content: "Penyanyi mana yang iseng? Kurt Cobain",
    },
    {
        type: "textual",
        content: "Why the bicycle fall? Because it was two-tired!",
    },
    {
        type: "textual",
        content: "What kind of shoes do spy wear? Sneakers!",
    },
    {
        type: "textual",
        content: "Penyanyi mana yang suka jualan murah? Ed-cheeran",
    },
    {
        type: "textual",
        content:
            "Bapak-bapak kenapa kalau naik motor selalu ketawa-tawa? Soalnya dia duduk di atas jokes! xixixixi",
    },
    {
        type: "textual",
        content:
            "Apa yang bisa dibuka, bisa ditutup, dan suaranya berisik? DOOR!",
    },
    {
        type: "image",
        content: "https://cdn.howlingmoon.dev/memes/FB_IMG_1757930715562.jpg",
    },
    {
        type: "textual",
        content:
            "Kenapa orang Indonesia sering dipaksa nikah? Karea Indonesia negara marry-time",
    },
    {
        type: "textual",
        content:
            "Orang kalo dilemparin kalen coca-cola kira-kira sakit ga? Kagak lah! Kan soft-drink!",
    },
    {
        type: "image",
        content:
            "https://cdn.howlingmoon.dev/memes/yLJwOOGevp33OhR5hyVvlPlzDIZCXBRtY57cI-1X5hpeyNWgUtapZdlWO5t3Ng4gNqgk9Yrz6chtWQs640-rw-nd-v1.png",
    },
    {
        type: "textual",
        content: "Kenapa dinamakan Nasi Goreng? Karena Dina lapar!",
    },
    {
        type: "textual",
        content: "Penyanyi yang jago naik sepeda? Selena Gowez",
    },
    {
        type: "textual",
        content: "Bahasa inggrisnya ibu kecil? Mini-mum!",
    },
];

export function getRandomJoke(): Joke {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
}
