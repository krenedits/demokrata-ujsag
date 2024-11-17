import { createReadStream, readFileSync, writeFileSync } from 'fs';
import csv from 'csv-parser';

const fileList = JSON.parse(readFileSync('./src/fileList.json', 'utf-8'));

const replaceToHungarianAccents = (text) =>
    text
        .replaceAll('õ', 'ő')
        .replaceAll('Õ', 'Ő')
        .replaceAll('û', 'ű')
        .replaceAll('Û', 'Ű');

createReadStream('Demokrata.csv', { encoding: 'binary' })
    .pipe(csv({ separator: ';' }))
    .on('data', function (data) {
        let {
            Év: year,
            Lapszám: rawRelease,
            Oldal: pageNumber,
            Szöveg: text,
            Szerzõ: author,
        } = data;
        const release = rawRelease.padStart(2, '0');
        const page = fileList[year][release][pageNumber - 1];
        // author to capitalized every word
        author = replaceToHungarianAccents(author)
            .split(' ')
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' ');
        if (!page.articles) {
            page.articles = [];
        }

        const title = replaceToHungarianAccents(text).split(':')[1].trim();
        page.articles.push({ author, title });
    })
    .on('end', function () {
        writeFileSync('./src/fileList.json', JSON.stringify(fileList, null, 2));
    });
