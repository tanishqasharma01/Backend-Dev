function capitalize(str) {
    return str.toUpperCase();
}

function reverseString(str) {
    return str.split("").reverse().join("");
}


function countVowels(str) {
    let vowels = "aeiouAEIOU";
    let count = 0;

    for (let ch of str) {
        if (vowels.includes(ch)) {
            count++;
        }
    }
    return count;
}
module.exports = {
    capitalize,
    reverseString,
    countVowels
};