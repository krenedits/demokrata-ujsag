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
            Almenü: subMenu,
        } = data;
        const release = rawRelease.padStart(2, '0');
        let page;
        try {
            page = fileList[year][release][pageNumber - 1];
        } catch (error) {
            console.error('Hiányzó szám:', year, release, pageNumber);
            return;
        }
        // author to capitalized every word
        author = replaceToHungarianAccents(author)
            .split(' ')
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' ');
        if (!page?.articles) {
            page.articles = [];
        }

        const title =
            replaceToHungarianAccents(text).split(':')[1]?.trim() ?? subMenu;
        page.articles.push({
            author,
            title: [subMenu, title].filter(Boolean).join(' - '),
        });
    })
    .on('end', function () {
        writeFileSync('./src/fileList.json', JSON.stringify(fileList, null, 2));
    });
