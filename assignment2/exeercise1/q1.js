let fs = require("fs");

function readFile() {
    fs.readFile("a.txt", "utf-8", (err, data) => {
        if (err) throw err;
        console.log("File data:");
        console.log(data);
    });
}

function countWords() {
    fs.readFile("a.txt", "utf-8", (err, data) => {
        if (err) throw err;

        let words = data.split(" ");
        let count = words.length;

        console.log("Total words:", count);

        fs.writeFile("output.txt", "Total words: " + count, (err) => {
            if (err) throw err;
            console.log("Result written successfully");
        });
    });
}


readFile();
countWords();
