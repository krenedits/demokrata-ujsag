import fileList from '../../fileList.json';
import { FileList, ImageEntry } from '../../types';

const typedFileList = fileList as FileList;

const articles = Object.values(typedFileList)
    .flatMap(Object.values)
    .flatMap((e) => e as ImageEntry[])
    .flatMap((e) => e.articles ?? []);

const getAuthors = () => {
    return Array.from(new Set(articles.map((e) => e.author))).sort();
};

const compare = (a: string, b: string) => {
    return a.localeCompare(b);
};

const getTitles = (author: string) => {
    if (author) {
        return Array.from(
            new Set(
                articles.filter((e) => e.author === author).map((e) => e.title)
            )
        ).sort(compare);
    }

    return Array.from(new Set(articles.map((e) => e.title))).sort(compare);
};

const parseImagePath = (imagePath: string) => {
    // Expected format: "/images/YYYY/YYYY-RR-PP.jpg" or "/images/YYYY/YYYY-RR-PP_V.jpg"
    // or "./images/..."
    const parts = imagePath.replace('./', '').split('/');
    const year = parts[2];
    const filename = parts[3];
    
    if (!filename) return { year, release: '', page: '', version: '' };

    const nameParts = filename.split('.')[0].split('-');
    const release = nameParts[1];
    
    const pageAndVersion = nameParts[2].split('_');
    const page = pageAndVersion[0];
    const version = pageAndVersion[1] || '';

    return {
        year,
        release,
        page,
        version
    };
};

export { getAuthors, getTitles, parseImagePath, typedFileList };
